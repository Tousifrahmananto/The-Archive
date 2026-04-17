"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Auth from "@/components/Auth";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/client";

export default function LoginClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const modeParam = searchParams.get("mode");
    const oauthCode = searchParams.get("code");
    const initialMode = useMemo(() => {
        if (modeParam === "signup" || modeParam === "reset-password") {
            return modeParam;
        }

        return "login";
    }, [modeParam]);

    const [supabase] = useState(() => (hasSupabaseEnv ? createClient() : null));

    useEffect(() => {
        if (!supabase) {
            return;
        }

        const checkSession = async () => {
            if (oauthCode) {
                const { error } = await supabase.auth.exchangeCodeForSession(oauthCode);

                if (!error) {
                    router.replace("/");
                    return;
                }
            }

            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.access_token) {
                router.replace("/");
            }
        };

        void checkSession();
    }, [oauthCode, router, supabase]);

    return (
        <Auth
            initialMode={initialMode}
            onAuthSuccess={() => router.replace("/")}
            onSwitchMode={(mode) => {
                router.replace(`/login?mode=${mode}`);
            }}
            onBackToLanding={() => router.replace("/")}
        />
    );
}
