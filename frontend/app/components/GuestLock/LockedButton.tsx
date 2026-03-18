"use client";
import { Lock } from "lucide-react";
import { ReactNode, useState } from "react";

interface LockedButtonProps {
  isLocked: boolean;
  reason: string;
  children: ReactNode;
  onUnlockClick?: () => void;
}

export function LockedButton({
  isLocked,
  reason,
  children,
  onUnlockClick,
}: LockedButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative" onMouseLeave={() => setShowTooltip(false)}>
      {/* Enfant rendu mais non-interactif */}
      <div className="pointer-events-none opacity-50 select-none">
        {children}
      </div>
      {/* Overlay cliquable */}
      <button
        className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/60 backdrop-blur-[1px] cursor-pointer hover:bg-slate-900/70 transition-all"
        onClick={() => {
          setShowTooltip(true);
          onUnlockClick?.();
        }}
        title={reason}
      >
        <Lock className="w-6 h-6 text-white/80" />
      </button>
      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white text-xs text-center whitespace-nowrap z-50 shadow-xl"
          style={{ fontFamily: "'Fredoka', sans-serif" }}
        >
          {reason}
        </div>
      )}
    </div>
  );
}
