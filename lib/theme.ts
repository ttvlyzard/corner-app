export type AccentThemeKey = "matcha" | "roast" | "berry" | "sky" | "honey";

export const ACCENT_THEMES: Record<AccentThemeKey, { name: string; accent: string; accentDeep: string; accentPale: string; swatch: string }> = {
  matcha: { name: "Matcha", accent: "107 142 78", accentDeep: "63 90 46", accentPale: "227 237 214", swatch: "#6B8E4E" },
  roast: { name: "Roast", accent: "150 92 58", accentDeep: "94 55 32", accentPale: "237 221 208", swatch: "#965C3A" },
  berry: { name: "Berry", accent: "150 58 92", accentDeep: "94 32 60", accentPale: "237 208 221", swatch: "#963A5C" },
  sky: { name: "Sky", accent: "58 110 150", accentDeep: "32 68 94", accentPale: "208 224 237", swatch: "#3A6E96" },
  honey: { name: "Honey", accent: "184 138 34", accentDeep: "122 90 18", accentPale: "241 226 186", swatch: "#B88A22" },
};

const DARK_ACCENT_PALE_OVERRIDE: Record<AccentThemeKey, string> = {
  matcha: "40 51 29",
  roast: "51 34 22",
  berry: "51 22 34",
  sky: "22 34 51",
  honey: "51 43 20",
};

export function applyAccentTheme(key: AccentThemeKey, isDark: boolean) {
  const theme = ACCENT_THEMES[key] ?? ACCENT_THEMES.matcha;
  const root = document.documentElement;
  root.style.setProperty("--color-accent", theme.accent);
  root.style.setProperty("--color-accent-deep", theme.accentDeep);
  root.style.setProperty("--color-accent-pale", isDark ? DARK_ACCENT_PALE_OVERRIDE[key] : theme.accentPale);
}

export function applyDarkMode(isDark: boolean) {
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem("corner-dark-mode", isDark ? "1" : "0");
}

export function getStoredDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("corner-dark-mode") === "1";
}
