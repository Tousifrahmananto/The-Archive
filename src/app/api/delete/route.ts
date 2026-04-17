import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireUserFromRequest } from "@/lib/require-user";
import { deletePdf, getStorageSetupError } from "@/lib/storage";

export const runtime = "nodejs";

function noStoreJson(body: unknown, status = 200, extraHeaders?: HeadersInit) {
    return NextResponse.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
            ...extraHeaders,
        },
    });
}

function toSafeString(value: unknown): string | undefined {
    if (typeof value !== "string") {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

export async function DELETE(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
        const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
        const rate = checkRateLimit({
            key: `delete:${auth.userId}:${ip}`,
            limit: 30,
            windowMs: 60_000,
        });

        if (!rate.ok) {
            return noStoreJson(
                { error: "Too many delete requests. Please retry shortly." },
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

        const rawBody = (await request.json()) as unknown;

        if (!rawBody || typeof rawBody !== "object") {
            return noStoreJson({ error: "Invalid request payload." }, 400);
        }

        const body = rawBody as { url?: unknown; pathname?: unknown };
        const url = toSafeString(body.url);
        const pathname = toSafeString(body.pathname);

        if (!url && !pathname) {
            return noStoreJson({ error: "Missing file URL or path." }, 400);
        }

        if (url && url.length > 2048) {
            return noStoreJson({ error: "File URL is too long." }, 400);
        }

        if (pathname && pathname.length > 1024) {
            return noStoreJson({ error: "File path is too long." }, 400);
        }

        await deletePdf({
            userId: auth.userId,
            url,
            pathname,
        });

        return noStoreJson({ ok: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Delete failed.";

        if (message.startsWith("Forbidden")) {
            return noStoreJson({ error: "Forbidden. Cannot delete this file." }, 403);
        }

        if (message.startsWith("Missing") || message.startsWith("Invalid")) {
            return noStoreJson({ error: message }, 400);
        }

        return noStoreJson({ error: "Delete failed." }, 500);
    }
}
