import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import "./globals.css";

// Configuration de la police Fredoka
// Cela permet de l'héberger automatiquement et d'améliorer les perfs
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Novlearn",
  description:
    "Plateforme d'entraînement ludique et personnalisée pour le Bac de mathématiques",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={fredoka.variable}>
      <head>
        {/* KaTeX pour le rendu mathématique (formules dans les questions) */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
        <script
          defer
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"
          integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8"
          crossOrigin="anonymous"
        />
      </head>

      {/* On applique le fond sombre par défaut pour éviter le flash blanc */}
      <body className="bg-slate-900 text-slate-50 antialiased font-sans selection:bg-indigo-500/30">
        <AuthProvider>
          {/* Contenu de l'application */}
          {children}

          <Toaster position="top-right" theme="dark" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
