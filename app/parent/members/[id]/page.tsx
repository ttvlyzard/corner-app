"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ROUTINE_TEMPLATES } from "@/lib/routineTemplates";
import { fetchJson } from "@/lib/fetchJson";

type Chore = {
  id: string;
  title: string;
  description: string | null;
  requires_photo: boolean;
  due_date: string;
};

type SuggestedChore = { title: string; dueDate: string; requiresPhoto: boolean };

export default function MemberChoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: membershipId } = use(params);
  const [chores, setChores] = useState<Chore[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [requiresPhoto, setRequiresPhoto] = useState(false);
  const [recurrence, setRecurrence] = useState<"once" | "daily" | "weekly">("once");
  const [suggested, setSuggested] = useState<SuggestedChore[]>([]);
  const [importing, setImporting] = useState(false);

  async function loadChores() {
    const res = await fetchJson<Chore[]>(`/api/chores?membershipId=${membershipId}`);
    if (res.ok) setChores(res.data ?? []);
    else toast.error(res.error ?? "Couldn't load chores");
  }

  useEffect(() => {
    loadChores();
  }, [membershipId]);

  async function addChore(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    const res = await fetchJson<{ count?: number }>("/api/chores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, title, dueDate, requiresPhoto, recurrence }),
    });
    if (res.ok) {
      toast.success(res.data?.count ? `"${title}" added — ${res.data.count} occurrences` : `"${title}" added`);
    } else {
      toast.error(res.error ?? "Couldn't add that chore");
    }
    setTitle("");
    setRequiresPhoto(false);
    setRecurrence("once");
    loadChores();
  }

  async function applyTemplate(templateName: string) {
    const template = ROUTINE_TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;
    for (const c of template.chores) {
      await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, title: c.title, dueDate, requiresPhoto: c.requiresPhoto, recurrence: "daily" }),
      });
    }
    toast.success(`${template.name} added — ${template.chores.length} chores`);
    loadChores();
  }

  async function deleteChore(choreId: string) {
    const res = await fetchJson(`/api/chores/${choreId}`, { method: "DELETE" });
    if (res.ok) toast.success("Chore deleted");
    else toast.error(res.error ?? "Couldn't delete that chore");
    loadChores();
  }

  async function saveEdit(choreId: string, updates: { title: string; dueDate: string; requiresPhoto: boolean }) {
    const res = await fetchJson(`/api/chores/${choreId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: updates.title, dueDate: updates.dueDate, requiresPhoto: updates.requiresPhoto }),
    });
    if (res.ok) toast.success("Chore updated");
    else toast.error(res.error ?? "Couldn't save changes");
    loadChores();
  }

  async function handleChartUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const formData = new FormData();
    formData.append("photo", file);
    const res = await fetch("/api/chart-import", { method: "POST", body: formData });
    const data = await res.json();
    setImporting(false);
    if (res.ok) {
      setSuggested(data.suggestedChores);
      toast.success(`Found ${data.suggestedChores.length} chores on the chart`);
    } else {
      toast.error(data.error ?? "Couldn't read that photo");
    }
  }

  async function confirmSuggested() {
    for (const s of suggested) {
      await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, title: s.title, dueDate: s.dueDate, requiresPhoto: s.requiresPhoto }),
      });
    }
    toast.success(`${suggested.length} chores added`);
    setSuggested([]);
    loadChores();
  }

  return (
    <main className="min-h-screen bg-cream px-6 py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        <div>
          <Link href="/parent/dashboard" className="font-sans text-sm font-bold text-matcha-deep underline">
            ← Dashboard
          </Link>
          <h1 className="mt-2 font-display text-4xl font-semibold text-espresso">Chores</h1>
        </div>

        <section className="card">
          <p className="eyebrow mb-4">Routine templates</p>
          <div className="flex flex-wrap gap-2">
            {ROUTINE_TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => applyTemplate(t.name)}
                className="rounded-full border-2 border-matcha-deep/30 bg-matcha-pale/50 px-4 py-2 font-sans text-xs font-bold text-matcha-deep transition-colors hover:bg-matcha-pale active:scale-95"
              >
                {t.name} <span className="opacity-60">· {t.chores.length}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <p className="eyebrow mb-4">Add a chore</p>
          <form onSubmit={addChore} className="space-y-3">
            <input
              type="text"
              placeholder="e.g. Clean the sink"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
            />
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field !w-auto"
              />
              <label className="flex items-center gap-2 font-sans text-sm text-espresso">
                <input
                  type="checkbox"
                  checked={requiresPhoto}
                  onChange={(e) => setRequiresPhoto(e.target.checked)}
                  className="h-4 w-4 accent-matcha"
                />
                Require a photo
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as "once" | "daily" | "weekly")}
                className="input-field !w-auto"
              >
                <option value="once">Just once</option>
                <option value="daily">Repeats daily (4 weeks)</option>
                <option value="weekly">Repeats weekly (8 weeks)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary">
              Add chore
            </button>
          </form>
        </section>

        <section className="card">
          <p className="eyebrow mb-2">Import from a chart photo</p>
          <p className="mb-4 font-sans text-sm text-espresso-soft">
            Photograph a paper chore chart — chores and dates get pulled out automatically.
          </p>
          <input type="file" accept="image/*" capture="environment" onChange={handleChartUpload} className="font-sans text-sm" />
          {importing && <p className="mt-2 font-sans text-sm text-caramel">Reading the chart…</p>}

          {suggested.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="font-sans text-sm font-bold text-espresso">Found {suggested.length} chores — review before adding:</p>
              <ul className="space-y-1 font-sans text-sm text-espresso-soft">
                {suggested.map((s, i) => (
                  <li key={i}>
                    {s.title} — due {s.dueDate} {s.requiresPhoto && "(photo required)"}
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button onClick={confirmSuggested} className="btn-primary">
                  Add all
                </button>
                <button onClick={() => setSuggested([])} className="btn-secondary">
                  Discard
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="eyebrow mb-1">Chore list</p>
          {chores.map((c) => (
            <ChoreRow key={c.id} chore={c} onSave={saveEdit} onDelete={deleteChore} />
          ))}
          {chores.length === 0 && <p className="font-sans text-sm text-espresso-soft">No chores yet.</p>}
        </section>
      </div>
    </main>
  );
}

function ChoreRow({
  chore,
  onSave,
  onDelete,
}: {
  chore: Chore;
  onSave: (id: string, updates: { title: string; dueDate: string; requiresPhoto: boolean }) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chore.title);
  const [dueDate, setDueDate] = useState(chore.due_date);
  const [requiresPhoto, setRequiresPhoto] = useState(chore.requires_photo);

  if (editing) {
    return (
      <div className="card space-y-3 !py-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
        <div className="flex flex-wrap items-center gap-4">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field !w-auto" />
          <label className="flex items-center gap-2 font-sans text-sm text-espresso">
            <input
              type="checkbox"
              checked={requiresPhoto}
              onChange={(e) => setRequiresPhoto(e.target.checked)}
              className="h-4 w-4 accent-matcha"
            />
            Require a photo
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSave(chore.id, { title, dueDate, requiresPhoto });
              setEditing(false);
            }}
            className="btn-primary !px-4 !py-2 !text-xs"
          >
            Save
          </button>
          <button onClick={() => setEditing(false)} className="btn-secondary !px-4 !py-2 !text-xs">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between !py-4">
      <div>
        <p className="font-sans font-bold text-espresso">{chore.title}</p>
        <p className="font-mono text-xs text-espresso-soft">
          Due {chore.due_date} {chore.requires_photo && "· photo required"}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setEditing(true)} className="font-sans text-sm font-bold text-matcha-deep underline">
          Edit
        </button>
        <button onClick={() => onDelete(chore.id)} className="btn-danger-ghost">
          Delete
        </button>
      </div>
    </div>
  );
}
