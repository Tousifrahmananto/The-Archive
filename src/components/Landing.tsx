"use client";

import { ArrowRight, ArrowUpRight, BookOpen, FileText, Link2, Upload } from "lucide-react";

interface LandingProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

export default function Landing({ onGetStarted, onLogin }: LandingProps) {
    return (
        <div className="min-h-screen bg-[#080909] text-[#f5f2eb] selection:bg-tertiary-archive/30">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4 focus:text-black">Skip to content</a>
            <header className="border-b border-white/10">
                <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-6 sm:px-10 lg:px-12">
                    <a href="#" aria-label="The Archive home" className="flex items-center gap-3">
                        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center border border-tertiary-archive/60 font-headline text-2xl italic text-tertiary-archive">A</span>
                        <span className="text-sm font-semibold tracking-[0.14em]">THE ARCHIVE</span>
                    </a>
                    <div className="flex items-center gap-6 sm:gap-9">
                        <a href="#how-it-works" className="hidden text-sm text-[#b5b5ae] transition-colors hover:text-white sm:block">How it works</a>
                        <button type="button" onClick={onLogin} className="flex min-h-11 items-center gap-2 text-sm font-medium hover:text-tertiary-archive">
                            Sign in <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </button>
                    </div>
                </nav>
            </header>

            <main id="main">
                <section aria-labelledby="hero-title" className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-20 lg:px-12 lg:py-28">
                    <div>
                        <p className="mb-7 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-tertiary-archive">
                            <span aria-hidden="true" className="h-px w-8 bg-tertiary-archive" /> A home for your PDFs
                        </p>
                        <h1 id="hero-title" className="font-headline text-[clamp(3rem,5.6vw,5rem)] font-normal leading-[1.08] tracking-tight">
                            Your PDFs.<br />
                            <span className="italic text-tertiary-archive">All in one place.</span>
                        </h1>
                        <p className="mt-7 max-w-md text-base leading-relaxed text-[#b5b5ae] sm:text-lg">
                            Upload your documents, find them when you need them, and share a link. A simple library for the PDFs you want to keep.
                        </p>
                        <button type="button" onClick={onGetStarted} className="mt-9 inline-flex min-h-13 items-center justify-center gap-5 bg-tertiary-archive px-6 py-4 text-sm font-semibold text-[#080909] transition-colors hover:bg-[#ddbd88]">
                            Create your archive <ArrowRight aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <p className="mt-5 text-sm text-[#b5b5ae]">PDF files up to 20 MB. View them right in your browser.</p>
                    </div>

                    <div aria-label="Illustration of a PDF library" role="img" className="relative min-w-0 border border-white/15 bg-[#111313] p-5 shadow-[0_24px_80px_-40px_#c9a56a30] sm:p-8">
                        <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-5">
                            <span className="flex items-center gap-2 text-sm text-[#e6e2d9]"><BookOpen className="h-4 w-4 text-tertiary-archive" /> Your library</span>
                            <span className="text-[10px] uppercase tracking-[0.15em] text-[#b5b5ae]">A look inside</span>
                        </div>
                        <div className="mx-auto max-w-[290px] rotate-[-3deg] bg-[#ede7da] p-7 text-[#242824] shadow-xl sm:p-9">
                            <div className="mb-10 flex items-center justify-between border-b border-[#242824]/20 pb-3 text-[9px] font-medium uppercase tracking-[0.16em]">
                                <span>Collected ideas</span><span>No. 01</span>
                            </div>
                            <p className="font-headline text-4xl leading-tight">Room<br />for thought.</p>
                            <p className="mt-4 text-xs leading-relaxed text-[#565b52]">Notes, references, and things worth returning to.</p>
                            <div className="mt-8 flex h-14 items-end gap-2 border-b border-[#242824]/20 pb-3" aria-hidden="true">
                                <span className="h-5 w-9 bg-[#b0b5a3]" /><span className="h-9 w-9 bg-[#737e69]" /><span className="h-7 w-9 bg-[#c4ac82]" /><span className="h-12 w-9 bg-[#394b3d]" />
                            </div>
                            <p className="mt-5 text-[9px] uppercase tracking-[0.15em]">Field notes · PDF</p>
                        </div>
                        <div className="relative mt-7 flex items-center gap-3 border border-white/10 bg-[#171a18] p-4">
                            <FileText aria-hidden="true" className="h-8 w-8 shrink-0 text-tertiary-archive" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm">Field notes.pdf</p>
                                <p className="mt-1 text-xs text-[#b5b5ae]">Ready to read, whenever you are</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="how-it-works" aria-labelledby="steps-title" className="scroll-mt-8 border-y border-white/10 bg-[#0d0f0e]">
                    <div className="mx-auto max-w-7xl px-6 py-14 sm:px-10 lg:px-12">
                        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                            <h2 id="steps-title" className="font-headline text-3xl sm:text-4xl">Less searching. More reading.</h2>
                            <p className="text-sm text-[#b5b5ae]">Three simple steps.</p>
                        </div>
                        <ol className="grid list-none gap-8 md:grid-cols-3 md:gap-10">
                            {[
                                { icon: Upload, title: "Upload a PDF", text: "Choose a file or drag it into your archive. Give it a name you will recognize." },
                                { icon: BookOpen, title: "Find it. Open it.", text: "Search your library by name and preview documents without leaving the page." },
                                { icon: Link2, title: "Share a link", text: "Copy a document link when you want to share it. Anyone with that link can open the PDF." },
                            ].map(({ icon: Icon, title, text }, index) => (
                                <li key={title} className="border-t border-white/15 pt-6">
                                    <div className="mb-5 flex items-center justify-between">
                                        <Icon aria-hidden="true" className="h-5 w-5 text-tertiary-archive" />
                                        <span className="text-xs text-[#b5b5ae]">0{index + 1}</span>
                                    </div>
                                    <h3 className="text-base font-medium">{title}</h3>
                                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#b5b5ae]">{text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>
            </main>

            <footer className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 py-7 text-xs leading-relaxed text-[#b5b5ae] sm:flex-row sm:px-10 lg:px-12">
                <p>The Archive <span aria-hidden="true" className="mx-2">/</span> Keep what matters.</p>
                <p>Your library requires sign-in. Shared PDF links are public.</p>
            </footer>
        </div>
    );
}
