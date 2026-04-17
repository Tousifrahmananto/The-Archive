"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!supabaseBrowser) {
      setMessage("Missing Supabase env vars in this deployment.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    const { error } = await supabaseBrowser.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setMessage("Password updated. You can return to the home page and sign in.");
    setIsSaving(false);
  }

  return (
    <main className="app-shell">
      <section className="hero pulse-in">
        <h1 style={{ margin: 0 }}>Reset Password</h1>
        <p style={{ margin: "0.5rem 0 0" }}>
          Set a new password for your account.
        </p>
      </section>

      <section className="panel pulse-in" style={{ marginTop: "1rem", maxWidth: 520 }}>
        <form onSubmit={onSubmit} className="row" style={{ flexDirection: "column" }}>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            minLength={8}
            required
            style={{ width: "100%", padding: "0.7rem", borderRadius: 10, border: "1px solid #b8c3c8" }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            minLength={8}
            required
            style={{ width: "100%", padding: "0.7rem", borderRadius: 10, border: "1px solid #b8c3c8" }}
          />
          <button className="btn" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Update Password"}
          </button>
        </form>
        {message && <p style={{ marginBottom: 0 }}>{message}</p>}
        <p style={{ marginTop: "0.8rem" }}>
          <Link href="/">Back to home</Link>
        </p>
      </section>
    </main>
  );
}
