import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type RequireUserResult =
    | { userId: string }
    | {
        response: NextResponse;
    };

export async function requireUserFromRequest(request: Request): Promise<RequireUserResult> {
    const authHeader = request.headers.get("authorization") ?? "";

    if (!authHeader.startsWith("Bearer ")) {
        return {
            response: NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            ),
        };
    }

    const accessToken = authHeader.slice("Bearer ".length).trim();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabasePublishableKey) {
        return {
            response: NextResponse.json(
                {
                    error:
                        "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
                },
                { status: 500 }
            ),
        };
    }

    const supabase = createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
        return {
            response: NextResponse.json(
                { error: "Unauthorized. Invalid or expired session." },
                { status: 401 }
            ),
        };
    }

    return { userId: data.user.id };
}
