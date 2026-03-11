"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { TaxonomyProvider } from "./components/TaxonomyProvider";
import { AuthProvider } from "./contexts/AuthContext";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        storageKey="novlearn-theme"
        enableSystem
      >
        <TaxonomyProvider>{children}</TaxonomyProvider>
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </ThemeProvider>
    </AuthProvider>
  );
}

