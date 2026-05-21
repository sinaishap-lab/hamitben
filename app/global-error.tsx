"use client";

import { useEffect } from "react";

// Global error boundary — runs only when the root layout itself crashes.
// Must define its own <html>/<body> because the regular layout isn't mounted.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ui.global-error]", error);
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          background: "#F7F3ED",
          color: "#2C2416",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>שגיאה קריטית</h1>
        <p style={{ color: "#6B6354", marginBottom: "1rem", maxWidth: 320 }}>
          האפליקציה נכשלה בטעינה. רענן את הדף או חזור בהמשך.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "#4A7C59",
            color: "#fff",
            border: 0,
            padding: "0.75rem 1.25rem",
            borderRadius: 12,
            fontWeight: 600,
          }}
        >
          רענן
        </button>
      </body>
    </html>
  );
}
