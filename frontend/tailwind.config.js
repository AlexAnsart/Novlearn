/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Couleurs de structure (s'adaptent au thème) ──
        // Usage : bg-app-bg, bg-app-surface, border-app-border…
        app: {
          bg: "hsl(var(--color-bg) / <alpha-value>)",
          surface: "hsl(var(--color-surface) / <alpha-value>)",
          border: "hsl(var(--color-border) / <alpha-value>)",
          primary: "hsl(var(--color-primary) / <alpha-value>)",
          "primary-hover": "hsl(var(--color-primary-hover) / <alpha-value>)",
        },
        // ── Couleurs de texte (s'adaptent au thème) ──
        // Usage : text-content-main, text-content-muted
        content: {
          main: "hsl(var(--color-text-main) / <alpha-value>)",
          muted: "hsl(var(--color-text-muted) / <alpha-value>)",
        },

        // ── Palette fixe (charte graphique, ne change pas avec le thème) ──
        primary: {
          50: "#f0f9ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#38bdf8",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#0c4a6e",
          950: "#0c4a6e",
        },
        purple: {
          300: "#d8b4fe",
          500: "#a855f7",
          700: "#7e22ce",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
        slate: {
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
    },
  },
  plugins: [],
};
