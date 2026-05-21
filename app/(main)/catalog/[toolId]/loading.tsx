import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="px-4 py-4 flex flex-col gap-5">
      <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
      <div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-5 w-24 mt-2" />
      </div>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}
