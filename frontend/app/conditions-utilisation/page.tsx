'use client';

import { Layout } from '../components/Layout';

export default function TermsOfServicePage() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 pb-8">
        <div className="max-w-4xl w-full space-y-6">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]">
            <h1
              className="text-4xl md:text-5xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(59,130,246,0.5)] mb-6"
              style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 700 }}
            >
              Conditions d'Utilisation - NovLearn
            </h1>

            <div className="space-y-6 text-blue-200" style={{ fontFamily: "'Fredoka', sans-serif" }}>
              <section>
                <h2 className="text-2xl text-white mb-3" style={{ fontWeight: 600 }}>
                  À venir
                </h2>
                <p>
                  Les conditions d'utilisation seront bientôt disponibles.
                </p>
                <p className="mt-4">
                  Cette page sera mise à jour avec les conditions complètes d'utilisation de la plateforme NovLearn.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

