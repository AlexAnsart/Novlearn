import { Layout } from "../../components/Layout";

export default function BesoinAide() {
  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-12 overflow-y-auto bg-slate-900">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-700/50">
            <h1
              className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Besoin d'aide ?
            </h1>
            <p className="mb-4 text-blue-100">
              Si vous avez besoin d'aide, contactez-nous par email :
            </p>
            <a
              href="mailto:support@novlearn.fr"
              className="text-blue-400 underline mb-6 block"
            >
              support@novlearn.fr
            </a>
            <p className="text-blue-100">
              Nous vous répondrons dans les plus brefs délais.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
