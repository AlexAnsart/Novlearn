"use client";

import { Database, Eye, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex-1 px-4 md:px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1
            className="text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Politique de Confidentialité
          </h1>
          <p className="text-slate-400">
            Chez NovLearn, la protection de vos données est aussi importante que
            votre réussite scolaire.
          </p>
        </div>

        {/* Section 1 */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
              <Database size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Données collectées
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Nous collectons uniquement les données nécessaires au bon
            fonctionnement du jeu et de votre progression :
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-slate-400">
            <li>Votre adresse email (pour l'authentification).</li>
            <li>
              Votre nom et prénom (pour l'affichage du profil et le classement).
            </li>
            <li>
              Vos résultats aux exercices et votre progression (XP, niveaux).
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Eye size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">
              Utilisation des données
            </h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Vos données sont utilisées exclusivement pour :
          </p>
          <ul className="list-disc list-inside mt-4 space-y-2 text-slate-400">
            <li>
              Sauvegarder votre progression (vous ne voulez pas perdre votre
              niveau !).
            </li>
            <li>
              Afficher votre position dans le classement général (Leaderboard).
            </li>
            <li>Améliorer la qualité des exercices grâce à vos retours.</li>
          </ul>
          <p className="mt-4 text-emerald-400/80 text-sm font-semibold">
            Nous ne revendons JAMAIS vos données à des tiers.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <Shield size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Vos Droits (RGPD)</h2>
          </div>
          <p className="text-slate-300 leading-relaxed mb-4">
            Conformément à la réglementation, vous disposez d'un droit d'accès,
            de rectification et de suppression de vos données.
          </p>
          <p className="text-slate-400">
            Pour exercer ce droit ou supprimer votre compte, contactez-nous
            simplement à :
            <a
              href="mailto:contact@novlearn.fr"
              className="text-indigo-400 hover:underline ml-1"
            >
              contact@novlearn.fr
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
