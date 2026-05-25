"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: typeof Sun;
};

const OPTIONS: ThemeOption[] = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
];

/**
 * Sélecteur de thème (Clair / Sombre / Système).
 * Utilise next-themes — persistance localStorage gérée nativement.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Évite l'erreur d'hydratation (le thème n'est connu qu'après mount)
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Choix du thème"
      className="inline-flex items-center gap-1 rounded-2xl bg-app-surface-sunken/70 border border-app-border/60 p-1 shadow-card-sm"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={[
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all",
              isActive
                ? "bg-app-primary text-white shadow-md"
                : "text-content-muted hover:text-content-strong hover:bg-app-icon-bg/60",
            ].join(" ")}
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
