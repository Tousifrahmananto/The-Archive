import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";

export const runtime = "nodejs";

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const token = process.env.BLOB_READ_WRITE_TOKEN;

        if (!token) {
            return NextResponse.json(
                {
                    error:
                        "Missing BLOB_READ_WRITE_TOKEN. Add it to .env.local for local dev or Vercel Project Settings for production.",
                },
                { status: 500 }
            );
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
        const blobPath = `${auth.userId}/${safeName}`;

        const blob = await put(blobPath, file, {
            access: "public",
            addRandomSuffix: true,
            token,
        });

        return NextResponse.json({
            ok: true,
            file: {
                url: blob.url,
                pathname: blob.pathname,
                size: file.size,
                uploadedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
