import { DownloadIcon } from "lucide-react";

import { FileIconFor } from "@/components/file-icon";
import { Pagination } from "@/components/pagination";
import { buttonVariants } from "@/components/ui/button";
import { formatDay, formatSize, typeLabel } from "@/lib/drive/files";
import { pageCount } from "@/lib/drive/rules";
import type { PublicResource, PublicResources } from "@/lib/drive/types";
import { publicProfilePath } from "@/lib/public-profile/handle";
import { cn } from "@/lib/utils";

// "Ressources" tab (docs/drive.md, maquette « C · Inspecteur »): the featured file in a large frame
// ("À la une"), then the other public files, the most recent first, in two columns on a computer.
// Downloads always save the file (never opened in the browser).

const downloadHref = (handle: string, id: string) => `${publicProfilePath(handle)}/resources/${id}`;

function Preview({ resource, className, iconClassName }: { resource: PublicResource; className?: string; iconClassName: string }) {
  return (
    <span className={cn("flex items-center justify-center overflow-hidden bg-muted text-muted-foreground", className)}>
      {resource.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
        <img src={resource.thumbnailUrl} alt="" className="size-full object-cover" />
      ) : (
        <FileIconFor category={resource.category} strokeWidth={1.25} className={iconClassName} />
      )}
    </span>
  );
}

export function ResourcesTab({ handle, resources, page }: { handle: string; resources: PublicResources; page: number }) {
  const { featured, items, total } = resources;
  const pageHref = (n: number) => `${publicProfilePath(handle)}/resources${n > 1 ? `?page=${n}` : ""}`;

  return (
    <div className="flex flex-col gap-10">
      {featured && page === 1 && (
        <section aria-label="Ressource mise en avant" className="flex flex-col border border-border sm:flex-row">
          <Preview
            resource={featured}
            className="min-h-[220px] border-b border-border sm:min-h-[260px] sm:flex-1 sm:border-r sm:border-b-0"
            iconClassName="size-[72px]"
          />
          <div className="flex flex-col justify-center gap-3 p-6 sm:flex-1 sm:p-8">
            <p className="eyebrow text-muted-foreground">À la une</p>
            <h2 className="font-heading text-[2rem] leading-10 font-medium [overflow-wrap:anywhere]">{featured.name}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {typeLabel(featured.name, featured.category)} · {formatSize(featured.size)} · {formatDay(featured.updatedAt)}
            </p>
            <div className="mt-3">
              <a
                href={downloadHref(handle, featured.id)}
                download
                className={buttonVariants({ variant: "contrast", size: "lg" })}
              >
                <DownloadIcon data-icon="inline-start" />
                Télécharger
              </a>
            </div>
          </div>
        </section>
      )}

      {total > 0 && (
        <section aria-labelledby="resources-title">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 id="resources-title" className="font-heading text-2xl font-semibold">
              {featured ? "Autres ressources" : "Ressources"}
            </h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {total} fichier{total > 1 ? "s" : ""}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-x-8 lg:grid-cols-2">
            {items.map((resource) => (
              <li key={resource.id} className="flex items-center gap-4 border-b border-border px-1 py-3.5">
                <Preview resource={resource} className="size-14 shrink-0 border border-border" iconClassName="size-[22px]" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[0.9375rem] font-medium">{resource.name}</span>
                  <span className="text-[0.8125rem] text-muted-foreground tabular-nums">
                    {typeLabel(resource.name, resource.category)} · {formatSize(resource.size)}
                    <span className="max-sm:hidden"> · {formatDay(resource.updatedAt)}</span>
                  </span>
                </span>
                <a
                  href={downloadHref(handle, resource.id)}
                  download
                  aria-label={`Télécharger ${resource.name}`}
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                >
                  <DownloadIcon />
                </a>
              </li>
            ))}
          </ul>
          {pageCount(total) > 1 && (
            <div className="mt-6">
              <Pagination page={page} total={total} hrefOf={pageHref} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
