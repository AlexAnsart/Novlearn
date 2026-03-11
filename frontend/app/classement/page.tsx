import { redirect } from "next/navigation";
import { Layout } from "../components/Layout";
import { MonthlyLeaderboard } from "../components/MonthlyLeaderboard";
import { getLeaderboardData, getServerUser, maybeAwardLastWeek } from "../lib/supabase-server";

/**
 * Page Classement - Optimisée avec données pré-chargées côté serveur
 *
 * Avantages de cette approche :
 * - Les données sont chargées avant que la page n'arrive au client (SSR)
 * - Pas de "flash" de chargement visible par l'utilisateur
 * - Meilleur SEO car le contenu est dans le HTML initial
 * - L'interactivité des onglets reste côté client
 */
export default async function ClassementPage() {
  // Vérification auth côté serveur
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Attribution des récompenses de la semaine précédente si besoin (idempotent)
  await maybeAwardLastWeek();

  // Pré-chargement des données du classement (tri par score par défaut)
  const initialLeaderboard = await getLeaderboardData("score", 20);

  return (
    <Layout>
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Titre de la page */}
          <div className="mb-6">
            <h1
              className="text-3xl text-white mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Classement de la semaine
            </h1>
            <p className="text-slate-400">
              Classement remis à zéro chaque dimanche à 23h59
            </p>
          </div>

          {/* Classement avec données pré-chargées */}
          <MonthlyLeaderboard
            limit={20}
            initialData={initialLeaderboard}
            initialSortBy="score"
          />

          {/* Info */}
          <div className="mt-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <h3 className="text-white font-medium mb-2">
              Comment gagner des points ?
            </h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• Chaque exercice réussi vous rapporte des points</li>
              <li>
                • La série compte le nombre de jours actifs dans la semaine
              </li>
              <li>• Le classement est réinitialisé le dimanche à 23h59</li>
              <li>• Entraînez-vous chaque jour pour rester au sommet !</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
