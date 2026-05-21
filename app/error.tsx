"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to server logs; replace with a real logger before production.
    console.error("[ui.error]", error);
  }, [error]);

  return (
    <div className="px-4 py-10 flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-error" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold">משהו השתבש</h1>
      <p className="text-text-muted max-w-xs">
        אירעה תקלה. אנא נסה שוב, ואם הבעיה חוזרת — צור איתנו קשר.
      </p>
      {error.digest && (
        <p className="text-[10px] text-text-muted font-mono" dir="ltr">
          ref: {error.digest}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={reset}
          className="h-11 px-4 rounded-xl bg-primary text-text-inverse font-medium"
        >
          נסה שוב
        </button>
        <Link
          href="/"
          className="h-11 px-4 rounded-xl border-2 border-primary text-primary font-medium inline-flex items-center"
        >
          לדף הבית
        </Link>
      </div>
    </div>
  );
}
