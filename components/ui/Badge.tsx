import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "primary" | "accent" | "success" | "warning" | "error";

const STYLES: Record<Variant, string> = {
  neutral: "bg-primary-50 text-primary-700",
  primary: "bg-primary text-text-inverse",
  accent: "bg-accent text-text-inverse",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/60",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200/60",
  error: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200/60",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
