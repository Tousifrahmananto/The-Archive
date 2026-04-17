"use client";

import { Clock, FolderOpen, Group, Menu, Settings, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ViewType } from "@/types";

interface SidebarProps {
    currentView: ViewType;
    setView: (view: ViewType) => void;
    userEmail?: string;
    onLogout: () => void;
}

export default function Sidebar({ currentView, setView, userEmail, onLogout }: SidebarProps) {
    const navItems: Array<{ id: ViewType; label: string; icon: typeof FolderOpen }> = [
        { id: "library", label: "Library", icon: FolderOpen },
        { id: "recent", label: "Recent", icon: Clock },
        { id: "shared", label: "Shared", icon: Group },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <aside className="h-screen w-64 fixed left-0 top-0 bg-black hidden lg:flex flex-col py-10 px-6 z-50 border-r border-[#1a1a1a]">
            <div className="mb-12 px-2">
                <div className="flex items-center gap-2 mb-1">
                    <Menu className="w-5 h-5 text-tertiary-archive cursor-pointer" />
                    <h1 className="text-2xl font-light italic text-white tracking-[0.1em] font-headline">AETHER</h1>
                </div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-[#555] font-bold">Document Vault</p>
            </div>

            <nav className="flex-1 space-y-4">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id)}
                        className={cn(
                            "w-full flex items-center gap-4 py-2 px-2 text-[11px] uppercase tracking-[0.15em] transition-all duration-300",
                            currentView === item.id ? "text-tertiary-archive" : "text-[#888] hover:text-white"
                        )}
                    >
                        <item.icon className={cn("w-4 h-4", currentView === item.id && "fill-current")} />
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="mt-auto">
                <button
                    onClick={() => setView("upload")}
                    className="w-full py-3 border border-tertiary-archive text-tertiary-archive font-bold text-[11px] uppercase tracking-widest transition-all hover:bg-tertiary-archive hover:text-on-tertiary-archive active:scale-[0.98]"
                >
                    Prepare Upload
                </button>

                <div className="mt-10 pt-6 border-t border-[#1a1a1a] flex items-center gap-3">
                    <div className="overflow-hidden">
                        <p className="text-[13px] text-white font-medium truncate">{userEmail ?? "Anonymous Curator"}</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#666] truncate">Secure Session</p>
                    </div>
                    <button onClick={onLogout} className="ml-auto text-[9px] uppercase tracking-[0.25em] text-[#555] hover:text-white transition-colors">
                        Exit
                    </button>
                </div>
            </div>
        </aside>
    );
}
