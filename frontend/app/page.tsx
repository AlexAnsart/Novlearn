export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* En-tête principal */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">
            Novlearn
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Plateforme d&apos;entraînement ludique et personnalisée pour le Bac de mathématiques
          </p>
        </div>

        {/* Section description */}
        <div className="mt-12 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              À propos du projet
            </h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Novlearn est une application web conçue pour aider les élèves de Terminale spécialité Mathématiques 
              à se préparer efficacement au Bac. La plateforme propose des exercices interactifs, un suivi personnalisé 
              de la progression, et des fonctionnalités ludiques pour maintenir la motivation.
            </p>
          </div>

          {/* Fonctionnalités principales */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 space-y-2">
              <div className="text-3xl mb-2">📚</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Exercices interactifs
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exercices générés dynamiquement avec correction automatique
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 space-y-2">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Suivi personnalisé
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Visualisation de la progression et recommandations adaptées
              </p>
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 space-y-2">
              <div className="text-3xl mb-2">🎮</div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Approche ludique
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Duels entre élèves et classements pour motiver l&apos;apprentissage
              </p>
            </div>
          </div>
        </div>

        {/* Statut de développement */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🚧 Application en développement - Version 0.1.0
          </p>
        </div>
      </div>
    </main>
  );
}

