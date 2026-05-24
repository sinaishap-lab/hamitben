"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

/**
 * Standard `beforeinstallprompt` event shape. Not in lib.dom.d.ts yet, so
 * we describe the bits we use.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * In-app PWA install button. Renders nothing until the browser fires
 * `beforeinstallprompt` (meaning the app is installable and not yet
 * installed). Click → opens the native install dialog. Hides itself
 * after a successful install.
 *
 * iOS Safari doesn't fire this event — those users still need to use
 * Share → "Add to Home Screen" manually.
 */
export function InstallAppButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      // Stop the browser's own mini-prompt — we'll trigger it from our button.
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setPrompt(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!prompt) return null;

  async function handleClick() {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setPrompt(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label="התקן את המתבן"
      className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-gradient-accent text-text-inverse text-xs font-medium shadow-soft hover:shadow-accent-glow hover:brightness-110 active:brightness-95 transition-all disabled:opacity-60"
    >
      <Download className="w-3.5 h-3.5" aria-hidden />
      התקנה
    </button>
  );
}
