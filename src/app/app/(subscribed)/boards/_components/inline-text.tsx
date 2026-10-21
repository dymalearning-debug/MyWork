"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

// A name or a title changed in place (docs/boards.md): Enter saves, Escape cancels, a click
// elsewhere saves. An empty value is not saved. Multiline: the text wraps, Enter still saves.
export function InlineText({
  value,
  label,
  maxLength,
  onSave,
  onDone,
  multiline = false,
  className,
}: {
  value: string;
  label: string;
  maxLength: number;
  onSave: (value: string) => void;
  onDone: () => void;
  multiline?: boolean;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const done = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  function finish(save: boolean) {
    if (done.current) return;
    done.current = true;
    const next = draft.trim();
    if (save && next && next !== value) onSave(next.slice(0, maxLength));
    onDone();
  }

  const fieldClass = cn(
    "w-full min-w-0 border border-ring bg-background px-2 outline-none ring-3 ring-ring/30",
    multiline && "field-sizing-content resize-none",
    className,
  );
  const props = {
    ref,
    value: draft,
    maxLength,
    "aria-label": label,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(multiline ? event.target.value.replace(/\n/g, " ") : event.target.value),
    onBlur: () => finish(true),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter") {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        // The Escape key closes the edit, not the window around it.
        event.preventDefault();
        event.stopPropagation();
        finish(false);
      }
    },
    className: fieldClass,
  };
  return multiline ? <textarea rows={1} {...props} /> : <input type="text" {...props} />;
}
