import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") ?? "/";
    const safeNext = next.startsWith("/") ? next : "/";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!code || !supabaseUrl || !supabaseKey) {
        return NextResponse.redirect(new URL("/login?mode=login", requestUrl.origin));
    }

    const redirectResponse = NextResponse.redirect(new URL(safeNext, requestUrl.origin));

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    redirectResponse.cookies.set(name, value, options);
                });
            },
        },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(new URL("/login?mode=login", requestUrl.origin));
    }

    return redirectResponse;
}
