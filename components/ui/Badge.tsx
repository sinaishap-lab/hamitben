import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "neutral" | "primary" | "accent" | "success" | "warning" | "error";

const STYLES: Record<Variant, string> = {
  neutral: "bg-primary-50 text-text-muted",
  primary: "bg-primary text-text-inverse",
  accent: "bg-accent text-text",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  error: "bg-red-100 text-red-800",
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
