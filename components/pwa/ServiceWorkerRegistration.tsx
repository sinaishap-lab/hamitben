"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js on mount. Without an active service worker the browser
 * doesn't classify us as a PWA, so `beforeinstallprompt` never fires and
 * the install button stays hidden. Skipped in dev to avoid stale-cache
 * surprises while iterating on code.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // Surface but don't break the app — the SW is a progressive
        // enhancement, not a hard requirement for rendering.
        console.warn("[pwa] service worker registration failed", err);
      });
  }, []);
  return null;
}
