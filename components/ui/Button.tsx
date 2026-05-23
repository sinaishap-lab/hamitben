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
    "bg-gradient-primary text-text-inverse shadow-soft hover:shadow-glow hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:shadow-none disabled:bg-none disabled:bg-primary-200",
  secondary:
    "bg-gradient-accent text-text-inverse shadow-soft hover:shadow-accent-glow hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:shadow-none disabled:bg-none disabled:bg-accent-100",
  outline:
    "border-2 border-primary text-primary bg-bg-surface hover:bg-primary-50 active:bg-primary-100 disabled:opacity-60",
  ghost:
    "text-primary hover:bg-primary-50 active:bg-primary-100 disabled:opacity-50 bg-transparent",
  danger:
    "bg-error text-text-inverse shadow-soft hover:brightness-110 active:brightness-90 disabled:opacity-50 disabled:shadow-none",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
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
        "w-full font-medium inline-flex items-center justify-center gap-2 transition-[transform,box-shadow,filter,background-color] active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100",
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
