"use client";

import { CircleHelpIcon, CloudIcon } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSize } from "@/lib/drive/files";
import type { StorageUsage } from "@/lib/drive/types";
import { cn } from "@/lib/utils";

// "312 Mo sur 1 Go" with a thin bar: ink, then warning beyond 80 %, then destructive when full;
// the "?" details the three sources (docs/drive.md, "Indicateur de stockage").
export function StorageMeter({ usage }: { usage: StorageUsage }) {
  const used = usage.drive + usage.profile + usage.boards;
  const ratio = usage.capacity > 0 ? used / usage.capacity : 1;
  const percent = Math.min(100, Math.round(ratio * 100));
  const full = ratio >= 1;
  return (
    <div className="flex items-center gap-3">
      <CloudIcon aria-hidden className="size-4 text-muted-foreground" />
      <div
        role="progressbar"
        aria-label="Stockage utilisé"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1 w-[180px] border border-border bg-muted box-content"
      >
        <div
          className={cn("h-full", full ? "bg-destructive" : ratio > 0.8 ? "bg-warning" : "bg-foreground")}
          style={{ width: `${Math.max(percent, used > 0 ? 1 : 0)}%` }}
        />
      </div>
      <span className="text-[0.8125rem] tabular-nums">
        {full ? (
          <strong className="font-medium text-destructive">Stockage plein</strong>
        ) : (
          <>
            <strong className="font-medium">{formatSize(used)}</strong>{" "}
            <span className="text-muted-foreground">sur {formatSize(usage.capacity)}</span>
          </>
        )}
      </span>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="Détail du stockage"
              className="inline-flex size-5 items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          }
        >
          <CircleHelpIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent align="end" className="w-72 flex-col items-stretch gap-1 text-left">
          <span className="mb-1 block font-medium">Ce qui occupe l’espace</span>
          <Line label="Mes fichiers" bytes={usage.drive} />
          <Line label="Photo et images du profil" bytes={usage.profile} />
          <Line label="Images des tableaux" bytes={usage.boards} />
          <span className="mt-2 block opacity-75">
            La capacité est celle de l’offre gratuite de Supabase, partagée par toute l’application.
          </span>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function Line({ label, bytes }: { label: string; bytes: number }) {
  return (
    <span className="flex justify-between gap-4 tabular-nums">
      <span>{label}</span>
      <span>{formatSize(bytes)}</span>
    </span>
  );
}
