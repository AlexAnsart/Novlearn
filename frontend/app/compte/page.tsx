"use client";

import { AccountPage } from "../components/AccountPage";
import { Layout } from "../components/Layout";

// Force dynamic rendering to prevent Next.js cache issues
export const dynamic = "force-dynamic";

export default function AccountPageRoute() {
  return (
    <Layout>
      <AccountPage />
    </Layout>
  );
}
