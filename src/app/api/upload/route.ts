import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";
import { getStorageSetupError, uploadPdf } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const storageSetupError = getStorageSetupError();

        if (storageSetupError) {
            return NextResponse.json({ error: storageSetupError }, { status: 500 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
        }

        const isPdfType = file.type === "application/pdf";
        const isPdfName = file.name.toLowerCase().endsWith(".pdf");

        if (!isPdfType && !isPdfName) {
            return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
        }

        if (file.size > MAX_PDF_SIZE_BYTES) {
            return NextResponse.json({ error: "PDF must be 20MB or smaller." }, { status: 400 });
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storedFile = await uploadPdf({
            userId: auth.userId,
            safeName,
            file,
        });

        return NextResponse.json({
            ok: true,
            file: {
                url: storedFile.url,
                pathname: storedFile.pathname,
                size: storedFile.size,
                uploadedAt: storedFile.uploadedAt,
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
