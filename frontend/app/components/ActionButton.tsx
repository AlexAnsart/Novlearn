'use client';

import { ReactNode } from 'react';

/**
 * Composant ActionButton - Bouton d'action avec effet 3D
 * Variantes : primary (bleu) et secondary (violet)
 */
interface ActionButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  icon?: ReactNode;
}

export function ActionButton({ children, variant = 'primary', onClick, icon }: ActionButtonProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      className={`
        relative px-8 py-4 rounded-3xl min-w-[240px]
        transform transition-all duration-200 
        hover:scale-105 active:scale-95
        flex items-center justify-center gap-3
        ${isPrimary 
          ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)] active:shadow-[0_4px_0_0_rgb(29,78,216),0_6px_15px_rgba(37,99,235,0.3)] active:translate-y-1 hover:shadow-[0_10px_0_0_rgb(29,78,216),0_15px_25px_rgba(37,99,235,0.4)]'
          : 'bg-gradient-to-b from-purple-500 to-purple-700 text-white shadow-[0_8px_0_0_rgb(107,33,168),0_13px_20px_rgba(147,51,234,0.3)] active:shadow-[0_4px_0_0_rgb(107,33,168),0_6px_15px_rgba(147,51,234,0.3)] active:translate-y-1 hover:shadow-[0_10px_0_0_rgb(107,33,168),0_15px_25px_rgba(147,51,234,0.4)]'
        }
      `}
      style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.125rem' }}
    >
      {icon && <span className="text-2xl">{icon}</span>}
      {children}
    </button>
  );
}

