"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBoard, failureMessage } from "@/lib/boards/client";
import { BOARD_NAME_MAX, boardPath, cleanName } from "@/lib/boards/rules";
import { cn } from "@/lib/utils";

// Name of a new board: Enter creates it, with its three starting lists, and opens it.
// Escape (or a click elsewhere on an empty name) closes the form.
export function NewBoardForm({
  onDone,
  submitLabel = "Créer",
  autoFocus = true,
  closeOnBlur = true,
  className,
}: {
  onDone?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
  // An empty field left closes the form (not in a window, which closes by itself).
  closeOnBlur?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = cleanName(name, BOARD_NAME_MAX);
    if (!value || pending) return;
    startTransition(async () => {
      try {
        const id = await createBoard(value);
        // The page stays in the document once left: an empty field when coming back.
        setName("");
        router.push(boardPath(id));
        onDone?.();
      } catch (error) {
        console.error(error);
        toast.error(failureMessage(error, "Le tableau n'a pas pu être créé. Réessayez."));
      }
    });
  }

  return (
    <form onSubmit={submit} className={cn("flex flex-col gap-2", className)}>
      <Input
        ref={input}
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={BOARD_NAME_MAX}
        placeholder="Nom du tableau"
        aria-label="Nom du tableau"
        disabled={pending}
        onKeyDown={(event) => {
          if (event.key === "Escape" && onDone) onDone();
        }}
        onBlur={() => {
          if (closeOnBlur && !name.trim() && onDone) onDone();
        }}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={pending || !name.trim()}>
          {submitLabel}
        </Button>
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onMouseDown={(event) => event.preventDefault()} onClick={onDone}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
