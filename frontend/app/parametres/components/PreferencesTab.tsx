"use client";

import { Monitor, Moon, Sun, Volume2, VolumeX, Zap } from "lucide-react";
import { Switch, ThemeCard } from "./SettingsUI";

interface PreferencesTabProps {
  theme: string | undefined;
  setTheme: (t: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
  playSlide: () => void;
}

export function PreferencesTab({
  theme,
  setTheme,
  soundEnabled,
  setSoundEnabled,
  reduceMotion,
  setReduceMotion,
  playSlide,
}: PreferencesTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Apparence */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl p-6 md:p-8">
        <h2 className="text-xl font-bold text-content-main mb-6 flex items-center gap-2">
          <Monitor className="text-blue-400" /> Apparence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ThemeCard
            active={theme === "light"}
            onClick={() => setTheme("light")}
            icon={<Sun size={24} />}
            label="Clair"
            description="Lumineux"
          />
          <ThemeCard
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
            icon={<Moon size={24} />}
            label="Sombre"
            description="Recommandé"
          />
          <ThemeCard
            active={theme === "system"}
            onClick={() => setTheme("system")}
            icon={<Monitor size={24} />}
            label="Système"
            description="Automatique"
          />
        </div>
      </section>

      {/* Options */}
      <section className="bg-app-surface/50 border border-app-border rounded-2xl overflow-hidden">
        {/* Son */}
        <div className="p-6 flex items-center justify-between border-b border-app-border/50">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl transition-colors ${soundEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-app-surface text-content-muted"}`}
            >
              {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </div>
            <div>
              <h3 className="text-content-main font-bold">Effets sonores</h3>
              <p className="text-content-muted text-sm">Bruitages lors des exercices</p>
            </div>
          </div>
          <Switch
            checked={soundEnabled}
            onChange={(val) => {
              playSlide();
              setSoundEnabled(val);
            }}
          />
        </div>

        {/* Animations */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-xl transition-colors ${!reduceMotion ? "bg-purple-500/20 text-purple-400" : "bg-app-surface text-content-muted"}`}
            >
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-content-main font-bold">Animations fluides</h3>
              <p className="text-content-muted text-sm">Désactiver pour réduire les mouvements</p>
            </div>
          </div>
          <Switch
            checked={!reduceMotion}
            onChange={(val) => {
              playSlide();
              setReduceMotion(!val);
            }}
          />
        </div>
      </section>
    </div>
  );
}
