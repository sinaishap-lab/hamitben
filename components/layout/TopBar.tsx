import Link from "next/link";
import { Wheat } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-bg-surface/95 backdrop-blur border-b border-primary-100">
      <div className="h-14 px-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary font-bold text-lg"
        >
          <Wheat className="w-6 h-6 text-accent" aria-hidden />
          <span>המתבן</span>
        </Link>
        {/* TODO: user menu / login button once auth is wired */}
      </div>
    </header>
  );
}
