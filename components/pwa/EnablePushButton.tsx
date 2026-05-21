"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

/** Convert a base64url-encoded VAPID public key to the Uint8Array shape PushManager expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "loading" | "unsupported" | "denied" | "default" | "granted";

export function EnablePushButton() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    setState(Notification.permission as State);
  }, []);

  async function enable() {
    setError(null);
    setBusy(true);
    try {
      if (!vapid) {
        setError("התראות דחיפה לא מוגדרות בשרת.");
        return;
      }
      const permission = await Notification.requestPermission();
      setState(permission as State);
      if (permission !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      });

      const res = await fetch("/api/notifications/push-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: JSON.stringify(sub), platform: "web" }),
      });
      if (!res.ok) {
        setError("הרשמה נכשלה. נסה שוב.");
      }
    } catch (err) {
      console.error("[push.enable] failed", err);
      setError("שגיאה בהפעלת התראות");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (state === "unsupported" || !vapid) return null;

  if (state === "denied") {
    return (
      <Alert variant="warning">
        <div className="flex items-center gap-2">
          <BellOff className="w-4 h-4" aria-hidden />
          <span>התראות חסומות בדפדפן. ניתן להפעיל בהגדרות האתר.</span>
        </div>
      </Alert>
    );
  }

  if (state === "granted") {
    return (
      <div className="flex items-center gap-2 text-sm text-success">
        <Check className="w-4 h-4" aria-hidden />
        התראות דחיפה פעילות
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert variant="error">{error}</Alert>}
      <Button
        size="md"
        variant="outline"
        onClick={enable}
        loading={busy}
        className="w-auto"
      >
        <Bell className="w-4 h-4" />
        אפשר התראות דחיפה
      </Button>
    </div>
  );
}
