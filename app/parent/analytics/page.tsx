"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchJson } from "@/lib/fetchJson";

type Stat = {
  membershipId: string;
  displayName: string;
  points: number;
  streak: number;
  total: number;
  approved: number;
  redos: number;
  completionRate: number;
};

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const groupRes = await fetchJson<{ group: { id: string } }>("/api/groups");
    if (!groupRes.ok || !groupRes.data) {
      setLoadError(groupRes.error ?? "Couldn't load your group");
      setLoading(false);
      return;
    }
    const res = await fetchJson<Stat[]>(`/api/groups/${groupRes.data.group.id}/analytics`);
    if (res.ok) setStats(res.data ?? []);
    else setLoadError(res.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="stamp-empty mx-auto animate-pulse !h-12 !w-12" />
          <p className="mt-4 font-sans text-sm text-espresso-soft">Crunching the numbers…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <Link href="/parent/dashboard" className="font-sans text-sm font-bold text-matcha-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">Analytics</h1>
        </div>

        {loadError && (
          <div className="ticket text-center">
            <p className="font-sans text-sm text-rust">{loadError}</p>
            <button onClick={load} className="btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {!loadError && stats.length === 0 && (
          <div className="card text-center">
            <p className="font-sans text-sm text-espresso-soft">No chore history yet — assign a few chores to see stats here.</p>
          </div>
        )}

        <div className="space-y-4">
          {stats.map((s) => (
            <div key={s.membershipId} className="card space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-sans font-bold text-espresso">{s.displayName}</p>
                <p className="font-mono text-xs text-espresso-soft">
                  {s.points} pts · 🔥 {s.streak}d
                </p>
              </div>

              <div>
                <div className="flex justify-between font-sans text-xs text-espresso-soft mb-1">
                  <span>On-time completion</span>
                  <span>{s.completionRate}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream-line/60">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.completionRate}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-matcha"
                  />
                </div>
              </div>

              <div className="flex gap-4 font-sans text-xs text-espresso-soft">
                <span>{s.total} assigned</span>
                <span>{s.approved} approved</span>
                <span className={s.redos > 0 ? "text-rust" : ""}>{s.redos} sent back</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
