"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not join");
      setLoading(false);
      return;
    }
    toast.success("You're in!");
    router.push("/child/dashboard");
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-16">
      <div className="mx-auto max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-espresso">
          Corner
        </Link>
        <p className="eyebrow mt-8 mb-2">Almost there</p>
        <h1 className="font-display text-4xl font-semibold text-espresso mb-2">Enter your code</h1>
        <p className="mb-8 font-sans text-sm text-espresso-soft">
          Ask your parent or employer for the code on their dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="ticket">
            <input
              type="text"
              placeholder="ABC123"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-transparent text-center font-mono text-3xl font-bold tracking-[0.3em] text-matcha-deep placeholder:text-matcha-deep/30 focus:outline-none"
            />
          </div>
          {error && <p className="font-sans text-sm text-rust">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Joining…" : "Join"}
          </button>
        </form>
      </div>
    </main>
  );
}
