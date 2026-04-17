"use client";

import { ChevronRight, Edit3, Languages, LogOut, Moon, Shield, Bell } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface ProfileProps {
    onLogout: () => void;
    sessionEmail?: string;
}

export default function ProfileView({ onLogout, sessionEmail }: ProfileProps) {
    const preferences = [
        { id: "dark", label: "Dark Mode", sub: "Adaptive display", icon: Moon },
        { id: "notify", label: "Notifications", sub: "Email and push alerts", icon: Bell },
        { id: "lang", label: "App Language", sub: "English (US)", icon: Languages },
    ];

    const security = [
        { id: "privacy", label: "Privacy Policy", sub: "Data handling rules", icon: Shield },
        { id: "auth", label: "Two-Factor Auth", sub: "Secured via Supabase Auth", icon: Shield, active: true },
        { id: "out", label: "Sign Out", sub: "Close current session", icon: LogOut, danger: true, action: onLogout },
    ];

    return (
        <div className="pt-24 pb-12 px-6 md:px-12 max-w-5xl mx-auto min-h-screen">
            <header className="mb-14">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-tertiary-archive mb-3 block font-headline">Registry Control</span>
                <h2 className="text-4xl font-light italic tracking-tight text-white font-headline">Account Overview</h2>
            </header>

            <div className="space-y-12">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0c0c0c] rounded-none p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-14 border border-[#1a1a1a]"
                >
                    <div className="relative shrink-0">
                        <div className="w-32 h-32 md:w-36 md:h-36 rounded-none object-cover grayscale brightness-75 border border-[#1a1a1a] bg-black flex items-center justify-center">
                            <span className="text-4xl text-[#444] font-headline italic">A</span>
                        </div>
                        <button className="absolute -bottom-3 -right-3 bg-tertiary-archive text-black p-2 rounded-none shadow-xl hover:scale-110 active:scale-95 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div>
                            <h3 className="text-3xl font-light italic text-white font-headline">Alexander Vane</h3>
                            <p className="text-[#666] font-medium mt-1 text-sm tracking-wide break-all">{sessionEmail ?? "alexander.vane@aether.private"}</p>
                            <div className="mt-5 inline-flex items-center px-4 py-1 border border-tertiary-archive text-tertiary-archive rounded-none text-[10px] font-bold tracking-[0.2em] uppercase">
                                Diamond Elite
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
                            <div className="p-6 bg-black">
                                <p className="text-[9px] uppercase font-bold text-[#444] tracking-[0.3em] mb-2">Access Level</p>
                                <p className="font-light italic text-white font-headline">Privileged Tier</p>
                            </div>
                            <div className="p-6 bg-black">
                                <p className="text-[9px] uppercase font-bold text-[#444] tracking-[0.3em] mb-2">Registry Cycle</p>
                                <p className="font-light italic text-white font-headline">Renewal Oct 24</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <section className="lg:col-span-5 bg-[#0c0c0c] border border-[#1a1a1a] rounded-none p-10 flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 border border-[#1a1a1a] flex items-center justify-center text-white">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-light italic font-headline text-white">Archive Volume</h3>
                            </div>
                            <p className="text-[#666] text-xs leading-relaxed font-light">
                                Your global document vault is currently operating under the secure session layer.
                            </p>
                        </div>

                        <div className="mt-14 space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between text-[10px] font-bold tracking-[0.3em] uppercase">
                                    <span className="text-white">Private</span>
                                    <span className="text-[#333]">Connected</span>
                                </div>
                                <div className="w-full h-px bg-[#1a1a1a] relative">
                                    <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} className="h-full bg-tertiary-archive" />
                                </div>
                            </div>
                            <button className="w-full py-4 bg-white text-black text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-tertiary-archive hover:text-black transition-colors rounded-none">
                                Expand Registry
                            </button>
                        </div>
                    </section>

                    <section className="lg:col-span-7 flex flex-col gap-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {preferences.map((pref) => (
                                <div key={pref.id} className="bg-[#0c0c0c] p-8 rounded-none border border-[#1a1a1a] space-y-5 hover:border-[#333] transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 border border-[#1a1a1a] flex items-center justify-center text-[#444] group-hover:text-tertiary-archive transition-colors">
                                        <pref.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold text-white uppercase tracking-widest">{pref.label}</p>
                                        <p className="text-[9px] text-[#444] font-bold uppercase tracking-[0.2em] mt-1">{pref.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-[#0c0c0c] rounded-none p-8 border border-[#1a1a1a] space-y-8">
                            <h3 className="text-[10px] font-bold font-headline uppercase tracking-[0.4em] text-[#333]">Security Authentication</h3>
                            <div className="space-y-1">
                                {security.map((sec) => (
                                    <div
                                        key={sec.id}
                                        onClick={() => sec.action?.()}
                                        className="flex items-center justify-between py-5 group cursor-pointer border-b border-[#1a1a1a] last:border-none"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div
                                                className={cn(
                                                    "w-10 h-10 border flex items-center justify-center transition-colors",
                                                    sec.danger
                                                        ? "border-red-900 text-red-900 group-hover:bg-red-900 group-hover:text-white"
                                                        : "border-[#1a1a1a] text-[#444] group-hover:text-tertiary-archive group-hover:border-tertiary-archive/30"
                                                )}
                                            >
                                                <sec.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={cn("text-[11px] font-bold uppercase tracking-widest", sec.danger ? "text-red-900" : "text-white")}>
                                                    {sec.label}
                                                </p>
                                                <p className="text-[9px] text-[#444] font-bold uppercase tracking-[0.2em] mt-0.5">{sec.sub}</p>
                                            </div>
                                        </div>
                                        {sec.active ? (
                                            <div className="flex items-center gap-2 px-3 py-1 border border-green-900/30 text-green-900 rounded-none text-[9px] font-bold uppercase tracking-widest">
                                                Verified
                                            </div>
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-[#222] group-hover:text-white transition-colors" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <footer className="mt-24 py-12 text-center border-t border-[#1a1a1a]">
                <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-[#222]">Aether Core Intelligence • Secure Registry Layer</p>
            </footer>
        </div>
    );
}
