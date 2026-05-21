"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ServiceWorkerRegistrar />
      <InstallPrompt />
    </SessionProvider>
  );
}
