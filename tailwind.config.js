/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "rgb(var(--color-bg) / <alpha-value>)",
        "cream-line": "rgb(var(--color-line) / <alpha-value>)",
        espresso: "rgb(var(--color-ink) / <alpha-value>)",
        "espresso-soft": "rgb(var(--color-ink-soft) / <alpha-value>)",
        matcha: "rgb(var(--color-accent) / <alpha-value>)",
        "matcha-deep": "rgb(var(--color-accent-deep) / <alpha-value>)",
        "matcha-pale": "rgb(var(--color-accent-pale) / <alpha-value>)",
        caramel: "#C68B3D",
        rust: "#A6432A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-work-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
