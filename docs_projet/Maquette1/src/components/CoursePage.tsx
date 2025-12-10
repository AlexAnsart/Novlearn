import { BookOpen } from "lucide-react";

export function CoursePage() {
  const chapters = [
    "Suites et limites",
    "Limites et continuité",
    "Dérivabilité",
    "Logarithme néperien",
    "Primitives et équations différentielles",
    "Convexité",
    "Statistiques",
    "Probabilités",
  ];

  return (
    <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
      <div className="max-w-5xl w-full space-y-6">
        {/* Titre */}
        <div className="text-center">
          <h2
            className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)]"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
          >
            Réviser le cours
          </h2>
          <p
            className="text-blue-200 mt-2 drop-shadow-md"
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}
          >
            Tous les chapitres de Terminale
          </p>
        </div>

        {/* Liste des chapitres */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapters.map((chapter, index) => (
            <div
              key={index}
              className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] hover:bg-slate-700/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-white"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.125rem" }}
                  >
                    {chapter}
                  </h3>
                  <p
                    className="text-blue-200"
                    style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500, fontSize: "0.875rem" }}
                  >
                    Chapitre {index + 1}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
