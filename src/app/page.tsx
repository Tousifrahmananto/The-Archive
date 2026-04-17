"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "motion/react";
import Landing from "@/components/Landing";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import Library from "@/components/Library";
import UploadView from "@/components/Upload";
import DocumentViewer from "@/components/Viewer";
import ProfileView from "@/components/Profile";
import { createClient, hasSupabaseEnv } from "@/utils/supabase/client";
import type { ArchiveDocument, UploadResult, ViewType } from "@/types";

function formatBytes(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const level = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const scaled = value / 1024 ** level;

    return `${scaled.toFixed(level === 0 ? 0 : 1)} ${units[level]}`;
}

function toDocument(file: UploadResult, index: number, fallbackAuthor: string): ArchiveDocument {
    const name = file.pathname.split("/").pop() ?? file.pathname;
    const cleanName =
        file.displayName?.trim() ||
        decodeURIComponent(name)
            .replace(/\.pdf$/i, "")
            .replace(/^\d{10,}-/, "")
            .replace(/[-_][a-zA-Z0-9]{10,}$/, "")
            .replace(/[_-]+/g, " ")
            .trim() ||
        "Untitled document";

    return {
        id: file.url,
        title: cleanName,
        pathname: file.pathname,
        url: file.url,
        date: new Date(file.uploadedAt).toLocaleDateString(undefined, {
            month: "short",
            day: "2-digit",
            year: "numeric",
        }),
        size: formatBytes(file.size),
        bytes: file.size,
        uploadedAt: file.uploadedAt,
        pages: Math.max(1, Math.ceil(file.size / 250000) + index),
        author: fallbackAuthor,
        tags: ["PDF", "Private"],
    };
}

function HomePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [supabase] = useState(() => (hasSupabaseEnv ? createClient() : null));
    const [session, setSession] = useState<Session | null>(null);
    const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
    const [currentView, setCurrentView] = useState<ViewType>("landing");
    const [selectedDoc, setSelectedDoc] = useState<ArchiveDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const oauthCode = searchParams.get("code");

    async function getAccessToken() {
        if (!supabase) {
            return null;
        }

        const {
            data: { session: currentSession },
        } = await supabase.auth.getSession();

        return currentSession?.access_token ?? null;
    }

    async function loadDocuments(activeSession: Session | null = session) {
        const accessToken = activeSession?.access_token ?? (await getAccessToken());

        if (!accessToken) {
            setDocuments([]);
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/files", {
                cache: "no-store",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = (await response.json()) as { files?: UploadResult[]; error?: string };

            if (!response.ok) {
                throw new Error(data.error ?? "Could not load PDFs.");
            }

            const owner = activeSession?.user.email ?? "Archive Curator";
            setDocuments((data.files ?? []).map((file, index) => toDocument(file, index, owner)));
        } catch (error) {
            const text = error instanceof Error ? error.message : "Could not load PDFs.";
            setMessage(text);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        const initAuth = async () => {
            if (oauthCode) {
                const { error } = await supabase.auth.exchangeCodeForSession(oauthCode);

                if (error) {
                    setMessage(error.message);
                }

                router.replace("/");
                return;
            }

            const {
                data: { session: initialSession },
            } = await supabase.auth.getSession();

            setSession(initialSession);
            setCurrentView(initialSession ? "library" : "landing");
            setIsLoading(false);
        };

        void initAuth();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            setCurrentView(currentSession ? "library" : "landing");
            if (!currentSession) {
                setDocuments([]);
                setSelectedDoc(null);
                setMessage("");
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [oauthCode, router, supabase]);

    useEffect(() => {
        if (!session) {
            setDocuments([]);
            setSelectedDoc(null);
            return;
        }

        void loadDocuments(session);
    }, [session]);

    const totalStorage = useMemo(
        () => documents.reduce((acc, file) => acc + file.bytes, 0),
        [documents]
    );

    async function handleLogout() {
        if (!supabase) {
            return;
        }

        await supabase.auth.signOut();
        setSession(null);
        setCurrentView("landing");
        setDocuments([]);
        setSelectedDoc(null);
        setMessage("Signed out.");
    }

    async function handleUploadCompleted() {
        await loadDocuments();
        setCurrentView("library");
    }

    const handleSelectDoc = (doc: ArchiveDocument) => {
        setSelectedDoc(doc);
        setCurrentView("viewer");
    };

    const getTopBarConfig = () => {
        if (currentView === "viewer" && selectedDoc) {
            return { title: selectedDoc.title, subtitle: `Modified ${selectedDoc.date} • ${selectedDoc.size}` };
        }
        if (currentView === "upload") {
            return { title: "Ingestion Engine", subtitle: "Deposit documents into the archive" };
        }
        if (currentView === "profile" || currentView === "settings") {
            return { title: "Registry Control", subtitle: "Manage your secure session" };
        }
        if (documents.length > 0) {
            return {
                title: "Recent Records",
                subtitle: `${documents.length} documents • ${formatBytes(totalStorage)} total`,
            };
        }
        return {};
    };

    const topBarConfig = getTopBarConfig();

    if (!session) {
        return (
            <div className="app-shell bg-[#050505]">
                <Landing onGetStarted={() => router.push("/login?mode=signup")} onLogin={() => router.push("/login?mode=login")} />
            </div>
        );
    }

    const accessToken = session.access_token;

    const renderView = () => {
        switch (currentView) {
            case "library":
            case "recent":
            case "shared":
                return <Library documents={documents} onSelectDoc={handleSelectDoc} />;
            case "upload":
                return <UploadView accessToken={accessToken} onUploaded={handleUploadCompleted} />;
            case "viewer":
                return selectedDoc ? <DocumentViewer doc={selectedDoc} onBack={() => setCurrentView("library")} /> : <Library documents={documents} onSelectDoc={handleSelectDoc} />;
            case "profile":
            case "settings":
                return <ProfileView sessionEmail={session.user.email ?? undefined} onLogout={handleLogout} />;
            default:
                return <Library documents={documents} onSelectDoc={handleSelectDoc} />;
        }
    };

    return (
        <div className="min-h-screen bg-background-archive selection:bg-tertiary-archive/20">
            <Sidebar
                currentView={currentView}
                setView={(view) => {
                    setCurrentView(view);
                    if (view !== "viewer") {
                        setSelectedDoc(null);
                    }
                    if (view === "profile") {
                        setMessage("");
                    }
                }}
                userEmail={session.user.email ?? undefined}
                onLogout={handleLogout}
            />

            <main className="min-h-screen relative lg:ml-64">
                <TopBar viewTitle={topBarConfig.title} subtitle={topBarConfig.subtitle} userEmail={session.user.email ?? undefined} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentView + (selectedDoc?.id || "")}
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="w-full"
                    >
                        {renderView()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <div className="fixed top-0 right-0 w-1/2 h-screen bg-gradient-to-l from-slate-200/10 to-transparent pointer-events-none -z-10" />

            {message && <div className="fixed bottom-6 right-6 z-50 max-w-sm border border-[#1a1a1a] bg-black/90 px-4 py-3 text-sm text-[#d7b58a]">{message}</div>}
            {isLoading && <div className="fixed bottom-6 left-6 z-50 text-[10px] uppercase tracking-[0.4em] text-[#444]">Synchronizing archive...</div>}
        </div>
    );
}

export default function HomePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
            <HomePageContent />
        </Suspense>
    );
}
