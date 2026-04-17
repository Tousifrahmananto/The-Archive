"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Provider } from "@supabase/supabase-js";
import { ArrowRight, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/client";
import type { ViewType } from "@/types";

interface AuthProps {
    initialMode: "login" | "signup" | "reset-password";
    onAuthSuccess?: () => void;
    onSwitchMode?: (mode: ViewType) => void;
    onBackToLanding?: () => void;
}

export default function Auth({
    initialMode,
    onAuthSuccess,
    onSwitchMode,
    onBackToLanding,
}: AuthProps) {
    const router = useRouter();
    const supabaseBrowser = hasSupabaseEnv ? createClient() : null;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const activeMode = initialMode;

    const GoogleIcon = () => (
        <svg viewBox="0 0 24 24" className="w-4 h-4 mr-3" fill="currentColor" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );

    const GitHubIcon = () => (
        <svg viewBox="0 0 24 24" className="w-4 h-4 mr-3" fill="currentColor" aria-hidden>
            <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.12-1.52-1.12-1.52-.92-.64.07-.63.07-.63 1.02.08 1.56 1.06 1.56 1.06.91 1.58 2.39 1.12 2.97.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.29.1-2.68 0 0 .84-.27 2.75 1.05a9.23 9.23 0 0 1 2.5-.35c.85 0 1.7.12 2.5.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.39.2 2.42.1 2.68.64.72 1.03 1.63 1.03 2.75 0 3.95-2.35 4.81-4.58 5.07.36.31.69.92.69 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.59.69.48A10.27 10.27 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
        </svg>
    );

    async function handleOAuth(provider: Provider) {
        setMessage("");

        if (!supabaseBrowser) {
            setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
            return;
        }

        const { error } = await supabaseBrowser.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin },
        });

        if (error) {
            if (provider === "google" && /unsupported provider|provider is not enabled/i.test(error.message)) {
                setMessage(
                    "Google is not enabled in Supabase yet. Go to Supabase Dashboard -> Authentication -> Providers -> Google and turn it on, then add your OAuth client ID/secret and redirect URL."
                );
                return;
            }

            setMessage(error.message);
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        if (!supabaseBrowser) {
            setMessage("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
            return;
        }

        if (!email.trim()) {
            setMessage("Enter your email address.");
            return;
        }

        setIsLoading(true);

        if (activeMode === "reset-password") {
            const { error } = await supabaseBrowser.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            setIsLoading(false);

            if (error) {
                setMessage(error.message);
                return;
            }

            setMessage("Password reset email sent. Check your inbox.");
            return;
        }

        if (activeMode === "signup" && !fullName.trim()) {
            setIsLoading(false);
            setMessage("Enter your full name.");
            return;
        }

        if (!password.trim()) {
            setIsLoading(false);
            setMessage("Enter your password.");
            return;
        }

        if (activeMode === "signup") {
            const { error } = await supabaseBrowser.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { full_name: fullName.trim() },
                },
            });

            setIsLoading(false);

            if (error) {
                setMessage(error.message);
                return;
            }

            if (onAuthSuccess) {
                onAuthSuccess();
            } else {
                router.replace("/");
            }
            return;
        }

        const { error } = await supabaseBrowser.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setIsLoading(false);

        if (error) {
            setMessage(error.message);
            return;
        }

        if (onAuthSuccess) {
            onAuthSuccess();
        } else {
            router.replace("/");
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 selection:bg-tertiary-archive/30">
            <nav className="fixed top-0 w-full z-50 px-6 md:px-10 py-6 md:py-8 flex justify-between items-center">
                <div className="flex items-center gap-3 cursor-pointer" onClick={onBackToLanding}>
                    <div className="w-8 h-8 border border-tertiary-archive flex items-center justify-center font-headline italic font-light text-tertiary-archive">
                        A
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.4em] font-headline text-white">The Archive</span>
                </div>
            </nav>

            <div className="w-full max-w-md">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeMode}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 md:p-12 space-y-8 md:space-y-10"
                    >
                        <div className="space-y-4">
                            <span className="text-[9px] font-bold uppercase tracking-[0.6em] text-tertiary-archive">Authorization Layer</span>
                            <h2 className="text-3xl font-light italic font-headline text-white tracking-tight">
                                {activeMode === "login" && "Verify Identity"}
                                {activeMode === "signup" && "Establish Vault"}
                                {activeMode === "reset-password" && "Reset Credential"}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {activeMode === "signup" && (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
                                            <input
                                                required
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                placeholder="Alexander Vane"
                                                className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 pl-12 pr-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Archive Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
                                        <input
                                            required
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="alexander.vane@aether.private"
                                            className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 pl-12 pr-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                                        />
                                    </div>
                                </div>

                                {activeMode !== "reset-password" && (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Cipher Key</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#333]" />
                                            <input
                                                required
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 pl-12 pr-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {activeMode === "login" && onSwitchMode && (
                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => onSwitchMode("reset-password")}
                                        className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] hover:text-white transition-colors"
                                    >
                                        Forgotten Credential?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group w-full py-4 bg-white text-black font-bold text-[11px] uppercase tracking-[0.4em] transition-all hover:bg-tertiary-archive active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {activeMode === "login" && "Initialize Access"}
                                        {activeMode === "signup" && "Create Archive"}
                                        {activeMode === "reset-password" && "Request Reset"}
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="space-y-6">
                            <div className="relative h-px bg-[#1a1a1a] flex items-center justify-center">
                                <span className="bg-[#0c0c0c] px-4 text-[9px] font-bold uppercase tracking-[0.4em] text-[#333]">Alternative Gateways</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => void handleOAuth("google")}
                                    className="flex items-center justify-center py-4 border border-[#1a1a1a] hover:border-[#333] transition-all group"
                                >
                                    <GoogleIcon />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#444] group-hover:text-white">Google</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleOAuth("github")}
                                    className="flex items-center justify-center py-4 border border-[#1a1a1a] hover:border-[#333] transition-all group"
                                >
                                    <GitHubIcon />
                                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#444] group-hover:text-white">Github</span>
                                </button>
                            </div>
                        </div>

                        <div className="text-center pt-4">
                            {activeMode === "login" ? (
                                <p className="text-[10px] text-[#444] uppercase tracking-[0.2em]">
                                    Don&apos;t possess a vault?{" "}
                                    {onSwitchMode ? (
                                        <button
                                            onClick={() => onSwitchMode("signup")}
                                            className="text-white hover:text-tertiary-archive transition-colors ml-1 font-bold"
                                        >
                                            Request Access
                                        </button>
                                    ) : null}
                                </p>
                            ) : (
                                <p className="text-[10px] text-[#444] uppercase tracking-[0.2em]">
                                    Already possesses access?{" "}
                                    {onSwitchMode ? (
                                        <button
                                            onClick={() => onSwitchMode("login")}
                                            className="text-white hover:text-tertiary-archive transition-colors ml-1 font-bold"
                                        >
                                            Authorize
                                        </button>
                                    ) : null}
                                </p>
                            )}
                        </div>

                        {message && (
                            <p className="text-sm text-[#d7b58a] border border-[#1a1a1a] bg-black/50 p-4">{message}</p>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 flex items-center justify-center gap-4 py-6 border-t border-[#1a1a1a]">
                    <ShieldCheck className="w-4 h-4 text-tertiary-archive" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#222]">Encrypted Session Layer Active</p>
                </div>
            </div>
        </div>
    );
}
