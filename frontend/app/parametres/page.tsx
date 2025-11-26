'use client';

import { Layout } from '../components/Layout';

export default function SettingsPage() {
  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center">
        <p
          className="text-white"
          style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: "1.5rem" }}
        >
          ⚙️ Paramètres - À venir
        </p>
      </div>
    </Layout>
  );
}

