"use client";

import { useEffect } from "react";
import { applyDarkMode, applyAccentTheme, getStoredDarkMode, type AccentThemeKey } from "@/lib/theme";

// Sits once in the root layout. On every page load, re-applies whatever dark
// mode preference is stored locally, and defaults the accent to matcha until
// a page that knows the group's chosen theme calls useApplyAccent below.
export default function ThemeInit() {
  useEffect(() => {
    const isDark = getStoredDarkMode();
    applyDarkMode(isDark);
    applyAccentTheme("matcha", isDark);
  }, []);

  return null;
}

// Call from any page that has loaded the group's accent_theme, so the whole
// UI (including badges, buttons, tickets) reflects the household's chosen color.
export function useApplyAccent(accentTheme: AccentThemeKey | null | undefined) {
  useEffect(() => {
    if (!accentTheme) return;
    applyAccentTheme(accentTheme, getStoredDarkMode());
  }, [accentTheme]);
}
