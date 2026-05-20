import { redirect } from "next/navigation";
import { Layout } from "../components/Layout";
import { MonthlyLeaderboard } from "../components/MonthlyLeaderboard";
import {
  getLeaderboardData,
  getServerUser,
  getSuccessRateLeaderboard,
  maybeAwardLastWeek,
} from "../lib/supabase-server";

export default async function ClassementPage() {
  const user = await getServerUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Attribution des récompenses + snapshot de la semaine précédente (idempotent)
  await maybeAwardLastWeek();

  // Chargement en parallèle : classement score + taux de réussite
  const [initialLeaderboard, initialSuccessRateData] = await Promise.all([
    getLeaderboardData("score", 20),
    getSuccessRateLeaderboard(10, 20),
  ]);

  return (
    <Layout>
      <div className="flex-1 px-8 pb-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1
              className="text-3xl text-white mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600 }}
            >
              Classement
            </h1>
            <p className="text-slate-400">
              Trois classements hebdomadaires remis à zéro chaque dimanche à 23h59
            </p>
          </div>

          <MonthlyLeaderboard
            limit={20}
            initialData={initialLeaderboard}
            initialSortBy="score"
            initialSuccessRateData={initialSuccessRateData}
          />

          <div className="mt-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50">
            <h3 className="text-white font-medium mb-2">
              Comment fonctionne le classement ?
            </h3>
            <ul className="text-slate-400 text-sm space-y-1">
              <li>• <span className="text-indigo-300 font-medium">Points</span> — chaque exercice réussi cette semaine rapporte 1 point</li>
              <li>• <span className="text-orange-400 font-medium">Série</span> — nombre de jours actifs dans la semaine (max 7)</li>
              <li>• <span className="text-emerald-400 font-medium">Taux de réussite</span> — exercices corrects / total cette semaine, minimum 10 exercices</li>
              <li>• Les trois classements sont remis à zéro le dimanche à 23h59</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
