import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { pageCount, pageNumbers, rangeLabel } from "@/lib/drive/rules";
import { cn } from "@/lib/utils";

// Pagination by 50 (docs/drive.md, "Pagination"): "1–50 sur 132", the arrows and the page numbers.
// In "Mes fichiers" and in the "Ressources" tab of the public profile.
export function Pagination({ page, total, hrefOf }: { page: number; total: number; hrefOf: (page: number) => string }) {
  const pages = pageCount(total);
  const arrow = (target: number, label: string, icon: React.ReactNode, enabled: boolean) =>
    enabled ? (
      <Link href={hrefOf(target)} aria-label={label} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        {icon}
      </Link>
    ) : (
      <span aria-hidden className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "opacity-40")}>
        {icon}
      </span>
    );

  return (
    <nav aria-label="Pagination" className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground tabular-nums">{rangeLabel(page, total)}</span>
      {pages > 1 && (
        <div className="flex items-center gap-0.5">
          {arrow(page - 1, "Page précédente", <ChevronLeftIcon />, page > 1)}
          {pageNumbers(page, pages).map((n, index) =>
            n === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-sm text-muted-foreground">
                …
              </span>
            ) : (
              <Link
                key={n}
                href={hrefOf(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-[0.8125rem] tracking-normal tabular-nums",
                  n === page && "border-foreground",
                )}
              >
                {n}
              </Link>
            ),
          )}
          {arrow(page + 1, "Page suivante", <ChevronRightIcon />, page < pages)}
        </div>
      )}
    </nav>
  );
}

