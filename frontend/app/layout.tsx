import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Fredoka } from "next/font/google";
import { CompleteProfileModal } from "./components/CompleteProfileModal";
import { ThemeToaster } from "./components/ThemeToaster";
import { TaxonomyProvider } from "./components/TaxonomyProvider";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
};

export const metadata: Metadata = {
  title: "Novlearn",
  description:
    "Plateforme d'entraînement ludique et personnalisée pour le Bac de mathématiques",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Novlearn",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={fredoka.variable} suppressHydrationWarning>
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

      <body className="bg-app-bg text-content-main antialiased font-sans selection:bg-indigo-500/30">
        <AuthProvider>
          {/* attribute="class" → applique .light/.dark sur <html>
              defaultTheme="dark" → thème par défaut
              storageKey → clé localStorage identique à l'ancienne */}
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            storageKey="novlearn-theme"
            enableSystem
          >
            <TaxonomyProvider>{children}</TaxonomyProvider>
            <CompleteProfileModal />
            <ThemeToaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
