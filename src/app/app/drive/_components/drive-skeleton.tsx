import { Skeleton } from "@/components/ui/skeleton";

// While a folder loads: the header, the toolbar and a few rows.
export function DriveSkeleton() {
  return (
    <div className="flex min-h-svh flex-col gap-5 px-10 pt-7">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full max-w-xl" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    </div>
  );
}
