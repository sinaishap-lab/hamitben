"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ServiceWorkerRegistrar />
    </SessionProvider>
  );
}
