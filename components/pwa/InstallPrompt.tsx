"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "hamitben:install-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // a week

/** Bottom-of-screen "Install" banner that appears when the browser is ready. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setVisible(false));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const result = await deferred.userChoice;
    if (result.outcome === "accepted") {
      setVisible(false);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="התקנת אפליקציה"
      className="fixed bottom-20 inset-x-0 z-50 mx-auto max-w-screen-sm px-4"
    >
      <div className="bg-bg-surface border border-primary-200 rounded-2xl shadow-lg p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-primary" aria-hidden />
        </div>
        <div className="flex-1 min-w-0 text-sm">
          <div className="font-bold">התקן את המתבן</div>
          <div className="text-xs text-text-muted">
            כדי לפתוח מהמסך הראשי בלי דפדפן
          </div>
        </div>
        <Button size="sm" onClick={install} className="w-auto">
          התקן
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="סגור"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-primary-50"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
