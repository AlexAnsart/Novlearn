'use client';

/**
 * Composant SidebarIcon - Icône de navigation dans la sidebar
 * Supporte les états actif/inactif avec effets hover
 */
interface SidebarIconProps {
  emoji: string;
  active?: boolean;
  onClick?: () => void;
}

export function SidebarIcon({ emoji, active = false, onClick }: SidebarIconProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-12 h-12 rounded-full
        flex items-center justify-center
        transform transition-all duration-200 
        hover:scale-110 active:scale-95
        ${active
          ? 'bg-blue-600/80 shadow-lg shadow-blue-500/30'
          : 'bg-slate-700/50 hover:bg-slate-600/60'
        }
      `}
    >
      <span className="text-2xl">{emoji}</span>
    </button>
  );
}

