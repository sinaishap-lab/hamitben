import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse bg-primary-100/60 rounded-md",
        className
      )}
      aria-hidden
    />
  );
}
