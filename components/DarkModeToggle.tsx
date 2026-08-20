"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyDarkMode, getStoredDarkMode } from "@/lib/theme";

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(getStoredDarkMode());
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    applyDarkMode(next);
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full border-2 border-cream-line bg-cream text-espresso shadow-md transition-transform active:scale-90"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
