"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    FileText,
    Layout,
    MoreVertical,
    ExternalLink,
    Share2,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ArchiveDocument } from "@/types";

interface ViewerProps {
    doc: ArchiveDocument;
    onBack: () => void;
}

export default function DocumentViewer({ doc, onBack }: ViewerProps) {
    const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

    const outline = [
        { id: 1, title: "01 Introduction" },
        { id: 2, title: "02 Methodology" },
        { id: 3, title: "03 Analysis" },
        { id: 4, title: "04 Integration", active: true },
        { id: 5, title: "05 Conclusion" },
    ];

    async function handleShareLink() {
        try {
            await navigator.clipboard.writeText(doc.url);
            setShareState("copied");
            window.setTimeout(() => {
                setShareState("idle");
            }, 2000);
        } catch {
            setShareState("failed");
            window.setTimeout(() => {
                setShareState("idle");
            }, 2000);
        }
    }

    return (
        <div className="pt-16 lg:pt-0 min-h-screen flex flex-col lg:flex-row overflow-hidden">
            <div className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 bg-[#050505]/90 backdrop-blur-xl flex justify-between items-center px-6 md:px-10 z-[45] border-b border-[#1a1a1a] lg:ml-64">
                <div className="flex items-center gap-4 min-w-0">
                    <button onClick={onBack} className="p-2 hover:bg-[#1a1a1a] rounded-none text-[#666] transition-all active:scale-95">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg font-light italic text-white tracking-tight font-headline truncate">{doc.title}</h1>
                        <span className="text-[9px] font-bold text-[#444] uppercase tracking-[0.2em] truncate">
                            Archived {doc.date} • {doc.size}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-6">
                    <button
                        onClick={handleShareLink}
                        className="flex items-center gap-2 px-3 md:px-6 py-2 border border-tertiary-archive text-tertiary-archive rounded-none font-bold text-[11px] uppercase tracking-widest transition-all hover:bg-tertiary-archive hover:text-on-tertiary-archive active:scale-95"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                        {shareState === "copied" ? "Link Copied" : shareState === "failed" ? "Copy Failed" : "Share Link"}
                    </button>
                    <button
                        onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                        className="flex items-center gap-2 px-3 md:px-6 py-2 border border-[#1a1a1a] text-white rounded-none font-bold text-[11px] uppercase tracking-widest transition-all hover:bg-[#1a1a1a] active:scale-95"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open PDF
                    </button>
                    <button className="p-2.5 text-[#444] hover:text-white transition-all">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <section className="flex-1 bg-[#050505] relative overflow-y-auto p-6 md:p-12 flex flex-col items-center">
                <div className="sticky top-4 mb-12 z-40 bg-[#0c0c0c]/90 backdrop-blur-md rounded-none px-6 md:px-10 py-4 flex flex-wrap items-center gap-6 md:gap-10 shadow-2xl border border-[#1a1a1a]">
                    <div className="flex items-center gap-5">
                        <button className="p-1 text-[#444] hover:text-white transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-[11px] font-bold text-white uppercase tracking-widest font-headline">
                            Registry 04 <span className="text-[#444] font-normal ml-2">/ {doc.pages}</span>
                        </span>
                        <button className="p-1 text-[#444] hover:text-white transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-[#1a1a1a] hidden md:block" />
                    <div className="flex items-center gap-5">
                        <button className="p-1 text-[#444] hover:text-white transition-colors">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-bold w-12 text-center text-white">125%</span>
                        <button className="p-1 text-[#444] hover:text-white transition-colors">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-4xl bg-[#0c0c0c] rounded-none border border-[#1a1a1a] pdf-stage-shadow p-6 md:p-10 lg:p-20 min-h-[900px] flex flex-col items-center"
                >
                    <div className="w-full h-full space-y-16">
                        <div className="flex flex-col md:flex-row justify-between md:items-end border-b border-[#1a1a1a] pb-10 gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light italic text-white tracking-normal font-headline">{doc.title}</h1>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#555] mt-3">
                                    Sub-Layer 04: Architectural Integration • <span className="text-tertiary-archive">Level 4 Clearance</span>
                                </p>
                            </div>
                            <div className="w-24 h-px bg-tertiary-archive/40 hidden md:block" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16">
                            <div className="md:col-span-8 space-y-10">
                                <h2 className="text-xl font-light italic text-white font-headline tracking-wide underline underline-offset-8 decoration-tertiary-archive/30">
                                    4.1 Structural Framework
                                </h2>
                                <p className="text-[#888] leading-[1.8] text-sm font-light">
                                    The document has been archived through the private PDF hosting pipeline. It is secured by Supabase Auth and stored in Vercel Blob.
                                </p>
                                <div className="aspect-[3/4] md:aspect-video bg-[#050505] rounded-none overflow-hidden group border border-[#1a1a1a]">
                                    <object data={doc.url} type="application/pdf" className="w-full h-full bg-white">
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-6 text-center text-[#666] bg-[#050505]">
                                            <FileText className="w-10 h-10 text-tertiary-archive/70" />
                                            <p className="text-[10px] uppercase tracking-[0.4em]">PDF preview unavailable in this browser</p>
                                            <button
                                                onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                                                className="px-4 py-2 border border-[#1a1a1a] text-white text-[10px] uppercase tracking-[0.3em] hover:bg-[#1a1a1a] transition-colors"
                                            >
                                                Open PDF
                                            </button>
                                        </div>
                                    </object>
                                </div>
                                <div className="flex items-center justify-between gap-4 flex-wrap border border-[#1a1a1a] bg-black/40 px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-[#666]">
                                    <span className="truncate max-w-[70%]">Public link ready: {doc.url}</span>
                                    <button onClick={handleShareLink} className="text-tertiary-archive hover:text-white transition-colors">
                                        {shareState === "copied" ? "Copied" : "Copy link"}
                                    </button>
                                </div>
                                <p className="text-[#444] text-[11px] italic font-light border-l border-tertiary-archive/40 pl-6 py-2">
                                    "The goal is not to fill the space, but to curate the void." — Archive Interface
                                </p>
                            </div>

                            <div className="md:col-span-4 space-y-12">
                                <div className="p-8 bg-[#050505] rounded-none border border-[#1a1a1a]">
                                    <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#333] mb-8">System Metrics</h3>
                                    <div className="space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-[#666]">Integrity</span>
                                                <span className="text-tertiary-archive italic font-headline">99.4%</span>
                                            </div>
                                            <div className="h-px w-full bg-[#1a1a1a]">
                                                <div className="h-full bg-tertiary-archive w-[99.4%]" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-[#666]">Efficiency</span>
                                                <span className="text-white italic font-headline">82.1%</span>
                                            </div>
                                            <div className="h-px w-full bg-[#1a1a1a]">
                                                <div className="h-full bg-white w-[82.1%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#333]">Context Registry</h3>
                                    <p className="text-[11px] italic text-[#555] leading-relaxed">
                                        Uploaded at {new Date(doc.uploadedAt).toLocaleString()}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-20 w-full border-t border-[#1a1a1a] flex justify-between items-center text-[9px] font-bold text-[#333] tracking-[0.4em] uppercase gap-4 flex-wrap">
                        <span>Aether Intelligence Group © 2024</span>
                        <span>Registry 04 / {doc.pages}</span>
                    </div>
                </motion.div>

                <div className="h-32 w-full shrink-0" />
            </section>

            <aside className="w-full lg:w-80 h-auto lg:h-full bg-[#0c0c0c] border-l border-[#1a1a1a] flex flex-col p-8 space-y-12 overflow-y-auto lg:fixed lg:right-0 lg:top-16 lg:bottom-0">
                <div>
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Registry Index</h3>
                        <Layout className="w-3.5 h-3.5 text-[#444]" />
                    </div>

                    <div className="space-y-6">
                        {outline.map((item) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "text-[11px] uppercase tracking-widest flex items-center gap-4 cursor-pointer transition-all",
                                    item.active ? "text-tertiary-archive font-bold" : "text-[#444] hover:text-white"
                                )}
                            >
                                <div className={cn("w-1 h-1 rounded-full", item.active ? "bg-tertiary-archive shadow-[0_0_10px_#c9a56a]" : "bg-[#1a1a1a]")} />
                                {item.title}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-10 border-t border-[#1a1a1a] space-y-8">
                    <div>
                        <span className="text-[9px] font-bold text-[#333] uppercase tracking-[0.4em] mb-4 block">Archive Master</span>
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 border border-[#1a1a1a] rounded-none flex items-center justify-center text-[10px] font-bold text-[#555] italic font-headline">
                                AV
                            </div>
                            <span className="text-[13px] font-medium text-white">{doc.author}</span>
                        </div>
                    </div>

                    <div>
                        <span className="text-[9px] font-bold text-[#333] uppercase tracking-[0.4em] mb-6 block">Visual Samples</span>
                        <div className="grid grid-cols-2 gap-6">
                            {[1, 2, 3, 4].map((p) => (
                                <div
                                    key={p}
                                    className={cn(
                                        "aspect-[3/4] rounded-none border border-[#1a1a1a] bg-[#0c0c0c] p-2 cursor-pointer transition-all",
                                        p === 4 ? "border-tertiary-archive" : "opacity-30 hover:opacity-100"
                                    )}
                                >
                                    <div className="w-full h-full bg-black/40 rounded-none overflow-hidden flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-[#1a1a1a]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button className="mt-auto w-full py-3.5 border border-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-white hover:border-[#333] transition-all active:scale-[0.98]">
                    Apply Annotation
                </button>
            </aside>
        </div>
    );
}
