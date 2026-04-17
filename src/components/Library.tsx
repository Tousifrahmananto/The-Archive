"use client";

import { Calendar, FileText, LayoutGrid, List, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ArchiveDocument } from "@/types";

interface LibraryProps {
    documents: ArchiveDocument[];
    onSelectDoc: (doc: ArchiveDocument) => void;
    onDeleteDoc: (doc: ArchiveDocument) => void;
    deletingId?: string | null;
    layoutMode: "grid" | "list";
    onLayoutModeChange: (mode: "grid" | "list") => void;
    emptyMessage?: string;
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="col-span-full border border-dashed border-[#1a1a1a] bg-[#0c0c0c] p-12 text-center text-[#666]">
            {message}
        </div>
    );
}

export default function Library({
    documents,
    onSelectDoc,
    onDeleteDoc,
    deletingId,
    layoutMode,
    onLayoutModeChange,
    emptyMessage,
}: LibraryProps) {
    return (
        <div className="pt-24 pb-12 px-6 md:px-10 max-w-7xl mx-auto">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-tertiary-archive mb-1 block">Your Collection</span>
                    <h2 className="text-4xl font-light italic text-white tracking-tight font-headline">Recent Records</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onLayoutModeChange("grid")}
                        className={cn(
                            "p-2 rounded-none border border-[#1a1a1a] transition-colors",
                            layoutMode === "grid" ? "text-white bg-[#1a1a1a]" : "text-[#555] hover:text-white hover:bg-[#1a1a1a]"
                        )}
                    >
                        <LayoutGrid className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onLayoutModeChange("list")}
                        className={cn(
                            "p-2 rounded-none border border-[#1a1a1a] transition-colors",
                            layoutMode === "list" ? "text-white bg-[#1a1a1a]" : "text-[#555] hover:text-white hover:bg-[#1a1a1a]"
                        )}
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                className={cn(
                    layoutMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10"
                        : "flex flex-col gap-4"
                )}
            >
                {documents.length === 0 ? (
                    <EmptyState message={emptyMessage ?? "No PDFs have been archived yet."} />
                ) : (
                    documents.map((doc, idx) => (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.06 }}
                            className={cn(
                                "group cursor-pointer",
                                layoutMode === "list" && "border border-[#1a1a1a] bg-[#0c0c0c] p-4"
                            )}
                            onClick={() => onSelectDoc(doc)}
                        >
                            {layoutMode === "grid" ? (
                                <>
                                    <div className="aspect-[3/4] rounded-none bg-[#0c0c0c] border border-[#1a1a1a] overflow-hidden transition-all duration-500 group-hover:border-tertiary-archive/50 group-hover:shadow-[0_0_30px_rgba(201,165,106,0.1)] flex items-center justify-center p-6">
                                        <div className="w-full h-full border border-[#1a1a1a] bg-black/40 flex flex-col items-center justify-center gap-4 text-center">
                                            <FileText className="w-10 h-10 text-tertiary-archive" />
                                            <div>
                                                <p className="text-white text-sm font-medium truncate max-w-[180px]">{doc.title}</p>
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-[#666] mt-2">PDF Record</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-1">
                                        <h3 className="text-sm font-light italic text-white truncate group-hover:text-tertiary-archive transition-all font-headline tracking-wide">
                                            {doc.title}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] text-[#666] font-medium uppercase tracking-[0.1em] flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                {doc.date}
                                            </span>
                                            <span className="w-1 h-1 bg-[#1a1a1a] rounded-full"></span>
                                            <span>{doc.size}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-16 border border-[#1a1a1a] bg-black/40 flex items-center justify-center shrink-0">
                                        <FileText className="w-6 h-6 text-tertiary-archive" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-light italic text-white truncate group-hover:text-tertiary-archive transition-all font-headline tracking-wide">
                                            {doc.title}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-3 text-[10px] text-[#666] font-medium uppercase tracking-[0.1em] flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" />
                                                {doc.date}
                                            </span>
                                            <span className="w-1 h-1 bg-[#1a1a1a] rounded-full"></span>
                                            <span>{doc.size}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={cn("mt-4 flex justify-end", layoutMode === "list" && "mt-2")}>
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDeleteDoc(doc);
                                    }}
                                    disabled={deletingId === doc.id}
                                    className="inline-flex items-center gap-2 border border-red-900/40 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-red-900 hover:text-red-500 disabled:opacity-60"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    {deletingId === doc.id ? "Deleting" : "Delete"}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <div className="mt-32 border-t border-[#1a1a1a] pt-16 text-center max-w-xl mx-auto flex flex-col items-center">
                <h3 className="text-lg font-light italic text-[#444] font-headline">End of Registry</h3>
                <p className="text-[#333] text-[10px] uppercase tracking-[0.2em] mt-4">All transmissions secured and archived.</p>
            </div>
        </div>
    );
}
