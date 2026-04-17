import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

        const { blobs } = await list({ token, prefix: `${auth.userId}/` });

        const files = blobs
            .filter((blob) => blob.pathname.toLowerCase().endsWith(".pdf"))
            .map((blob) => ({
                url: blob.url,
                pathname: blob.pathname,
                size: blob.size,
                uploadedAt: blob.uploadedAt,
            }))
            .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        return NextResponse.json({ files });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not list files.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
