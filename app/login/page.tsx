"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) {
        setError(signInError?.message ?? "Login failed");
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      toast.success("Welcome back");
      router.push(profile?.role === "parent" ? "/parent/dashboard" : "/child/dashboard");
    } catch (err) {
      // Catches config/network errors (e.g. missing env vars) so the page
      // never silently crashes into a raw HTML form submit.
      setError(err instanceof Error ? err.message : "Something went wrong — try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-espresso">
          Corner
        </Link>
        <p className="eyebrow mt-8 mb-2">Welcome back</p>
        <h1 className="font-display text-4xl font-semibold text-espresso mb-8">Log in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <div className="text-right">
            <Link href="/forgot-password" className="font-sans text-xs text-espresso-soft underline">
              Forgot password?
            </Link>
          </div>
          {error && <p className="font-sans text-sm text-rust">{error}</p>}
          <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Logging in…" : "Log in"}
          </motion.button>
        </form>

        <p className="mt-4 text-center font-sans text-xs text-espresso-soft">
          <Link href="/forgot-password" className="underline">
            Forgot your password?
          </Link>
        </p>

        <p className="mt-6 font-sans text-sm text-espresso-soft">
          New here?{" "}
          <Link href="/signup" className="font-bold text-matcha-deep underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
