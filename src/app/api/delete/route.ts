import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
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

        const body = (await request.json()) as { url?: string };

        if (!body.url) {
            return NextResponse.json({ error: "Missing file URL." }, { status: 400 });
        }

        const expectedPrefix = `/${auth.userId}/`;

        if (!body.url.includes(expectedPrefix)) {
            return NextResponse.json({ error: "Forbidden. Cannot delete this file." }, { status: 403 });
        }

        await del(body.url, { token });

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
