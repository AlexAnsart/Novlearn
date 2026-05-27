"use client";

import { ReactNode } from "react";

/**
 * Composant SidebarIcon - Icône de navigation dans la sidebar
 * Supporte les états actif/inactif avec effets hover
 */
interface SidebarIconProps {
  emoji: string | ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SidebarIcon({
  emoji,
  active = false,
  onClick,
  className = "",
}: SidebarIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-12 h-12 rounded-full
        flex items-center justify-center
        transform transition-all duration-200 
        hover:scale-110 active:scale-95
        ${
          active
            ? "bg-app-primary/85 shadow-lg shadow-app-primary/30"
            : "bg-app-icon-bg/50 hover:bg-app-icon-bg-hover/70"
        }
        ${className}
      `}
    >
      {typeof emoji === "string" ? (
        <span className="text-2xl">{emoji}</span>
      ) : (
        <div className="text-content-strong">{emoji}</div>
      )}
    </button>
  );
}
