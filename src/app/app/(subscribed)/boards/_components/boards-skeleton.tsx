import { Skeleton } from "@/components/ui/skeleton";

// While a board loads: the header and three lists.
export function BoardsSkeleton() {
  return (
    <div className="flex h-svh min-w-0 flex-col">
      <div className="border-b border-border px-8 py-5">
        <Skeleton className="h-8 w-56" />
      </div>
      <div className="flex gap-3 px-8 py-6">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-48 w-[272px]" />
        ))}
      </div>
    </div>
  );
}
