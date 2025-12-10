import logoImage from "figma:asset/e87ed438d673a206ab378f4bc50ae391b5d1f031.png";

interface LogoProps {
  small?: boolean;
}

export function Logo({ small = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo NovLearn avec fond transparent */}
      <div className={small ? "w-12 h-12" : "w-16 h-16"}>
        <img 
          src={logoImage} 
          alt="NovLearn Logo" 
          className="w-full h-full object-contain"
          style={{
            filter: "drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))",
            mixBlendMode: "normal"
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
