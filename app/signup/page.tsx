"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [role, setRole] = useState<"parent" | "child">(inviteToken ? "child" : "parent");
  const [fullName, setFullName] = useState("");
  const [groupName, setGroupName] = useState("");
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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError || !signUpData.user) {
        setError(signUpError?.message ?? "Signup failed");
        setLoading(false);
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: signUpData.user.id, role, full_name: fullName });
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (role === "parent") {
        const res = await fetch("/api/groups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: groupName }),
        });
        if (!res.ok) {
          setError((await res.json()).error ?? "Could not create group");
          setLoading(false);
          return;
        }
        toast.success(`Welcome to Corner, ${fullName.split(" ")[0]}`);
        router.push("/parent/dashboard");
      } else if (inviteToken) {
        await fetch("/api/invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
        });
        toast.success(`Welcome to Corner, ${fullName.split(" ")[0]}`);
        router.push("/child/dashboard");
      } else {
        router.push("/child/join");
      }
    } catch (err) {
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
        <p className="eyebrow mt-8 mb-2">Get started</p>
        <h1 className="font-display text-4xl font-semibold text-espresso mb-8">Create your account</h1>

        {!inviteToken && (
          <div className="mb-6 flex gap-2 rounded-full border-2 border-cream-line bg-white p-1.5">
            <button
              type="button"
              onClick={() => setRole("parent")}
              className={`flex-1 rounded-full px-4 py-2 font-sans text-sm font-bold uppercase tracking-wide transition-colors ${
                role === "parent" ? "bg-matcha text-cream" : "text-espresso-soft"
              }`}
            >
              Parent / Employer
            </button>
            <button
              type="button"
              onClick={() => setRole("child")}
              className={`flex-1 rounded-full px-4 py-2 font-sans text-sm font-bold uppercase tracking-wide transition-colors ${
                role === "child" ? "bg-matcha text-cream" : "text-espresso-soft"
              }`}
            >
              Child / Worker
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field"
          />
          {role === "parent" && (
            <input
              type="text"
              placeholder="Family or team name"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="input-field"
            />
          )}
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          {error && <p className="font-sans text-sm text-rust">{error}</p>}
          <motion.button whileTap={{ scale: 0.96 }} type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Sign up"}
          </motion.button>
        </form>

        <p className="mt-6 font-sans text-sm text-espresso-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-matcha-deep underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
