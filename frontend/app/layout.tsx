import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Novlearn',
  description: 'Plateforme d\'entraînement ludique et personnalisée pour le Bac de mathématiques',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

