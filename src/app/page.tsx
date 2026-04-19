"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
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

const configuredIdleTimeout = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_TIMEOUT_MINUTES);
const SESSION_IDLE_TIMEOUT_MINUTES =
    Number.isFinite(configuredIdleTimeout) && configuredIdleTimeout > 0
        ? Math.round(configuredIdleTimeout)
        : 30;
const SESSION_IDLE_TIMEOUT_MS = SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000;
const ACTIVITY_WRITE_THROTTLE_MS = 15000;
const IDLE_CHECK_INTERVAL_MS = 60000;

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
    const [sharedPathnames, setSharedPathnames] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<ViewType>("landing");
    const [selectedDoc, setSelectedDoc] = useState<ArchiveDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const logoutMessageRef = useRef<string | null>(null);
    const oauthCode = searchParams.get("code");

    const storageKey = session?.user.id ? `archive-shared:${session.user.id}` : null;

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
                setSharedPathnames([]);
                if (logoutMessageRef.current) {
                    setMessage(logoutMessageRef.current);
                    logoutMessageRef.current = null;
                } else {
                    setMessage("");
                }
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
            setSharedPathnames([]);
            return;
        }

        void loadDocuments(session);
    }, [session]);

    useEffect(() => {
        if (!supabase || !session) {
            return;
        }

        const activityStorageKey = `archive-last-activity:${session.user.id}`;
        let lastWrite = 0;
        let hasSignedOut = false;

        const writeActivity = (force = false) => {
            const now = Date.now();

            if (!force && now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) {
                return;
            }

            lastWrite = now;
            window.localStorage.setItem(activityStorageKey, String(now));
        };

        const readActivity = () => {
            const raw = window.localStorage.getItem(activityStorageKey);
            const parsed = raw ? Number(raw) : NaN;

            if (Number.isFinite(parsed) && parsed > 0) {
                return parsed;
            }

            return Date.now();
        };

        const signOutForInactivity = async () => {
            if (hasSignedOut) {
                return;
            }

            hasSignedOut = true;
            logoutMessageRef.current = `Session expired after ${SESSION_IDLE_TIMEOUT_MINUTES} minutes of inactivity. Please login again.`;
            await supabase.auth.signOut();
            window.localStorage.removeItem(activityStorageKey);
        };

        const checkForIdleTimeout = () => {
            if (Date.now() - readActivity() >= SESSION_IDLE_TIMEOUT_MS) {
                void signOutForInactivity();
            }
        };

        const handleActivity = () => {
            if (document.visibilityState === "visible") {
                writeActivity();
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible") {
                checkForIdleTimeout();
                writeActivity(true);
            }
        };

        const handleFocus = () => {
            checkForIdleTimeout();
            writeActivity(true);
        };

        writeActivity(true);

        const intervalId = window.setInterval(checkForIdleTimeout, IDLE_CHECK_INTERVAL_MS);

        window.addEventListener("pointerdown", handleActivity, { passive: true });
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("scroll", handleActivity, { passive: true });
        window.addEventListener("touchstart", handleActivity, { passive: true });
        window.addEventListener("mousemove", handleActivity, { passive: true });
        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("pointerdown", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("scroll", handleActivity);
            window.removeEventListener("touchstart", handleActivity);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [session, supabase]);

    useEffect(() => {
        if (!storageKey) {
            return;
        }

        try {
            const raw = window.localStorage.getItem(storageKey);

            if (!raw) {
                setSharedPathnames([]);
                return;
            }

            const parsed = JSON.parse(raw) as unknown;

            if (!Array.isArray(parsed)) {
                setSharedPathnames([]);
                return;
            }

            const cleaned = parsed.filter((item): item is string => typeof item === "string");
            setSharedPathnames(cleaned);
        } catch {
            setSharedPathnames([]);
        }
    }, [storageKey]);

    useEffect(() => {
        if (!storageKey) {
            return;
        }

        window.localStorage.setItem(storageKey, JSON.stringify(sharedPathnames));
    }, [sharedPathnames, storageKey]);

    const totalStorage = useMemo(
        () => documents.reduce((acc, file) => acc + file.bytes, 0),
        [documents]
    );

    async function handleLogout() {
        if (!supabase) {
            return;
        }

        logoutMessageRef.current = "Signed out.";
        await supabase.auth.signOut();
        setSession(null);
        setCurrentView("landing");
        setDocuments([]);
        setSelectedDoc(null);
    }

    async function handleUploadCompleted() {
        await loadDocuments();
        setCurrentView("library");
    }

    async function handleDeleteDoc(doc: ArchiveDocument) {
        if (!accessToken) {
            setMessage("You need to sign in before deleting files.");
            return;
        }

        const confirmed = window.confirm(`Delete \"${doc.title}\" from your archive?`);

        if (!confirmed) {
            return;
        }

        setDeletingId(doc.id);

        try {
            const response = await fetch("/api/delete", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ url: doc.url, pathname: doc.pathname }),
            });

            const data = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(data.error ?? "Delete failed.");
            }

            setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
            setSharedPathnames((prev) => prev.filter((pathname) => pathname !== doc.pathname));

            if (selectedDoc?.id === doc.id) {
                setSelectedDoc(null);
                setCurrentView("library");
            }

            setMessage("Document removed from archive.");
        } catch (error) {
            const text = error instanceof Error ? error.message : "Delete failed.";
            setMessage(text);
        } finally {
            setDeletingId(null);
        }
    }

    function markDocumentAsShared(doc: ArchiveDocument) {
        setSharedPathnames((prev) => {
            if (prev.includes(doc.pathname)) {
                return prev;
            }

            return [...prev, doc.pathname];
        });
    }

    const docsWithShareState = useMemo(
        () =>
            documents.map((doc) => {
                const isShared = sharedPathnames.includes(doc.pathname);
                const nextTags = ["PDF", isShared ? "Shared" : "Private"];

                return {
                    ...doc,
                    tags: nextTags,
                };
            }),
        [documents, sharedPathnames]
    );

    const scopedDocuments = useMemo(() => {
        let scoped = docsWithShareState;

        if (currentView === "shared") {
            scoped = scoped.filter((doc) => sharedPathnames.includes(doc.pathname));
        }

        if (currentView === "recent") {
            scoped = [...scoped].sort(
                (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
            );
        }

        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return scoped;
        }

        return scoped.filter((doc) => {
            const haystack = `${doc.title} ${doc.pathname} ${doc.tags.join(" ")}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [currentView, docsWithShareState, searchQuery, sharedPathnames]);

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
        if (currentView === "recent") {
            return {
                title: "Recent Records",
                subtitle: `${scopedDocuments.length} results`,
            };
        }
        if (currentView === "shared") {
            return {
                title: "Shared Records",
                subtitle: `${scopedDocuments.length} shared documents`,
            };
        }
        if (currentView === "profile" || currentView === "settings") {
            return { title: "Registry Control", subtitle: "Manage your secure session" };
        }
        if (scopedDocuments.length > 0) {
            return {
                title: "Recent Records",
                subtitle: `${scopedDocuments.length} documents • ${formatBytes(totalStorage)} total`,
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
    const searchDisabled = !["library", "recent", "shared"].includes(currentView);

    const libraryEmptyMessage =
        currentView === "shared"
            ? "No shared PDFs yet. Use Share Link in the viewer to pin records here."
            : searchQuery.trim().length > 0
                ? "No matching PDFs found for this search."
                : "No PDFs have been archived yet.";

    const renderView = () => {
        switch (currentView) {
            case "library":
            case "recent":
            case "shared":
                return (
                    <Library
                        documents={scopedDocuments}
                        onSelectDoc={handleSelectDoc}
                        onDeleteDoc={handleDeleteDoc}
                        deletingId={deletingId}
                        layoutMode={layoutMode}
                        onLayoutModeChange={setLayoutMode}
                        emptyMessage={libraryEmptyMessage}
                    />
                );
            case "upload":
                return <UploadView accessToken={accessToken} onUploaded={handleUploadCompleted} />;
            case "viewer":
                return selectedDoc ? (
                    <DocumentViewer
                        doc={selectedDoc}
                        onBack={() => setCurrentView("library")}
                        onDelete={handleDeleteDoc}
                        isDeleting={deletingId === selectedDoc.id}
                        onShared={markDocumentAsShared}
                        onMenuClick={() => setMessage("Viewer actions are available: share, open, and delete.")}
                    />
                ) : (
                    <Library
                        documents={scopedDocuments}
                        onSelectDoc={handleSelectDoc}
                        onDeleteDoc={handleDeleteDoc}
                        deletingId={deletingId}
                        layoutMode={layoutMode}
                        onLayoutModeChange={setLayoutMode}
                        emptyMessage={libraryEmptyMessage}
                    />
                );
            case "profile":
            case "settings":
                return <ProfileView sessionEmail={session.user.email ?? undefined} onLogout={handleLogout} />;
            default:
                return (
                    <Library
                        documents={scopedDocuments}
                        onSelectDoc={handleSelectDoc}
                        onDeleteDoc={handleDeleteDoc}
                        deletingId={deletingId}
                        layoutMode={layoutMode}
                        onLayoutModeChange={setLayoutMode}
                        emptyMessage={libraryEmptyMessage}
                    />
                );
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
                <TopBar
                    viewTitle={topBarConfig.title}
                    subtitle={topBarConfig.subtitle}
                    userEmail={session.user.email ?? undefined}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchDisabled={searchDisabled}
                    onNotificationClick={() => setMessage("No new notifications.")}
                    onMenuClick={() => setMessage("Top bar options are active in library and viewer flows.")}
                />

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
