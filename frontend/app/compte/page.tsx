'use client';

import { Layout } from '../components/Layout';
import { AccountPage } from '../components/AccountPage';

// Force dynamic rendering to prevent Next.js cache issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default function AccountPageRoute() {
  return (
    <Layout>
      <AccountPage />
    </Layout>
  );
}

