"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetchJson";

type Submission = {
  id: string;
  chore_id: string;
  photo_url: string | null;
  submitted_at: string;
  chores: {
    title: string;
    description: string | null;
    due_date: string;
    memberships: { display_name: string };
  };
};

export default function ReviewPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
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
    const res = await fetchJson<Submission[]>(`/api/groups/${groupRes.data.group.id}/submissions`);
    if (res.ok) setSubmissions(res.data ?? []);
    else setLoadError(res.error);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function review(choreId: string, decision: "approved" | "needs_redo") {
    const res = await fetchJson(`/api/chores/${choreId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note[choreId] }),
    });
    if (res.ok) toast.success(decision === "approved" ? "Approved 🎉" : "Sent back for redo");
    else toast.error(res.error ?? "Couldn't submit your review");
    load();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="stamp-empty mx-auto animate-pulse !h-12 !w-12" />
          <p className="mt-4 font-sans text-sm text-espresso-soft">Loading submissions…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Link href="/parent/dashboard" className="font-sans text-sm font-bold text-matcha-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">Review</h1>
        </div>

        {loadError && (
          <div className="ticket text-center">
            <p className="font-sans text-sm text-rust">{loadError}</p>
            <button onClick={load} className="btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {!loadError && submissions.length === 0 && (
          <div className="card text-center">
            <p className="font-sans text-sm text-espresso-soft">Nothing waiting on you right now.</p>
          </div>
        )}

        {submissions.map((s) => (
          <div key={s.id} className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans font-bold text-espresso">{s.chores.title}</p>
                <p className="font-mono text-xs text-espresso-soft">
                  {s.chores.memberships.display_name} · due {s.chores.due_date}
                </p>
              </div>
              <span className="badge-submitted">Submitted</span>
            </div>
            {s.photo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo_url} alt="Chore proof" className="max-h-64 rounded-xl border-2 border-cream-line" />
            )}
            <input
              type="text"
              placeholder="Optional note (shown if you send it back)"
              value={note[s.chore_id] ?? ""}
              onChange={(e) => setNote({ ...note, [s.chore_id]: e.target.value })}
              className="input-field"
            />
            <div className="flex gap-2">
              <button onClick={() => review(s.chore_id, "approved")} className="btn-primary">
                Approve
              </button>
              <button onClick={() => review(s.chore_id, "needs_redo")} className="btn-secondary">
                Send back
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
