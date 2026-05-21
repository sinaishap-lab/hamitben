import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const STYLES: Record<Variant, { wrap: string; icon: typeof Info }> = {
  info: { wrap: "bg-primary-50 text-primary-700 border-primary-100", icon: Info },
  success: { wrap: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  warning: { wrap: "bg-amber-50 text-amber-800 border-amber-200", icon: AlertTriangle },
  error: { wrap: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const { wrap, icon: Icon } = STYLES[variant];
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm", wrap, className)}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
}
