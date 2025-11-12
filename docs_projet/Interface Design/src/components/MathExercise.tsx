export function MathExercise() {
  return (
    <div className="relative bg-white/95 backdrop-blur-sm rounded-[3rem] p-8 shadow-2xl">
      <div className="space-y-4">
        {/* Titre de l'exercice */}
        <div className="border-b-2 border-gray-200 pb-3">
          <h3 className="text-gray-700" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: '1.25rem' }}>
            Exercice - Fonction exponentielle
          </h3>
          <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            Terminale - Analyse
          </p>
        </div>
        
        {/* Énoncé */}
        <div className="space-y-3 text-gray-700">
          <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 500 }}>
            Soit la fonction <span className="italic">f</span> définie sur ℝ par :
          </p>
          
          {/* Formule mathématique */}
          <div className="bg-blue-50 rounded-2xl p-4 my-3 flex items-center justify-center">
            <span className="text-2xl" style={{ fontFamily: "serif" }}>
              <i>f</i>(<i>x</i>) = <i>x</i>² · e<sup>-<i>x</i></sup>
            </span>
          </div>
          
          {/* Questions */}
          <div className="space-y-2">
            <p style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}>
              1. Déterminer la limite de <i>f</i> en +∞
            </p>
          </div>
        </div>
        
        {/* Bouton S'entraîner au centre */}
        <div className="flex justify-center pt-4">
          <button
            className="
              relative px-10 py-4 rounded-3xl
              bg-gradient-to-b from-blue-500 to-blue-700 text-white 
              shadow-[0_8px_0_0_rgb(29,78,216),0_13px_20px_rgba(37,99,235,0.3)]
              transform transition-all duration-200 hover:scale-105 active:scale-95
              active:shadow-[0_4px_0_0_rgb(29,78,216),0_6px_15px_rgba(37,99,235,0.3)] 
              active:translate-y-1
            "
            style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700, fontSize: '1.5rem' }}
          >
            S'entraîner
          </button>
        </div>
      </div>
      
      {/* Éléments décoratifs mathématiques */}
      <div className="absolute top-4 right-6 text-blue-300 opacity-20 text-4xl" style={{ fontFamily: "serif" }}>∫</div>
      <div className="absolute bottom-6 left-6 text-purple-300 opacity-20 text-3xl" style={{ fontFamily: "serif" }}>Σ</div>
      <div className="absolute top-12 left-8 text-blue-200 opacity-20 text-2xl" style={{ fontFamily: "serif" }}>∞</div>
    </div>
  );
}
