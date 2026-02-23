import { Layout } from "../../components/Layout";

const faq = [
  {
    question: "Comment ajouter l'application en PWA ?",
    answer:
      "Sur mobile, cliquez sur 'Ajouter à l'écran d'accueil' dans le menu de votre navigateur. Sur ordinateur, utilisez le menu de votre navigateur pour installer l'application comme PWA.",
  },
  {
    question: "Comment supprimer son compte ?",
    answer:
      "Rendez-vous dans les paramètres de votre compte, puis cliquez sur 'Supprimer mon compte'. Suivez les instructions pour confirmer la suppression.",
  },
  // Ajoutez d'autres questions ici
];

export default function ForumFAQ() {
  return (
    <Layout>
      <div className="flex-1 px-4 md:px-8 pb-12 overflow-y-auto bg-slate-900">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] border border-slate-700/50">
            <h1
              className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              Forum - Questions fréquentes
            </h1>
            {faq.map((item, idx) => (
              <div key={idx} className="mb-6">
                <h2 className="text-lg font-semibold mb-2 text-white">
                  {item.question}
                </h2>
                <p className="text-blue-100">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
