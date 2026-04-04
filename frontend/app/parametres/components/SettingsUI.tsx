"use client";

import { Monitor, Moon, Sun } from "lucide-react";

// --- SWITCH ---

export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        checked ? "bg-indigo-500" : "bg-app-border"
      }`}
    >
      <div
        className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// --- TAB BUTTON ---

export function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-indigo-500 text-white shadow-md"
          : "text-content-muted hover:text-content-main hover:bg-app-surface/50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- THEME CARD ---

export function ThemeCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all duration-200 group ${
        active
          ? "bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500"
          : "bg-app-bg border-app-border hover:border-app-border/70 hover:bg-app-surface"
      }`}
    >
      <div
        className={`mb-3 transition-colors ${active ? "text-indigo-400" : "text-content-muted group-hover:text-content-main"}`}
      >
        {icon}
      </div>
      <div className="font-bold text-content-main mb-1">{label}</div>
      <div className="text-xs text-content-muted">{description}</div>
      {active && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
      )}
    </button>
  );
}
