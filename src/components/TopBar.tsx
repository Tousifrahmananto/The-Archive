"use client";

import { Bell, MoreVertical, Search } from "lucide-react";

interface TopBarProps {
    viewTitle?: string;
    subtitle?: string;
    userEmail?: string;
}

export default function TopBar({ viewTitle, subtitle, userEmail }: TopBarProps) {
    return (
        <header className="fixed top-0 right-0 w-full lg:w-[calc(100%-16rem)] h-16 bg-[#050505]/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-10 z-40 border-b border-[#1a1a1a] lg:ml-64">
            <div className="flex items-center flex-1">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555] w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Search Global Archive..."
                        className="w-full bg-[#0c0c0c] border border-[#1a1a1a] rounded-none py-2 pl-10 pr-4 text-[11px] text-white placeholder-[#555] uppercase tracking-widest focus:border-tertiary-archive transition-all outline-none"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <button className="text-[#666] hover:text-tertiary-archive transition-all relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-tertiary-archive rounded-full"></span>
                </button>

                <div className="h-6 w-px bg-[#1a1a1a]"></div>

                {viewTitle ? (
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-light italic text-white font-headline">{viewTitle}</p>
                            <p className="text-[9px] text-[#666] uppercase tracking-[0.2em]">{subtitle}</p>
                        </div>
                        <button className="p-1.5 hover:bg-[#1a1a1a] rounded-none transition-colors">
                            <MoreVertical className="w-4 h-4 text-[#555]" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-light italic text-white font-headline truncate max-w-[180px]">{userEmail ?? "Alexander Vane"}</p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#555]">Diamond Member</p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
