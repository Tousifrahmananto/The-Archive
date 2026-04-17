import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireUserFromRequest } from "@/lib/require-user";
import { getStorageSetupError, listPdfs } from "@/lib/storage";

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

export async function GET(request: Request) {
    try {
        const auth = await requireUserFromRequest(request);

        if ("response" in auth) {
            return auth.response;
        }

        const forwardedFor = request.headers.get("x-forwarded-for") ?? "unknown";
        const ip = forwardedFor.split(",")[0]?.trim() || "unknown";
        const rate = checkRateLimit({
            key: `files:${auth.userId}:${ip}`,
            limit: 120,
            windowMs: 60_000,
        });

        if (!rate.ok) {
            return noStoreJson(
                { error: "Too many requests. Please retry shortly." },
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

        const files = await listPdfs(auth.userId);

        return noStoreJson({ files });
    } catch {
        return noStoreJson({ error: "Could not list files." }, 500);
    }
}
