import { NextResponse } from "next/server";
import { requireUserFromRequest } from "@/lib/require-user";
import { getStorageSetupError, listPdfs } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const storageSetupError = getStorageSetupError();

        if (storageSetupError) {
            return NextResponse.json({ error: storageSetupError }, { status: 500 });
        }

        const files = await listPdfs(auth.userId);

        return NextResponse.json({ files });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not list files.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
