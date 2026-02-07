"use client";

import { Layout } from "../components/Layout";

export default function TermsOfServicePage() {
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-12 overflow-y-auto bg-slate-900">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-700/50">
            {/* Header */}
            <h1
              className="text-3xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)] mb-2"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-slate-400 mb-8 italic">
              Dernière mise à jour : {currentDate}
            </p>

            {/* Contenu */}
            <div
              className="space-y-8 text-blue-100 leading-relaxed"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  1. Introduction
                </h2>
                <p>
                  Bienvenue sur <strong>NovLearn</strong>. En accédant à notre
                  site web et en utilisant nos services d'apprentissage, vous
                  acceptez d'être lié par les présentes Conditions Générales
                  d'Utilisation (CGU). Si vous n'acceptez pas ces termes,
                  veuillez ne pas utiliser nos services.
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  2. Description du Service
                </h2>
                <p>
                  NovLearn est une plateforme éducative interactive proposant
                  des exercices de mathématiques et de sciences, un suivi de
                  progression, et des fonctionnalités sociales. Notre objectif
                  est de fournir un outil d'entraînement, mais nous ne
                  garantissons pas l'obtention de résultats académiques
                  spécifiques (notes, diplômes).
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  3. Compte Utilisateur
                </h2>
                <ul className="list-disc list-inside space-y-2 ml-2 text-blue-200">
                  <li>
                    <strong>Inscription :</strong> Vous vous engagez à fournir
                    des informations exactes lors de votre inscription.
                  </li>
                  <li>
                    <strong>Sécurité :</strong> Vous êtes responsable de la
                    confidentialité de votre mot de passe. NovLearn ne pourra
                    être tenu responsable en cas d'accès non autorisé à votre
                    compte.
                  </li>
                  <li>
                    <strong>Mineurs :</strong> Si vous êtes mineur, vous
                    confirmez avoir l'autorisation de vos représentants légaux
                    pour utiliser cette application.
                  </li>
                </ul>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  4. Code de Conduite & Triche
                </h2>
                <p className="mb-3">
                  Pour maintenir un environnement sain et équitable, notamment
                  concernant le classement (Leaderboard), il est interdit de :
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2 text-blue-200">
                  <li>
                    Utiliser des scripts, bots ou tout autre moyen automatisé
                    pour résoudre les exercices.
                  </li>
                  <li>
                    Exploiter des bugs pour gagner artificiellement de
                    l'expérience (XP) ou des niveaux.
                  </li>
                  <li>
                    Envoyer des messages inappropriés, insultants ou
                    publicitaires via le système de Feedback ou les demandes
                    d'amis.
                  </li>
                </ul>
                <p className="mt-3 text-red-300/80 text-sm">
                  Toute violation de ces règles pourra entraîner la suspension
                  du compte ou la réinitialisation de la progression.
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  5. Propriété Intellectuelle
                </h2>
                <p>
                  L'ensemble du contenu présent sur NovLearn (exercices, textes,
                  logos, graphismes, code source) est la propriété exclusive de
                  NovLearn ou de ses partenaires. Toute reproduction,
                  distribution ou modification sans autorisation écrite est
                  interdite.
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  6. Gamification et Monnaie Virtuelle
                </h2>
                <p>
                  Les éléments virtuels tels que les "NovCoins", l'XP, les
                  trophées ou les "Flammes" n'ont aucune valeur monétaire
                  réelle. Ils ne peuvent être ni vendus, ni échangés contre de
                  l'argent réel. NovLearn se réserve le droit de modifier les
                  règles d'attribution de ces récompenses à tout moment pour
                  l'équilibre du jeu.
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  7. Limitation de Responsabilité
                </h2>
                <p>
                  NovLearn s'efforce de maintenir le service accessible 24/7 et
                  de corriger les erreurs de contenu signalées. Cependant, nous
                  ne garantissons pas que le service sera exempt de bugs ou
                  d'interruptions. Nous ne sommes pas responsables des
                  éventuelles erreurs dans les corrections d'exercices.
                </p>
              </section>

              <section>
                <h2
                  className="text-2xl text-white mb-4 flex items-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  8. Modifications des CGU
                </h2>
                <p>
                  Nous nous réservons le droit de modifier ces conditions à tout
                  moment. Les modifications prendront effet dès leur publication
                  sur cette page. Il est de votre responsabilité de consulter
                  régulièrement ces conditions.
                </p>
              </section>

              <section className="pt-6 border-t border-slate-700">
                <h2
                  className="text-xl text-white mb-2"
                  style={{ fontWeight: 600 }}
                >
                  Nous contacter
                </h2>
                <p>
                  Pour toute question relative à ces conditions ou pour signaler
                  un contenu inapproprié, vous pouvez utiliser le formulaire de
                  feedback intégré à l'application ou nous écrire à
                  contact@novlearn.fr.
                </p>
              </section>
            </div>
          </div>

          <div className="text-center mt-8 text-slate-500 text-sm pb-8">
            &copy; {new Date().getFullYear()} NovLearn. Tous droits réservés.
          </div>
        </div>
      </div>
    </Layout>
  );
}
