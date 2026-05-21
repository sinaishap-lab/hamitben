import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-text-inverse hover:bg-primary-600 active:bg-primary-700 disabled:bg-primary-200",
  secondary:
    "bg-accent text-text hover:bg-accent-500 active:bg-accent-600 disabled:bg-accent-100",
  outline:
    "border-2 border-primary text-primary hover:bg-primary-50 disabled:opacity-60 bg-transparent",
  ghost: "text-text hover:bg-primary-50 disabled:opacity-50 bg-transparent",
  danger:
    "bg-error text-text-inverse hover:opacity-90 active:opacity-80 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-base rounded-xl",
  lg: "h-12 px-5 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "w-full font-medium inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
