"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Users, ListChecks, ClipboardCheck, TrendingUp, Settings as SettingsIcon } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";
import { useApplyAccent } from "@/components/ThemeInit";
import type { AccentThemeKey } from "@/lib/theme";

type Group = {
  id: string;
  name: string;
  join_code: string | null;
  code_regenerates: boolean;
  accent_theme: AccentThemeKey;
};

type Member = {
  id: string;
  display_name: string;
  joined_at: string | null;
  invite_token: string | null;
};

type Overview = {
  membersJoined: number;
  choresDueToday: number;
  pendingReviewCount: number;
  weeklyCompletionRate: number | null;
};

export default function ParentDashboard() {
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recoveryName, setRecoveryName] = useState("");

  useApplyAccent(group?.accent_theme);

  async function loadAll() {
    setLoading(true);
    setLoadError(null);
    const groupRes = await fetchJson<{ group: Group }>("/api/groups");
    if (!groupRes.ok || !groupRes.data) {
      setLoadError(groupRes.error ?? "Couldn't load your group");
      setLoading(false);
      return;
    }
    setGroup(groupRes.data.group);

    const [membersRes, overviewRes] = await Promise.all([
      fetchJson<Member[]>(`/api/groups/${groupRes.data.group.id}/members`),
      fetchJson<Overview>(`/api/groups/${groupRes.data.group.id}/overview`),
    ]);
    if (membersRes.ok && membersRes.data) setMembers(membersRes.data);
    if (overviewRes.ok && overviewRes.data) setOverview(overviewRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createGroupRecovery(e: React.FormEvent) {
    e.preventDefault();
    if (!recoveryName) return;
    setRecovering(true);
    const res = await fetchJson<Group>("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: recoveryName }),
    });
    setRecovering(false);
    if (res.ok) {
      toast.success("Group created");
      loadAll();
    } else {
      toast.error(res.error ?? "Couldn't create your group");
    }
  }

  async function addMemberEarly(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !newMemberName) return;
    const res = await fetchJson<{ membership: Member; inviteToken: string }>(`/api/groups/${group.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: newMemberName }),
    });
    if (res.ok && res.data) {
      setInviteLink(`${window.location.origin}/invite/${res.data.inviteToken}`);
      setNewMemberName("");
      toast.success(`${res.data.membership.display_name} added — send them the invite link`);
      loadAll();
    } else {
      toast.error(res.error ?? "Couldn't add that member");
    }
  }

  async function toggleCode(action: "enable_rotation" | "disable_code") {
    if (!group) return;
    const res = await fetchJson(`/api/groups/${group.id}/toggle-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) toast.success(action === "disable_code" ? "Join code turned off" : "Join code regenerated");
    else toast.error(res.error ?? "Couldn't update the code");
    loadAll();
  }

  async function removeMember(memberId: string, name: string) {
    if (!group) return;
    if (!confirm(`Remove ${name}? Their chore history will be deleted too.`)) return;
    const res = await fetchJson(`/api/groups/${group.id}/members/${memberId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`${name} removed`);
      loadAll();
    } else {
      toast.error(res.error ?? "Couldn't remove that member");
    }
  }

  function copyCode() {
    if (!group?.join_code) return;
    navigator.clipboard.writeText(group.join_code);
    toast.success("Code copied");
  }

  function copyInviteLink() {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="stamp-empty mx-auto animate-pulse !h-12 !w-12" />
          <p className="mt-4 font-sans text-sm text-espresso-soft">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (loadError || !group) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm">
          <div className="ticket text-center">
            <p className="eyebrow mb-2">Hmm</p>
            <p className="font-display text-2xl font-semibold text-espresso">No group found yet</p>
            <p className="mt-2 font-sans text-sm text-espresso-soft">
              {loadError === "No group found"
                ? "Your account exists, but it isn't linked to a household or team yet. This can happen if signup was interrupted — create one now to pick up where you left off."
                : loadError ?? "Something went wrong loading your dashboard."}
            </p>
          </div>
          <form onSubmit={createGroupRecovery} className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Family or team name"
              value={recoveryName}
              onChange={(e) => setRecoveryName(e.target.value)}
              className="input-field"
            />
            <button type="submit" disabled={recovering} className="btn-primary w-full">
              {recovering ? "Creating…" : "Create your group"}
            </button>
            <button type="button" onClick={loadAll} className="btn-secondary w-full">
              Try loading again
            </button>
          </form>
        </div>
      </main>
    );
  }

  const stats = [
    { icon: Users, label: "Members", value: overview?.membersJoined ?? 0 },
    { icon: ListChecks, label: "Due today", value: overview?.choresDueToday ?? 0 },
    { icon: ClipboardCheck, label: "Awaiting review", value: overview?.pendingReviewCount ?? 0 },
    { icon: TrendingUp, label: "Week completion", value: overview?.weeklyCompletionRate != null ? `${overview.weeklyCompletionRate}%` : "—" },
  ];

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">Dashboard</p>
            <h1 className="font-display text-4xl font-semibold text-espresso">{group.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/settings" className="btn-secondary !px-3">
              <SettingsIcon className="h-4 w-4" />
            </Link>
            <Link href="/parent/analytics" className="btn-secondary">
              Analytics
            </Link>
            <Link href="/parent/review" className="btn-secondary">
              Review
            </Link>
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card !p-4"
            >
              <s.icon className="mb-2 h-4 w-4 text-matcha" />
              <p className="font-display text-2xl font-semibold text-espresso">{s.value}</p>
              <p className="font-sans text-xs text-espresso-soft">{s.label}</p>
            </motion.div>
          ))}
        </section>

        <section>
          <p className="eyebrow mb-3">Join code</p>
          <div className="ticket flex flex-wrap items-end justify-between gap-4">
            <div>
              {group.join_code ? (
                <button onClick={copyCode} className="font-mono text-4xl font-bold tracking-[0.2em] text-matcha-deep">
                  {group.join_code}
                </button>
              ) : (
                <p className="font-sans text-espresso-soft">Code is turned off.</p>
              )}
              <p className="mt-2 font-sans text-xs text-espresso-soft">
                {group.code_regenerates ? "Refreshes automatically every 2 days. Tap the code to copy it." : "Not rotating."}
              </p>
            </div>
            {group.code_regenerates ? (
              <button onClick={() => toggleCode("disable_code")} className="btn-danger-ghost">
                Turn off
              </button>
            ) : (
              <button onClick={() => toggleCode("enable_rotation")} className="btn-danger-ghost !text-matcha-deep hover:!bg-matcha/10">
                Turn back on
              </button>
            )}
          </div>
        </section>

        <section>
          <p className="eyebrow mb-3">Members</p>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="card flex items-center justify-between !py-4">
                <div>
                  <p className="font-sans font-bold text-espresso">{m.display_name}</p>
                  {!m.joined_at && <p className="font-sans text-xs text-caramel">Invited — hasn't joined yet</p>}
                </div>
                <div className="flex items-center gap-4">
                  {m.joined_at && (
                    <Link href={`/parent/members/${m.id}`} className="font-sans text-sm font-bold text-matcha-deep underline">
                      Manage chores →
                    </Link>
                  )}
                  <button onClick={() => removeMember(m.id, m.display_name)} className="font-sans text-xs font-bold text-rust">
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {members.length === 0 && <p className="font-sans text-sm text-espresso-soft">No members yet.</p>}
          </div>

          <form onSubmit={addMemberEarly} className="mt-4 flex gap-2">
            <input
              type="text"
              placeholder="Add a member by name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              className="input-field"
            />
            <button type="submit" className="btn-primary shrink-0">
              Add
            </button>
          </form>
          {inviteLink && (
            <button onClick={copyInviteLink} className="mt-3 break-all text-left font-sans text-xs text-espresso-soft">
              Tap to copy their invite link:{" "}
              <span className="font-mono text-matcha-deep">{inviteLink}</span>
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
