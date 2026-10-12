import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { completePdfUpload, getStorageSetupError, preparePdfUpload, uploadPdf } from "@/lib/storage";
import { looksLikePdf, MAX_PDF_SIZE_BYTES } from "@/lib/pdf-upload";

export const runtime = "nodejs";

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

        const direct = request.headers.get("content-type")?.includes("application/json");
        let file: File | { name: string; type: string; size: number };
        let labelValue: unknown;
        if (direct) {
            const body = await request.json();
            if (!body || typeof body !== "object") {
                return noStoreJson({ error: "Invalid upload request." }, 400);
            }
            if (body.action === "complete" && typeof body.pathname === "string") {
                return noStoreJson({ ok: true, file: await completePdfUpload(auth.userId, body.pathname) });
            }
            if (body.action !== "prepare" || typeof body.name !== "string" || body.name.length > 255 ||
                typeof body.type !== "string" || !Number.isSafeInteger(body.size)) {
                return noStoreJson({ error: "Invalid upload request." }, 400);
            }
            file = { name: body.name, type: body.type, size: body.size };
            labelValue = body.label ?? null;
        } else {
            const formData = await request.formData();
            const uploadedFile = formData.get("file");
            if (!(uploadedFile instanceof File)) {
                return noStoreJson({ error: "No file uploaded." }, 400);
            }
            file = uploadedFile;
            labelValue = formData.get("label");
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

        if (file instanceof File && !looksLikePdf(new Uint8Array(await file.slice(0, 5).arrayBuffer()))) {
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
        if (!(file instanceof File)) {
            return noStoreJson(await preparePdfUpload(auth.userId, safeName));
        }
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
