import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";
import { deletePdf, getStorageSetupError } from "@/lib/storage";

export const runtime = "nodejs";

export async function DELETE(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const storageSetupError = getStorageSetupError();

        if (storageSetupError) {
            return NextResponse.json({ error: storageSetupError }, { status: 500 });
        }

        const body = (await request.json()) as { url?: string; pathname?: string };

        if (!body.url && !body.pathname) {
            return NextResponse.json({ error: "Missing file URL or path." }, { status: 400 });
        }

        await deletePdf({
            userId: auth.userId,
            url: body.url,
            pathname: body.pathname,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";
        const status = message.startsWith("Forbidden") ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
