"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Settings as SettingsIcon } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";
import { useApplyAccent } from "@/components/ThemeInit";
import type { AccentThemeKey } from "@/lib/theme";

type Submission = {
  status: "pending" | "submitted" | "approved" | "needs_redo";
  review_note: string | null;
};

type Chore = {
  id: string;
  title: string;
  description: string | null;
  requires_photo: boolean;
  due_date: string;
  chore_submissions: Submission[];
};

function startOfWeek(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function ChildDashboard() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [points, setPoints] = useState<{ points: number; streak: number } | null>(null);
  const [avatar, setAvatar] = useState("🙂");
  const [accentTheme, setAccentTheme] = useState<AccentThemeKey | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useApplyAccent(accentTheme);

  async function load() {
    setLoading(true);
    setLoadError(null);

    const choresRes = await fetchJson<Chore[]>("/api/chores");
    if (!choresRes.ok) {
      setLoadError(choresRes.error ?? "Couldn't load your chores");
      setLoading(false);
      return;
    }
    setChores(choresRes.data ?? []);

    const groupRes = await fetchJson<{ membership?: { points: number; streak_count: number }; group?: { accent_theme: AccentThemeKey } }>(
      "/api/groups"
    );
    if (groupRes.ok && groupRes.data?.membership) {
      setPoints({ points: groupRes.data.membership.points, streak: groupRes.data.membership.streak_count });
    }
    if (groupRes.ok && groupRes.data?.group?.accent_theme) setAccentTheme(groupRes.data.group.accent_theme);

    const profileRes = await fetchJson<{ avatar_emoji: string }>("/api/profile");
    if (profileRes.ok && profileRes.data?.avatar_emoji) setAvatar(profileRes.data.avatar_emoji);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function submitChore(choreId: string, file: File | null) {
    const formData = new FormData();
    if (file) formData.append("photo", file);
    const res = await fetchJson(`/api/chores/${choreId}/submit`, { method: "POST", body: formData });
    if (res.ok) toast.success("Chore submitted — waiting on review");
    else toast.error(res.error ?? "Couldn't submit that chore");
    load();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="stamp-empty mx-auto animate-pulse !h-12 !w-12" />
          <p className="mt-4 font-sans text-sm text-espresso-soft">Loading today's chores…</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm">
          <div className="ticket text-center">
            <p className="eyebrow mb-2">Hmm</p>
            <p className="font-display text-2xl font-semibold text-espresso">Couldn't load your chores</p>
            <p className="mt-2 font-sans text-sm text-espresso-soft">
              {loadError === "No membership found"
                ? "Your account isn't linked to a household or team yet — ask for a join code or invite link."
                : loadError}
            </p>
          </div>
          <button onClick={load} className="btn-secondary w-full mt-6">
            Try again
          </button>
        </div>
      </main>
    );
  }

  const weekStart = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  function choresForDate(dateStr: string) {
    return chores.filter((c) => c.due_date === dateStr);
  }

  const selectedChores = choresForDate(selectedDate);
  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-matcha-pale text-2xl">{avatar}</div>
            <div>
              <p className="eyebrow">Your card</p>
              <h1 className="font-display text-2xl font-semibold text-espresso">
                {isToday ? "Today's chores" : new Date(selectedDate + "T00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {points && (
              <div className="text-right">
                <p className="font-mono text-xl font-bold text-matcha-deep">{points.points} pts</p>
                <p className="font-sans text-xs text-espresso-soft">🔥 {points.streak}d</p>
              </div>
            )}
            <Link href="/settings" className="btn-secondary !px-3 !py-2">
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Week strip */}
        <div className="flex justify-between gap-1.5">
          {weekDays.map((d, i) => {
            const dateStr = d.toISOString().slice(0, 10);
            const dayChores = choresForDate(dateStr);
            const allApproved = dayChores.length > 0 && dayChores.every((c) => c.chore_submissions?.[0]?.status === "approved");
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition-colors ${
                  isSelected ? "bg-matcha text-cream" : "bg-white/70 text-espresso-soft"
                }`}
              >
                <span className="font-sans text-[10px] font-bold uppercase">{dayLabels[i]}</span>
                <span className="font-display text-sm font-semibold">{d.getDate()}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    dayChores.length === 0 ? "bg-transparent" : allApproved ? "bg-cream" : isSelected ? "bg-cream/50" : "bg-caramel"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {selectedChores.length > 0 && (
          <div className="ticket flex flex-wrap gap-3">
            <AnimatePresence>
              {selectedChores.map((c) => {
                const status = c.chore_submissions?.[0]?.status ?? "pending";
                const filled = status === "approved";
                return (
                  <motion.div
                    key={c.id + status}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className={filled ? "stamp-filled" : "stamp-empty"}
                  >
                    {filled ? "✓" : "○"}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {selectedChores.length === 0 && (
          <div className="card text-center">
            <p className="font-sans text-espresso-soft">{isToday ? "Nothing due today 🎉" : "Nothing due this day"}</p>
          </div>
        )}

        <div className="space-y-3">
          {selectedChores.map((c) => {
            const submission = c.chore_submissions?.[0];
            const status = submission?.status ?? "pending";

            return (
              <motion.div key={c.id} layout className="card space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-sans font-bold text-espresso">{c.title}</p>
                    {c.description && <p className="mt-0.5 font-sans text-sm text-espresso-soft">{c.description}</p>}
                  </div>
                  {status === "approved" && <span className="badge-approved">Done</span>}
                  {status === "submitted" && <span className="badge-submitted">Waiting</span>}
                  {status === "needs_redo" && <span className="badge-redo">Redo</span>}
                  {status === "pending" && <span className="badge-pending">To do</span>}
                </div>

                {status === "needs_redo" && submission?.review_note && (
                  <p className="font-sans text-sm text-rust">{submission.review_note}</p>
                )}

                {isToday && (status === "pending" || status === "needs_redo") && (
                  <ChoreSubmitForm chore={c} onSubmit={(file) => submitChore(c.id, file)} />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function ChoreSubmitForm({ chore, onSubmit }: { chore: Chore; onSubmit: (file: File | null) => void }) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {chore.requires_photo && (
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="font-sans text-sm"
        />
      )}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => onSubmit(file)}
        disabled={chore.requires_photo && !file}
        className="btn-primary !px-5 !py-2 !text-xs"
      >
        Mark done
      </motion.button>
    </div>
  );
}
