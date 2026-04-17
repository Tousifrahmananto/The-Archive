import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                    Loading login...
                </main>
            }
        >
            <LoginClient />
        </Suspense>
    );
}
