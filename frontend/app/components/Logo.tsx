'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface LogoProps {
  small?: boolean;
}

/**
 * Composant Logo - Affiche le logo NovLearn
 * Utilise la police Fredoka selon la charte graphique
 */
export function Logo({ small = false }: LogoProps) {
  const router = useRouter();

  return (
    <div 
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => router.push('/')}
    >
      {/* Logo NovLearn avec fond transparent */}
      <div className={small ? "w-12 h-12" : "w-16 h-16"}>
        <Image 
          src="/logo.png" 
          alt="NovLearn Logo" 
          width={64}
          height={64}
          className="w-full h-full object-contain"
          style={{
            filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))",
            mixBlendMode: "normal",
            borderRadius: "5px"
          }}
        />
      </div>
      
      {/* Nom du site avec meilleur contraste */}
      {!small && (
        <div className="flex flex-col">
          <h1 
            className="text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]" 
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            NovLearn
          </h1>
          <p className="text-xs text-blue-200 -mt-1 drop-shadow-md" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            Maths Bac
          </p>
        </div>
      )}
    </div>
  );
}

