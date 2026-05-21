import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <header>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-20 mt-2" />
      </header>

      <Skeleton className="h-11 w-full" />
      <div className="flex gap-2 overflow-x-hidden">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
