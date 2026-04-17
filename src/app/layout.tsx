import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

const playfair = Playfair_Display({
    variable: "--font-headline",
    subsets: ["latin"],
    weight: ["400", "700"],
});

export const metadata: Metadata = {
    title: "The Archive | PDF Hosting",
    description: "Secure PDF hosting with Supabase Auth, in-browser preview, and Vercel Blob or Supabase Storage.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${playfair.variable}`}>{children}</body>
        </html>
    );
}
