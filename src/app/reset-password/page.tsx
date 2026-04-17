"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
    const supabaseBrowser = hasSupabaseEnv ? createClient() : null;
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        if (!supabaseBrowser) {
            setMessage("Missing Supabase env vars in this deployment.");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        setIsSaving(true);

        const { error } = await supabaseBrowser.auth.updateUser({ password });

        if (error) {
            setMessage(error.message);
            setIsSaving(false);
            return;
        }

        setMessage("Password updated. You can return to the home page and sign in.");
        setIsSaving(false);
    }

    return (
        <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 selection:bg-tertiary-archive/30">
            <div className="w-full max-w-md">
                <section className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 md:p-12 space-y-8 md:space-y-10 pulse-in">
                    <div className="space-y-4">
                        <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-tertiary-archive">Authorization Layer</span>
                        <h1 className="text-3xl font-light italic font-headline text-white tracking-tight">Reset Credential</h1>
                        <p className="text-sm text-[#666] max-w-sm">Set a new password and re-enter the archive with a refreshed session.</p>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="New password"
                            minLength={8}
                            required
                            className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 px-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Confirm new password"
                            minLength={8}
                            required
                            className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 px-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                        />
                        <button
                            className="group w-full py-4 bg-white text-black font-bold text-[11px] uppercase tracking-[0.4em] transition-all hover:bg-tertiary-archive active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            type="submit"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Update Password
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    {message && <p className="text-sm text-[#d7b58a] border border-[#1a1a1a] bg-black/50 p-4">{message}</p>}

                    <p className="text-center text-[10px] text-[#444] uppercase tracking-[0.2em]">
                        <Link href="/login" className="text-white hover:text-tertiary-archive transition-colors">
                            Back to login
                        </Link>
                    </p>
                </section>

                <div className="mt-12 flex items-center justify-center gap-4 py-6 border-t border-[#1a1a1a]">
                    <ShieldCheck className="w-4 h-4 text-tertiary-archive" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#222]">Encrypted Session Layer Active</p>
                </div>
            </div>
        </main>
    );
}
