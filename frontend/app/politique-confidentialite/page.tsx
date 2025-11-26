'use client';

import { Layout } from '../components/Layout';

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h1
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)] mb-6"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Politique de Confidentialité - NovLearn
            </h1>

            <div className="space-y-6 text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              <p className="text-blue-300 italic mb-6">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              
              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  1. Responsable du traitement
                </h2>
                <p>
                  <strong>Responsable du traitement</strong> : École Centrale de Lyon (projet étudiant PE69)
                </p>
                <p>
                  <strong>Contact</strong> : À compléter avec votre email
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  2. Données collectées
                </h2>
                <p>Nous collectons les données suivantes :</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Email, prénom, date de naissance</li>
                  <li>Progression scolaire (exercices, scores)</li>
                  <li>Historique de connexion</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  3. Finalité
                </h2>
                <p>
                  Apprentissage personnalisé pour la préparation au Baccalauréat spécialité Mathématiques.
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  4. Base légale
                </h2>
                <p>
                  Consentement de l'utilisateur (article 6.1.a du RGPD).
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  5. Durée de conservation
                </h2>
                <p>
                  Jusqu'à suppression du compte ou fin du projet académique (avril 2026).
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  6. Hébergement
                </h2>
                <p>
                  Données hébergées en Europe (Supabase - Frankfurt/London).
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  7. Vos droits (RGPD)
                </h2>
                <p>Vous disposez des droits suivants :</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li><strong>Accès</strong> : exporter vos données</li>
                  <li><strong>Rectification</strong> : modifier vos informations</li>
                  <li><strong>Suppression</strong> : supprimer votre compte définitivement</li>
                  <li><strong>Portabilité</strong> : récupérer vos données en format JSON</li>
                </ul>
                <p className="mt-3">
                  Pour exercer ces droits : À compléter avec votre email
                </p>
              </section>

              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  8. Âge minimum
                </h2>
                <p>
                  NovLearn est réservé aux élèves de 15 ans et plus. Si vous avez moins de 15 ans, vous ne pouvez pas créer de compte.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

