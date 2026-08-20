"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// Landed on via the link in the reset email sent from /forgot-password.
// Supabase's client automatically picks up the recovery token from the URL
// and starts a session, so this page just collects the new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }
      toast.success("Password updated");
      router.push("/login");
    } catch {
      toast.error("That link may have expired — request a new one");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-espresso">
          Corner
        </Link>
        <p className="eyebrow mt-8 mb-2">Almost done</p>
        <h1 className="font-display text-4xl font-semibold text-espresso mb-8">Set a new password</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </main>
  );
}
