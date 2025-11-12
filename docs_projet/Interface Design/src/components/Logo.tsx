export function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Logo style Peugeot - Blason avec lion stylisé */}
      <div className="relative w-16 h-20">
        <svg viewBox="0 0 100 120" className="w-full h-full">
          {/* Blason */}
          <path 
            d="M 50 5 L 85 20 L 85 60 Q 85 90 50 115 Q 15 90 15 60 L 15 20 Z" 
            fill="url(#shieldGradient)"
            stroke="#1e3a8a"
            strokeWidth="2"
          />
          
          {/* Gradients */}
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
            <linearGradient id="lionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          
          {/* Lion stylisé */}
          <g transform="translate(50, 60)">
            {/* Corps du lion simplifié */}
            <ellipse cx="0" cy="0" rx="22" ry="18" fill="url(#lionGradient)" opacity="0.9"/>
            
            {/* Tête */}
            <circle cx="0" cy="-15" r="12" fill="url(#lionGradient)"/>
            
            {/* Crinière stylisée - triangles */}
            <path d="M -8 -22 L -12 -28 L -4 -26 Z" fill="url(#lionGradient)" opacity="0.8"/>
            <path d="M 0 -24 L 0 -30 L 4 -26 Z" fill="url(#lionGradient)" opacity="0.8"/>
            <path d="M 8 -22 L 12 -28 L 4 -26 Z" fill="url(#lionGradient)" opacity="0.8"/>
            
            {/* Symbole Pi mathématique intégré */}
            <text x="-6" y="8" fill="white" fontSize="16" fontWeight="bold" fontFamily="serif">π</text>
          </g>
          
          {/* Bordure décorative */}
          <path 
            d="M 50 5 L 85 20 L 85 60 Q 85 90 50 115 Q 15 90 15 60 L 15 20 Z" 
            fill="none"
            stroke="white"
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>
      </div>
      
      {/* Nom du site avec meilleur contraste */}
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
    </div>
  );
}
