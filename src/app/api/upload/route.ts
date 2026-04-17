import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStorageSetupError, uploadPdf } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const MAX_LABEL_LENGTH = 120;

function noStoreJson(body: unknown, status = 200, extraHeaders?: HeadersInit) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
            ...extraHeaders,
        },
    });
}

function looksLikePdf(bytes: Uint8Array): boolean {
    return (
        bytes.length >= 5 &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2d
    );
}

export async function POST(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
        const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
        const rate = checkRateLimit({
            key: `upload:${auth.userId}:${ip}`,
            limit: 20,
            windowMs: 60_000,
        });

        if (!rate.ok) {
            return noStoreJson(
                { error: "Too many upload requests. Please retry shortly." },
                429,
                {
                    "Retry-After": String(rate.retryAfterSeconds),
                    "X-RateLimit-Remaining": String(rate.remaining),
                }
            );
        }

        const storageSetupError = getStorageSetupError();

        if (storageSetupError) {
            return noStoreJson({ error: storageSetupError }, 500);
        }

        const formData = await request.formData();
        const file = formData.get("file");
        const labelValue = formData.get("label");

        if (!(file instanceof File)) {
            return noStoreJson({ error: "No file uploaded." }, 400);
        }

        if (file.size <= 0) {
            return noStoreJson({ error: "Uploaded file is empty." }, 400);
        }

        const isPdfType = file.type === "application/pdf";
        const isPdfName = file.name.toLowerCase().endsWith(".pdf");

        if (!isPdfType && !isPdfName) {
            return noStoreJson({ error: "Only PDF files are allowed." }, 400);
        }

        if (file.size > MAX_PDF_SIZE_BYTES) {
            return noStoreJson({ error: "PDF must be 20MB or smaller." }, 400);
        }

        const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());

        if (!looksLikePdf(head)) {
            return noStoreJson({ error: "Invalid PDF signature." }, 400);
        }

        if (labelValue !== null && typeof labelValue !== "string") {
            return noStoreJson({ error: "Invalid label value." }, 400);
        }

        if (typeof labelValue === "string" && labelValue.trim().length > MAX_LABEL_LENGTH) {
            return noStoreJson({ error: "Label must be 120 characters or fewer." }, 400);
        }

        const desiredBaseName =
            typeof labelValue === "string" && labelValue.trim().length > 0
                ? labelValue.trim()
                : file.name.replace(/\.pdf$/i, "");
        const desiredFileName = desiredBaseName.toLowerCase().endsWith(".pdf")
            ? desiredBaseName
            : `${desiredBaseName}.pdf`;
        const sanitized = desiredFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const safeName = sanitized.length > 0 ? sanitized : "untitled.pdf";
        const storedFile = await uploadPdf({
            userId: auth.userId,
            safeName,
            file,
        });

        return noStoreJson({
            ok: true,
            file: {
                url: storedFile.url,
                pathname: storedFile.pathname,
                size: storedFile.size,
                uploadedAt: storedFile.uploadedAt,
                displayName: storedFile.displayName,
            },
        });
    } catch {
        return noStoreJson({ error: "Upload failed." }, 500);
    }
}
