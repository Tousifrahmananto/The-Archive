"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle, PlusCircle, Shield, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface UploadProps {
    accessToken: string;
    onUploaded: () => void;
}

export default function UploadView({ accessToken, onUploaded }: UploadProps) {
    const [tags, setTags] = useState(["Architecture", "Design", "2024"]);
    const [nextTag, setNextTag] = useState("");
    const [isDragOver, setIsDragOver] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [archiveLabel, setArchiveLabel] = useState("");
    const [accessMode, setAccessMode] = useState<"privileged" | "manifest">("privileged");
    const activeUploadController = useRef<AbortController | null>(null);

    function clearSelection() {
        if (isUploading) {
            return;
        }

        setSelectedFile(null);
        setArchiveLabel("");
        setMessage("Upload cleared.");
        setProgress(0);
    }

    function addTag(value: string) {
        const cleaned = value.trim().replace(/\s+/g, " ");

        if (!cleaned) {
            return;
        }

        if (tags.some((tag) => tag.toLowerCase() === cleaned.toLowerCase())) {
            setNextTag("");
            return;
        }

        setTags((prev) => [...prev, cleaned]);
        setNextTag("");
    }

    function cancelUpload() {
        activeUploadController.current?.abort();
        activeUploadController.current = null;
    }

    const formattedSize = useMemo(() => {
        if (!selectedFile) {
            return "No file selected";
        }

        const units = ["B", "KB", "MB", "GB"];
        const level = Math.min(Math.floor(Math.log(selectedFile.size) / Math.log(1024)), units.length - 1);
        const scaled = selectedFile.size / 1024 ** level;
        return `${scaled.toFixed(level === 0 ? 0 : 1)} ${units[level]}`;
    }, [selectedFile]);

    async function handleUpload() {
        if (!selectedFile) {
            setMessage("Choose a PDF first.");
            return;
        }

        if (!accessToken) {
            setMessage("You need to sign in before uploading.");
            return;
        }

        setIsUploading(true);
        setProgress(18);
        setMessage("");
        const controller = new AbortController();
        activeUploadController.current = controller;

        const formData = new FormData();
        formData.append("file", selectedFile);
        if (archiveLabel.trim()) {
            formData.append("label", archiveLabel.trim());
        }

        try {
            setProgress(42);
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData,
                signal: controller.signal,
            });

            setProgress(74);
            const result = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(result.error ?? "Upload failed.");
            }

            setProgress(100);
            setMessage(`Document archived successfully (${accessMode}).`);
            setSelectedFile(null);
            setArchiveLabel("");
            onUploaded();
        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                setMessage("Upload canceled.");
                setProgress(0);
                return;
            }

            const text = error instanceof Error ? error.message : "Upload failed.";
            setMessage(text);
        } finally {
            activeUploadController.current = null;
            setIsUploading(false);
            setTimeout(() => setProgress(0), 900);
        }
    }

    return (
        <div className="pt-24 pb-12 px-6 md:px-12 max-w-6xl mx-auto min-h-screen">
            <div className="mb-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-tertiary-archive mb-2">Ingestion Engine</p>
                <h2 className="text-4xl font-light italic text-white tracking-tight font-headline">Expand the Archive</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                <div className="lg:col-span-7 space-y-8">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            const file = e.dataTransfer.files?.[0] ?? null;
                            if (file) {
                                setSelectedFile(file);
                                setArchiveLabel(file.name.replace(/\.pdf$/i, ""));
                            }
                        }}
                        className={cn(
                            "group relative bg-[#0c0c0c] rounded-none border border-dashed border-[#1a1a1a] aspect-[4/3] flex flex-col items-center justify-center transition-all duration-300",
                            isDragOver && "bg-tertiary-archive/5 border-tertiary-archive border-solid scale-[0.99]"
                        )}
                    >
                        <div className="flex flex-col items-center text-center p-12">
                            <div className="w-20 h-20 rounded-none border border-[#1a1a1a] bg-[#050505] flex items-center justify-center mb-6 group-hover:border-tertiary-archive transition-colors">
                                <Upload className="w-8 h-8 text-tertiary-archive" />
                            </div>
                            <h3 className="text-xl font-light italic text-white mb-2 font-headline">Deposit Documents</h3>
                            <p className="text-[#666] text-xs max-w-xs leading-relaxed uppercase tracking-wider">
                                Securely transmit PDF files to your private global vault.
                            </p>
                            <label className="mt-8 px-10 py-3 border border-white text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all active:scale-95 cursor-pointer">
                                Browse Files
                                <input
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setSelectedFile(file);
                                        setArchiveLabel(file?.name.replace(/\.pdf$/i, "") ?? "");
                                    }}
                                />
                            </label>
                            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[#444]">{selectedFile ? selectedFile.name : "No file selected"}</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0c0c0c] p-8 rounded-none border border-[#1a1a1a] flex items-start gap-8"
                    >
                        <div className="w-16 h-20 bg-black rounded-none flex flex-col items-center justify-center border border-[#1a1a1a] relative overflow-hidden shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-tr from-tertiary-archive/10 to-transparent" />
                            <Upload className="w-8 h-8 text-tertiary-archive" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-4 gap-4">
                                <div>
                                    <h4 className="text-sm font-light italic text-white truncate font-headline tracking-wide">
                                        {archiveLabel || "Untitled_Document.pdf"}
                                    </h4>
                                    <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">
                                        {formattedSize} • Transmission Ready
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold text-tertiary-archive border border-tertiary-archive/30 px-3 py-1">
                                    {progress}%
                                </span>
                            </div>

                            <div className="h-px w-full bg-[#1a1a1a] rounded-none overflow-hidden mb-5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-tertiary-archive"
                                />
                            </div>

                            <div className="flex items-center gap-6">
                                <button
                                    type="button"
                                    disabled={isUploading}
                                    className="text-[9px] font-bold text-[#444] hover:text-white uppercase tracking-[0.2em] transition-colors"
                                    onClick={clearSelection}
                                >
                                    Clear Selection
                                </button>
                                {isUploading ? (
                                    <button
                                        type="button"
                                        onClick={cancelUpload}
                                        className="text-[9px] font-bold text-red-900 hover:text-red-500 uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5"
                                    >
                                        <X className="w-3 h-3" />
                                        Cancel Upload
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="text-[9px] font-bold text-[#555] hover:text-white uppercase tracking-[0.2em] transition-colors flex items-center gap-1.5 disabled:opacity-60"
                                    >
                                        <Upload className="w-3 h-3" />
                                        Upload Now
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="lg:col-span-5 bg-[#0c0c0c] p-8 rounded-none border border-[#1a1a1a] space-y-10">
                    <div className="space-y-8">
                        <h3 className="text-sm font-bold text-white uppercase tracking-[0.3em] font-headline border-b border-[#1a1a1a] pb-4">
                            Registry Identity
                        </h3>

                        <div className="space-y-3">
                            <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Archive Label</label>
                            <input
                                type="text"
                                value={archiveLabel}
                                onChange={(e) => setArchiveLabel(e.target.value)}
                                className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 px-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                                placeholder="Architectural Manifesto 2024"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Categorization Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1a1a1a] text-[#666] rounded-none text-[9px] font-bold uppercase tracking-widest"
                                    >
                                        {tag}
                                        <X
                                            className="w-2.5 h-2.5 cursor-pointer hover:text-white"
                                            onClick={() => setTags(tags.filter((t) => t !== tag))}
                                        />
                                    </span>
                                ))}
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={nextTag}
                                    onChange={(e) => setNextTag(e.target.value)}
                                    placeholder="Insert Registry tag..."
                                    className="w-full bg-black border border-[#1a1a1a] focus:border-tertiary-archive rounded-none py-4 px-6 text-xs text-white outline-none transition-all placeholder-[#333]"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            addTag(nextTag);
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => addTag(nextTag)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2"
                                >
                                    <PlusCircle className="w-4 h-4 text-[#333] hover:text-tertiary-archive transition-colors" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-[#444] block ml-1">Access Authorization</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAccessMode("privileged")}
                                    className={cn(
                                        "flex items-center justify-center gap-3 py-4 px-4 rounded-none border font-bold text-[10px] uppercase tracking-widest transition-all",
                                        accessMode === "privileged"
                                            ? "border-tertiary-archive bg-black text-tertiary-archive"
                                            : "border-[#1a1a1a] bg-black text-[#444] hover:text-[#666]"
                                    )}
                                >
                                    <Shield className="w-3.5 h-3.5 fill-current" />
                                    Privileged
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAccessMode("manifest")}
                                    className={cn(
                                        "flex items-center justify-center gap-3 py-4 px-4 rounded-none border font-bold text-[10px] uppercase tracking-widest transition-all",
                                        accessMode === "manifest"
                                            ? "border-tertiary-archive bg-black text-tertiary-archive"
                                            : "border-[#1a1a1a] bg-black text-[#444] hover:text-[#666]"
                                    )}
                                >
                                    Manifest
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t border-[#1a1a1a] flex flex-col gap-6">
                        <div className="flex items-start gap-4 text-[#444] italic">
                            <CheckCircle className="w-4 h-4 text-tertiary-archive shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed uppercase tracking-wider">
                                Upon finalizing, the document will be transmitted to Vercel Blob and indexed for private retrieval.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="w-full py-4 bg-[#111] border border-[#1a1a1a] text-[#333] font-bold text-[11px] uppercase tracking-[0.3em] rounded-none opacity-90 hover:text-white hover:border-[#333] transition-all disabled:opacity-50"
                        >
                            Initialize Registry
                        </button>
                    </div>

                    {message && <p className="text-sm text-[#d7b58a]">{message}</p>}
                </div>
            </div>

            <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-tertiary-archive/5 rounded-full blur-3xl -z-10" />
            <div className="fixed top-1/4 -left-12 w-64 h-64 bg-slate-200/20 rounded-full blur-3xl -z-10" />
        </div>
    );
}
