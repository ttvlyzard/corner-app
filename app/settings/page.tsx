"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { fetchJson } from "@/lib/fetchJson";
import { createClient } from "@/lib/supabase/client";
import { ACCENT_THEMES, applyAccentTheme, getStoredDarkMode, type AccentThemeKey } from "@/lib/theme";

const AVATAR_OPTIONS = [
  "🙂", "😀", "😎", "🤓", "🥳", "😺", "🐶", "🐼", "🦊", "🐸",
  "🦁", "🐵", "🦄", "🐯", "🐨", "🐰", "🦋", "🌟", "🔥", "⚡",
];

type Profile = { avatar_emoji: string | null; full_name: string };
type GroupInfo = { id: string; name: string; accent_theme: AccentThemeKey };

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<"parent" | "child" | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const profileRes = await fetchJson<Profile>("/api/profile");
    if (profileRes.ok && profileRes.data) setProfile(profileRes.data);

    const groupRes = await fetchJson<{ role: "parent" | "child"; group: GroupInfo }>("/api/groups");
    if (groupRes.ok && groupRes.data) {
      setRole(groupRes.data.role);
      setGroup(groupRes.data.group);
      setGroupName(groupRes.data.group.name);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function pickAvatar(emoji: string) {
    setProfile((p) => (p ? { ...p, avatar_emoji: emoji } : p));
    const res = await fetchJson("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarEmoji: emoji }),
    });
    if (res.ok) toast.success("Avatar updated");
    else toast.error(res.error ?? "Couldn't save that");
  }

  async function pickTheme(key: AccentThemeKey) {
    if (!group) return;
    applyAccentTheme(key, getStoredDarkMode());
    setGroup({ ...group, accent_theme: key });
    const res = await fetchJson(`/api/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accentTheme: key }),
    });
    if (res.ok) toast.success("Theme updated for everyone");
    else toast.error(res.error ?? "Couldn't save that");
  }

  async function saveGroupName(e: React.FormEvent) {
    e.preventDefault();
    if (!group || !groupName) return;
    const res = await fetchJson(`/api/groups/${group.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName }),
    });
    if (res.ok) toast.success("Name updated");
    else toast.error(res.error ?? "Couldn't save that");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-cream px-6 py-16">
        <div className="mx-auto max-w-sm text-center">
          <div className="stamp-empty mx-auto animate-pulse !h-12 !w-12" />
          <p className="mt-4 font-sans text-sm text-espresso-soft">Loading settings…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <Link
            href={role === "parent" ? "/parent/dashboard" : "/child/dashboard"}
            className="font-sans text-sm font-bold text-matcha-deep underline"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">Settings</h1>
        </div>

        <section className="card">
          <p className="eyebrow mb-4">Your avatar</p>
          <div className="grid grid-cols-10 gap-2">
            {AVATAR_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => pickAvatar(emoji)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform active:scale-90 ${
                  profile?.avatar_emoji === emoji ? "bg-matcha-pale ring-2 ring-matcha" : "hover:bg-cream-line/40"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </section>

        {role === "parent" && group && (
          <>
            <section className="card">
              <p className="eyebrow mb-4">Color theme</p>
              <p className="mb-4 font-sans text-sm text-espresso-soft">Applies for everyone in the household or team.</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(ACCENT_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => pickTheme(key as AccentThemeKey)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform active:scale-90"
                      style={{
                        backgroundColor: theme.swatch,
                        borderColor: group.accent_theme === key ? "rgb(var(--color-ink))" : "transparent",
                      }}
                    >
                      {group.accent_theme === key && <span className="text-white text-xs">✓</span>}
                    </span>
                    <span className="font-sans text-xs text-espresso-soft">{theme.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="card">
              <p className="eyebrow mb-4">Household / team name</p>
              <form onSubmit={saveGroupName} className="flex gap-2">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="input-field"
                />
                <button type="submit" className="btn-primary shrink-0">
                  Save
                </button>
              </form>
            </section>
          </>
        )}

        <section className="card">
          <p className="eyebrow mb-2">Appearance</p>
          <p className="font-sans text-sm text-espresso-soft">
            Dark mode toggle lives in the bottom-right corner of every page.
          </p>
        </section>

        <button onClick={signOut} className="flex items-center gap-2 font-sans text-sm font-bold text-rust">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </main>
  );
}
