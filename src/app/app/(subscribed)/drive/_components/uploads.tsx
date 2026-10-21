"use client";

import { CheckIcon, ChevronDownIcon, ChevronUpIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

import { FileIconFor } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { failureMessage, UploadCancelled, uploadFile, type UploadHandle } from "@/lib/drive/client";
import { categoryOf, fileProblem, formatSize } from "@/lib/drive/files";

// Uploads of "Mes fichiers" (docs/drive.md, "Envoi"): a queue kept by the layout of the module, so
// that uploads go on while the user changes folder, and a panel at the bottom right, like Drive:
// one line per file with its progress, its refusal or its end.

type Status = "waiting" | "sending" | "done" | "failed" | "cancelled";

type Upload = {
  key: string;
  file: File;
  userId: string;
  parentId: string | null;
  status: Status;
  sent: number;
  // The name given in the folder ("Devis (2).pdf"), or the reason of a refusal.
  name: string;
  message: string | null;
};

type Uploads = {
  uploads: Upload[];
  // Bytes announced by the uploads not finished yet: they will take room.
  pendingBytes: number;
  // Sends files into a folder. freeBytes: room left before this batch.
  start: (userId: string, parentId: string | null, files: File[], freeBytes: number) => void;
};

const UploadsContext = createContext<Uploads | null>(null);

export function useUploads() {
  const value = useContext(UploadsContext);
  if (!value) throw new Error("useUploads outside of UploadsProvider");
  return value;
}

// A few files at a time.
const PARALLEL = 3;

// The queue of the uploads: it starts the next ones as the others end, and tells each change.
function createQueue(change: (key: string, changes: Partial<Upload>) => void, onSent: () => void) {
  const handles = new Map<string, UploadHandle>();
  let waiting: Upload[] = [];
  let running = 0;

  const next = () => {
    while (running < PARALLEL && waiting.length > 0) {
      const upload = waiting.shift()!;
      running++;
      change(upload.key, { status: "sending" });
      const handle = uploadFile(upload.userId, upload.parentId, upload.file, (sent) => change(upload.key, { sent }));
      handles.set(upload.key, handle);
      handle.done
        .then((name) => {
          change(upload.key, { status: "done", sent: upload.file.size, name });
          onSent();
        })
        .catch((error: unknown) => {
          if (error instanceof UploadCancelled) {
            change(upload.key, { status: "cancelled", message: "Envoi annulé" });
            return;
          }
          console.error(error);
          change(upload.key, { status: "failed", message: failureMessage(error, "L’envoi a échoué. Réessayez.") });
        })
        .finally(() => {
          handles.delete(upload.key);
          running--;
          next();
        });
    }
  };

  return {
    add: (uploads: Upload[]) => {
      waiting.push(...uploads);
      next();
    },
    cancel: (key: string) => {
      const handle = handles.get(key);
      if (handle) handle.cancel();
      else if (waiting.some((upload) => upload.key === key)) {
        waiting = waiting.filter((upload) => upload.key !== key);
        change(key, { status: "cancelled", message: "Envoi annulé" });
      }
    },
  };
}

export function UploadsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [queue] = useState(() =>
    createQueue(
      (key, changes) =>
        setUploads((current) => current.map((upload) => (upload.key === key ? { ...upload, ...changes } : upload))),
      () => router.refresh(),
    ),
  );

  const pendingBytes = uploads
    .filter((upload) => upload.status === "waiting" || upload.status === "sending")
    .reduce((total, upload) => total + upload.file.size, 0);

  const start = (userId: string, parentId: string | null, files: File[], freeBytes: number) => {
    // Files too large, programs, or beyond the capacity are refused before sending.
    let room = freeBytes;
    const added = files.map((file): Upload => {
      const problem = fileProblem(file, room);
      if (!problem) room -= file.size;
      return {
        key: crypto.randomUUID(),
        file,
        userId,
        parentId,
        status: problem ? "failed" : "waiting",
        sent: 0,
        name: file.name,
        message: problem,
      };
    });
    setUploads((current) => [...current, ...added]);
    queue.add(added.filter((upload) => upload.status === "waiting"));
  };

  const cancel = (key: string) => queue.cancel(key);

  // Closing the panel cancels what is still going on.
  const close = () => {
    for (const upload of uploads) if (upload.status === "waiting" || upload.status === "sending") cancel(upload.key);
    setUploads([]);
  };

  return (
    <UploadsContext.Provider value={{ uploads, pendingBytes, start }}>
      {children}
      {uploads.length > 0 && <UploadPanel uploads={uploads} onCancel={cancel} onClose={close} />}
    </UploadsContext.Provider>
  );
}

function UploadPanel({
  uploads,
  onCancel,
  onClose,
}: {
  uploads: Upload[];
  onCancel: (key: string) => void;
  onClose: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const active = uploads.filter((upload) => upload.status === "waiting" || upload.status === "sending").length;
  const done = uploads.filter((upload) => upload.status === "done").length;
  const title =
    active > 0
      ? `Envoi de ${active} fichier${active > 1 ? "s" : ""}`
      : `${done} envoi${done > 1 ? "s" : ""} terminé${done > 1 ? "s" : ""}`;

  return (
    <section
      aria-label="Envois"
      className="fixed right-6 bottom-[72px] z-40 w-[380px] max-w-[calc(100vw-3rem)] border border-foreground bg-popover text-popover-foreground"
    >
      <div className="flex items-center gap-1 border-b border-border py-1.5 pr-1.5 pl-4">
        <h2 className="flex-1 text-sm font-medium" aria-live="polite">
          {title}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? "Développer" : "Réduire"}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Fermer le panneau des envois" onClick={onClose}>
          <XIcon />
        </Button>
      </div>
      {!collapsed && (
        <ul className="max-h-72 overflow-y-auto">
          {uploads.map((upload) => (
            <UploadLine key={upload.key} upload={upload} onCancel={() => onCancel(upload.key)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function UploadLine({ upload, onCancel }: { upload: Upload; onCancel: () => void }) {
  const { file, status } = upload;
  const percent = file.size === 0 ? 100 : Math.min(100, Math.round((upload.sent / file.size) * 100));
  return (
    <li className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <FileIconFor category={categoryOf(file.name, file.type)} className="size-[18px] shrink-0 text-muted-foreground" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-sm">{upload.name}</span>
        {status === "sending" && (
          <>
            <span
              role="progressbar"
              aria-label={`Envoi de ${upload.name}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="block h-[3px] bg-muted"
            >
              <span className="block h-full bg-foreground transition-[width]" style={{ width: `${percent}%` }} />
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {percent} % · {formatSize(upload.sent)} sur {formatSize(file.size)}
            </span>
          </>
        )}
        {status === "waiting" && <span className="text-xs text-muted-foreground">En attente</span>}
        {status === "done" && (
          <span className="text-xs text-muted-foreground tabular-nums">{formatSize(file.size)} · Envoyé</span>
        )}
        {(status === "failed" || status === "cancelled") && (
          <span className={status === "failed" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
            {upload.message}
          </span>
        )}
      </div>
      {(status === "waiting" || status === "sending") && (
        <Button variant="ghost" size="icon-sm" aria-label={`Annuler l’envoi de ${upload.name}`} onClick={onCancel}>
          <XIcon />
        </Button>
      )}
      {status === "done" && <CheckIcon aria-label="Envoyé" className="size-4 shrink-0 text-success" />}
      {status === "failed" && <TriangleAlertIcon aria-label="Refusé" className="size-4 shrink-0 text-destructive" />}
    </li>
  );
}
