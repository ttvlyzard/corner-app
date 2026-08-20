"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, KeyRound, ScanLine, Flame, BarChart3 } from "lucide-react";

const COPY = {
  homes: {
    eyebrow: "Chores, brewed daily",
    headline: "Corner",
    sub: "One list for the house, one code to join it. Chores go out, photos come back, and everyone knows exactly where today stands.",
    stampLabel: "sink and trash still need a photo",
    features: [
      { icon: KeyRound, title: "Join by code", body: "A 6-character code links a kid straight to the household." },
      { icon: Camera, title: "Proof, not promises", body: "Chores can require a photo — the sink actually has to be clean." },
      { icon: ScanLine, title: "Snap the chart", body: "Photograph a paper chore chart and it turns into a real list." },
    ],
  },
  teams: {
    eyebrow: "Shifts, tracked daily",
    headline: "Corner",
    sub: "One task list for the shop floor, one code to join it. Tasks go out, photo proof comes back, and every manager knows exactly where the shift stands.",
    stampLabel: "closing checklist still needs 2 photos",
    features: [
      { icon: KeyRound, title: "Join by code", body: "A 6-character code links a new hire straight to the team." },
      { icon: Camera, title: "Proof, not promises", body: "Tasks can require a photo — the closing checklist actually gets done." },
      { icon: ScanLine, title: "Snap the checklist", body: "Photograph a paper shift checklist and it turns into a real list." },
    ],
  },
};

const SAMPLE_PROOF: Record<number, string> = {
  0: "Dishes loaded, counter wiped ✨",
  1: "Trash bagged and out by the curb",
};

export default function Home() {
  const [audience, setAudience] = useState<"homes" | "teams">("homes");
  const [revealed, setRevealed] = useState<number | null>(null);
  const copy = COPY[audience];

  return (
    <main className="min-h-screen bg-cream overflow-hidden">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-6 inline-flex gap-1 rounded-full border-2 border-cream-line bg-white p-1">
              <button
                onClick={() => setAudience("homes")}
                className={`rounded-full px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wide transition-colors ${
                  audience === "homes" ? "bg-matcha text-cream" : "text-espresso-soft"
                }`}
              >
                For Homes
              </button>
              <button
                onClick={() => setAudience("teams")}
                className={`rounded-full px-4 py-1.5 font-sans text-xs font-bold uppercase tracking-wide transition-colors ${
                  audience === "teams" ? "bg-matcha text-cream" : "text-espresso-soft"
                }`}
              >
                For Teams
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={audience}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p className="eyebrow mb-4">{copy.eyebrow}</p>
                <h1 className="font-display text-6xl font-semibold leading-[1.05] text-espresso sm:text-7xl">
                  {copy.headline}
                </h1>
                <p className="mt-6 max-w-md font-sans text-lg text-espresso-soft">{copy.sub}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">
                Open an account
              </Link>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-3">
              {copy.features.map((f) => (
                <div key={f.title}>
                  <f.icon className="mb-2 h-6 w-6 text-matcha" strokeWidth={2.25} />
                  <p className="font-display text-xl text-matcha-deep">{f.title}</p>
                  <p className="mt-1 font-sans text-sm text-espresso-soft">{f.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup with the interactive live card inside */}
          <div className="mx-auto w-full max-w-[300px]">
            <div className="relative rounded-[2.5rem] border-[6px] border-espresso bg-espresso p-2 shadow-xl">
              <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-espresso" />
              <div className="rounded-[2rem] bg-cream px-5 pb-8 pt-10">
                <p className="eyebrow !text-[10px]">Today's card</p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso">Your chores</p>

                <div className="ticket mt-4 !p-4">
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const done = i < 2;
                      return (
                        <button
                          key={i}
                          onClick={() => done && setRevealed(revealed === i ? null : i)}
                          className={done ? "stamp-filled !h-8 !w-8 !text-xs" : "stamp-empty !h-8 !w-8 !text-xs"}
                        >
                          {done ? "✓" : "○"}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 font-mono text-[10px] text-espresso-soft">
                    2 of 5 done — {copy.stampLabel}
                  </p>

                  <AnimatePresence>
                    {revealed !== null && SAMPLE_PROOF[revealed] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-matcha-pale/60 p-2">
                          <Camera className="h-4 w-4 shrink-0 text-matcha-deep" />
                          <p className="font-sans text-[11px] text-matcha-deep">{SAMPLE_PROOF[revealed]}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <p className="mt-2 font-sans text-[10px] text-espresso-soft/70">Tap a ✓ to see the proof</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Streaks + analytics teaser */}
        <div className="mt-24 grid gap-6 border-t-2 border-cream-line pt-12 sm:grid-cols-2">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-matcha-pale p-3">
              <Flame className="h-5 w-5 text-matcha-deep" />
            </div>
            <div>
              <p className="font-display text-xl text-espresso">Streaks that mean something</p>
              <p className="mt-1 font-sans text-sm text-espresso-soft">
                Every fully finished day adds to a streak, and points build up alongside it —
                real recognition for showing up.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-matcha-pale p-3">
              <BarChart3 className="h-5 w-5 text-matcha-deep" />
            </div>
            <div>
              <p className="font-display text-xl text-espresso">See the whole picture</p>
              <p className="mt-1 font-sans text-sm text-espresso-soft">
                Completion rates and redo patterns, per person, so you know where things
                actually stand.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
