import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full h-11 px-3 rounded-xl border bg-bg-surface text-text",
        "placeholder:text-text-muted",
        "transition-[border-color,box-shadow]",
        "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-primary",
        "disabled:opacity-60",
        invalid
          ? "border-error focus:ring-error/30 focus:border-error"
          : "border-primary-100 hover:border-primary-200",
        className
      )}
      {...rest}
    />
  );
});
