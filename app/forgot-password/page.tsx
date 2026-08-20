"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-espresso">
          Corner
        </Link>
        <p className="eyebrow mt-8 mb-2">Account recovery</p>
        <h1 className="font-display text-4xl font-semibold text-espresso mb-8">Reset your password</h1>

        {sent ? (
          <div className="ticket">
            <p className="font-sans text-sm text-espresso">
              If an account exists for <span className="font-bold">{email}</span>, a reset link is on its way.
              Check your inbox (and spam folder).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
            {error && <p className="font-sans text-sm text-rust">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 font-sans text-sm text-espresso-soft">
          <Link href="/login" className="font-bold text-matcha-deep underline">
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
