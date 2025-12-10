'use client';

import { Layout } from '../components/Layout';
import { AccountPage } from '../components/AccountPage';

// Force dynamic rendering to prevent Next.js cache issues
export const dynamic = 'force-dynamic';

export default function AccountPageRoute() {
  return (
    <Layout>
      <AccountPage />
    </Layout>
  );
}

