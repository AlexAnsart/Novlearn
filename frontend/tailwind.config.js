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
        // ─────────────────────────────────────────────────────────────
        // TOKENS SÉMANTIQUES — s'adaptent automatiquement au thème
        // Voir globals.css pour les valeurs HSL claires / sombres.
        // ─────────────────────────────────────────────────────────────

        // Couleurs de structure (backgrounds, surfaces, bordures)
        // Usage : bg-app-bg, bg-app-surface, border-app-border…
        app: {
          // Backgrounds de page (utilisés pour le gradient principal)
          "bg-deep": "hsl(var(--color-bg-deep) / <alpha-value>)",
          "bg-mid": "hsl(var(--color-bg-mid) / <alpha-value>)",
          "bg-soft": "hsl(var(--color-bg-soft) / <alpha-value>)",
          // Alias pour rétro-compatibilité (ancien token bg)
          bg: "hsl(var(--color-bg-soft) / <alpha-value>)",

          // Surfaces (cartes, sidebar, modales)
          surface: "hsl(var(--color-surface) / <alpha-value>)",
          "surface-elevated":
            "hsl(var(--color-surface-elevated) / <alpha-value>)",
          "surface-sunken": "hsl(var(--color-surface-sunken) / <alpha-value>)",
          "surface-overlay":
            "hsl(var(--color-surface-overlay) / <alpha-value>)",

          // Bordures
          "border-subtle": "hsl(var(--color-border-subtle) / <alpha-value>)",
          border: "hsl(var(--color-border) / <alpha-value>)",
          "border-strong": "hsl(var(--color-border-strong) / <alpha-value>)",

          // Accents de marque
          primary: "hsl(var(--color-primary) / <alpha-value>)",
          "primary-hover": "hsl(var(--color-primary-hover) / <alpha-value>)",
          "primary-soft": "hsl(var(--color-primary-soft) / <alpha-value>)",
          accent: "hsl(var(--color-accent) / <alpha-value>)",
          accent2: "hsl(var(--color-accent2) / <alpha-value>)",

          // États
          "icon-bg": "hsl(var(--color-icon-bg) / <alpha-value>)",
          "icon-bg-hover": "hsl(var(--color-icon-bg-hover) / <alpha-value>)",
          danger: "hsl(var(--color-danger) / <alpha-value>)",
          success: "hsl(var(--color-success) / <alpha-value>)",
          warning: "hsl(var(--color-warning) / <alpha-value>)",
        },

        // Textes — usage : text-content-strong, text-content-main, etc.
        content: {
          strong: "hsl(var(--color-text-strong) / <alpha-value>)",
          main: "hsl(var(--color-text-main) / <alpha-value>)",
          muted: "hsl(var(--color-text-muted) / <alpha-value>)",
          subtle: "hsl(var(--color-text-subtle) / <alpha-value>)",
        },

        // ─────────────────────────────────────────────────────────────
        // PALETTE FIXE (charte graphique — ne change pas avec le thème)
        // Utiliser pour les couleurs sémantiques (succès, danger, etc.)
        // ─────────────────────────────────────────────────────────────
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
      boxShadow: {
        card: "var(--shadow-card)",
        "card-sm": "var(--shadow-card-sm)",
      },
    },
  },
  plugins: [],
};
