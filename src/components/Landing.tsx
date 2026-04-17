"use client";

import { ArrowRight, Cpu, Globe, Shield, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

interface LandingProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export default function Landing({ onGetStarted, onLogin }: LandingProps) {
    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-tertiary-archive/30 overflow-x-hidden">
            <nav className="fixed top-0 w-full z-50 px-6 md:px-10 py-6 md:py-8 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-tertiary-archive flex items-center justify-center font-headline italic font-light text-tertiary-archive">
                        A
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.4em] font-headline">The Archive</span>
                </div>
                <div className="hidden md:flex items-center gap-12">
                    {["Philosophy", "Security", "Intelligence", "Access"].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#444] hover:text-white transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <button
                        onClick={onLogin}
                        className="text-[10px] font-bold uppercase tracking-[0.3em] text-white hover:text-tertiary-archive transition-colors"
                    >
                        Entry
                    </button>
                    <button
                        onClick={onGetStarted}
                        className="px-4 md:px-6 py-2 border border-tertiary-archive text-tertiary-archive text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-tertiary-archive hover:text-black transition-all"
                    >
                        Establish Registry
                    </button>
                </div>
            </nav>

            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 md:px-10">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,165,106,0.12),transparent_40%)]" />
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/[0.02] to-transparent" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="text-center z-10 max-w-5xl"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-tertiary-archive mb-6 block">
                        Private Knowledge Infrastructure
                    </span>
                    <h1 className="text-5xl md:text-8xl font-light italic font-headline leading-[1.1] mb-8 md:mb-10 tracking-tight">
                        Curate the void. <br />
                        <span className="text-[#333]">Preserve the essence.</span>
                    </h1>
                    <p className="text-sm md:text-lg text-[#666] font-light max-w-2xl mx-auto leading-relaxed mb-10 md:mb-12 uppercase tracking-[0.08em] md:tracking-[0.1em]">
                        A premium document vault for private PDF hosting. Secure auth, global storage, and an archive-grade interface.
                    </p>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                        <button
                            onClick={onGetStarted}
                            className="group flex items-center justify-center gap-4 px-8 md:px-10 py-4 md:py-5 bg-white text-black font-bold text-[11px] uppercase tracking-[0.35em] transition-all hover:scale-105 active:scale-95"
                        >
                            Initialize Vault
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <button className="px-8 md:px-10 py-4 md:py-5 border border-[#1a1a1a] text-[#444] font-bold text-[11px] uppercase tracking-[0.35em] hover:text-white hover:border-[#333] transition-all">
                            Request Dossier
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-12 flex flex-col items-center gap-4 cursor-pointer"
                >
                    <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#222]">Philosophy</span>
                    <ChevronDown className="w-4 h-4 text-[#222] animate-bounce" />
                </motion.div>
            </section>

            <section className="py-24 md:py-32 px-6 md:px-10 bg-[#080808] border-y border-[#121212]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px bg-[#121212] border border-[#121212]">
                    <div className="bg-[#080808] p-10 md:p-16 space-y-8">
                        <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center text-tertiary-archive">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-light italic font-headline text-white tracking-wide">Digital Sovereignty</h3>
                        <p className="text-[#555] text-xs leading-[1.8] uppercase tracking-widest font-light">
                            Private storage with authenticated access. Files stay bound to your session and are served through Vercel Blob.
                        </p>
                    </div>
                    <div className="bg-[#080808] p-10 md:p-16 space-y-8">
                        <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center text-tertiary-archive">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-light italic font-headline text-white tracking-wide">Semantic Intelligence</h3>
                        <p className="text-[#555] text-xs leading-[1.8] uppercase tracking-widest font-light">
                            Structured metadata, fast lookup, and a minimal interface for focused document retrieval.
                        </p>
                    </div>
                    <div className="bg-[#080808] p-10 md:p-16 space-y-8">
                        <div className="w-12 h-12 border border-[#1a1a1a] flex items-center justify-center text-tertiary-archive">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-light italic font-headline text-white tracking-wide">Editorial Interface</h3>
                        <p className="text-[#555] text-xs leading-[1.8] uppercase tracking-widest font-light">
                            Dark, cinematic document management built to feel intentional instead of generic.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-28 md:py-40 px-6 md:px-10 text-center relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-tertiary-archive/5 blur-[100px] rounded-full" />
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.6em] text-[#222] mb-12 block">
                        The Architecture of Trust
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-20">
                        {[
                            { label: "Documents Archived", value: "4.2M" },
                            { label: "Security Audits", value: "100% Pass" },
                            { label: "Uptime Reliability", value: "99.99%" },
                            { label: "Active Curators", value: "12K+" },
                        ].map((stat, i) => (
                            <div key={i} className="space-y-4">
                                <p className="text-4xl font-light italic font-headline text-white">{stat.value}</p>
                                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#444]">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            <footer className="py-16 md:py-20 px-6 md:px-10 border-t border-[#121212] bg-[#050505]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border border-[#222] flex items-center justify-center font-headline italic font-light text-[#444] text-[10px]">
                                A
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] font-headline text-[#444]">The Archive</span>
                        </div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#222]">
                            Secure PDF hosting built on Supabase Auth and Vercel Blob.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-8 md:gap-12">
                        {["Terms", "Privacy", "Security", "Legal"].map((item) => (
                            <a key={item} href="#" className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] hover:text-white transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
