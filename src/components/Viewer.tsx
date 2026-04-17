"use client";

import { useState } from "react";
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    Layout,
    MoreVertical,
    Share2,
} from "lucide-react";
import { motion } from "motion/react";
import type { ArchiveDocument } from "@/types";

interface ViewerProps {
    doc: ArchiveDocument;
    onBack: () => void;
}

export default function DocumentViewer({ doc, onBack }: ViewerProps) {
    const [shareState, setShareState] = useState<"idle" | "copied" | "failed">("idle");

    async function handleShareLink() {
        try {
            await navigator.clipboard.writeText(doc.url);
            setShareState("copied");
            window.setTimeout(() => setShareState("idle"), 2000);
        } catch {
            setShareState("failed");
            window.setTimeout(() => setShareState("idle"), 2000);
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
                            Uploaded {doc.date} • {doc.size}
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
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-4xl bg-[#0c0c0c] rounded-none border border-[#1a1a1a] pdf-stage-shadow p-6 md:p-10 space-y-8"
                >
                    <div className="border-b border-[#1a1a1a] pb-6 flex flex-col gap-2">
                        <h2 className="text-2xl md:text-3xl font-light italic text-white tracking-normal font-headline truncate">{doc.title}</h2>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-[#666]">Live preview and shareable public link</p>
                    </div>

                    <div className="aspect-[3/4] md:aspect-video bg-[#050505] rounded-none overflow-hidden border border-[#1a1a1a]">
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
                </motion.div>

                <div className="h-32 w-full shrink-0" />
            </section>

            <aside className="w-full lg:w-80 h-auto lg:h-full bg-[#0c0c0c] border-l border-[#1a1a1a] flex flex-col p-8 space-y-10 overflow-y-auto lg:fixed lg:right-0 lg:top-16 lg:bottom-0">
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.3em]">Document Details</h3>
                        <Layout className="w-3.5 h-3.5 text-[#444]" />
                    </div>

                    <dl className="space-y-5 text-[11px]">
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Title</dt>
                            <dd className="text-white break-words">{doc.title}</dd>
                        </div>
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Owner</dt>
                            <dd className="text-white break-all">{doc.author}</dd>
                        </div>
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Uploaded At</dt>
                            <dd className="text-white">{new Date(doc.uploadedAt).toLocaleString()}</dd>
                        </div>
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Size</dt>
                            <dd className="text-white">{doc.size}</dd>
                        </div>
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Storage Path</dt>
                            <dd className="text-white/90 break-all">{doc.pathname}</dd>
                        </div>
                        <div>
                            <dt className="text-[9px] font-bold text-[#444] uppercase tracking-[0.3em] mb-1">Type</dt>
                            <dd className="text-white">PDF</dd>
                        </div>
                    </dl>
                </div>

                <button
                    onClick={() => window.open(doc.url, "_blank", "noopener,noreferrer")}
                    className="mt-auto w-full py-3.5 border border-[#1a1a1a] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-white hover:border-[#333] transition-all active:scale-[0.98]"
                >
                    Open Original Document
                </button>
            </aside>
        </div>
    );
}
