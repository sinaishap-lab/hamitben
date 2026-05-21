import Link from "next/link";
import { Sprout } from "lucide-react";

export default function NotFound() {
  return (
    <div className="px-4 py-10 flex flex-col items-center gap-4 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Sprout className="w-10 h-10 text-primary" aria-hidden />
      </div>
      <h1 className="text-3xl font-bold text-primary">404</h1>
      <p className="text-text-muted max-w-xs">
        העמוד שחיפשת לא נמצא. אולי הקישור נשבר או שהכלי הוסר.
      </p>
      <div className="flex gap-2 mt-2">
        <Link
          href="/catalog"
          className="h-11 px-4 rounded-xl bg-primary text-text-inverse font-medium inline-flex items-center"
        >
          לקטלוג
        </Link>
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
