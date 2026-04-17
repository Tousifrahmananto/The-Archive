"use client";

import { useEffect, useMemo, useState } from "react";

type PdfFile = {
    url: string;
    pathname: string;
    size: number;
    uploadedAt: string;
};

const maxSizeMb = 20;

function formatBytes(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return "0 B";

    const units = ["B", "KB", "MB", "GB"];
    const level = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const scaled = value / 1024 ** level;

    return `${scaled.toFixed(level === 0 ? 0 : 1)} ${units[level]}`;
}

export default function HomePage() {
    const [files, setFiles] = useState<PdfFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState<string>("");

    async function loadFiles() {
        setIsLoading(true);

        try {
            const res = await fetch("/api/files", { cache: "no-store" });
            const data = (await res.json()) as { files?: PdfFile[]; error?: string };

            if (!res.ok) {
                throw new Error(data.error ?? "Could not load PDFs.");
            }

            setFiles(data.files ?? []);
        } catch (error) {
            const text = error instanceof Error ? error.message : "Could not load PDFs.";
            setMessage(text);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadFiles();
    }, []);

    const totalStorage = useMemo(
        () => files.reduce((acc, file) => acc + file.size, 0),
        [files]
    );

    async function onUpload(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");

        const formData = new FormData(event.currentTarget);
        const file = formData.get("file");

        if (!(file instanceof File)) {
            setMessage("Pick a PDF file first.");
            return;
        }

        if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") {
            setMessage("Only PDF files are allowed.");
            return;
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
            setMessage(`File is too large. Maximum size is ${maxSizeMb}MB.`);
            return;
        }

        setIsUploading(true);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = (await res.json()) as { error?: string };

            if (!res.ok) {
                throw new Error(data.error ?? "Upload failed.");
            }

            event.currentTarget.reset();
            setMessage("Upload complete.");
            await loadFiles();
        } catch (error) {
            const text = error instanceof Error ? error.message : "Upload failed.";
            setMessage(text);
        } finally {
            setIsUploading(false);
        }
    }

    async function onDelete(url: string) {
        setMessage("");

        try {
            const res = await fetch("/api/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ url }),
            });

            const data = (await res.json()) as { error?: string };

            if (!res.ok) {
                throw new Error(data.error ?? "Delete failed.");
            }

            await loadFiles();
        } catch (error) {
            const text = error instanceof Error ? error.message : "Delete failed.";
            setMessage(text);
        }
    }

    return (
        <main className="app-shell">
            <section className="hero pulse-in">
                <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.4rem)", letterSpacing: "-0.04em" }}>
                    PDF Hosting
                </h1>
                <p style={{ margin: "0.5rem 0 0", maxWidth: 760 }}>
                    Upload and host PDF files with a Vercel-native backend. Files are stored in Vercel Blob and delivered through globally distributed URLs.
                </p>
            </section>

            <div className="grid">
                <section className="panel pulse-in">
                    <h2 style={{ marginTop: 0 }}>Upload</h2>
                    <form onSubmit={onUpload} className="row" style={{ alignItems: "center" }}>
                        <input
                            name="file"
                            type="file"
                            accept="application/pdf,.pdf"
                            required
                            style={{ flex: "1 1 240px" }}
                        />
                        <button className="btn" disabled={isUploading} type="submit">
                            {isUploading ? "Uploading..." : "Upload PDF"}
                        </button>
                    </form>
                    <p className="upload-note">Only PDFs up to {maxSizeMb}MB are accepted.</p>
                    {message && <p style={{ marginBottom: 0 }}>{message}</p>}
                </section>

                <section className="panel pulse-in">
                    <h2 style={{ marginTop: 0 }}>Library</h2>
                    <p style={{ marginTop: 0 }}>
                        {files.length} file(s) · {formatBytes(totalStorage)} total
                    </p>

                    {isLoading ? (
                        <p>Loading PDFs...</p>
                    ) : files.length === 0 ? (
                        <p>No PDFs uploaded yet.</p>
                    ) : (
                        <ul className="file-list">
                            {files.map((file) => (
                                <li key={file.url} className="file-item">
                                    <div>
                                        <div style={{ fontWeight: 700, wordBreak: "break-all" }}>{file.pathname}</div>
                                        <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                                            {formatBytes(file.size)} · {new Date(file.uploadedAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="row">
                                        <a href={file.url} target="_blank" rel="noreferrer" className="btn secondary">
                                            View
                                        </a>
                                        <button
                                            className="btn danger"
                                            onClick={() => {
                                                void onDelete(file.url);
                                            }}
                                            type="button"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}
