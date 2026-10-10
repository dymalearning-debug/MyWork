"use client";

import { ArrowRightIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Form pieces shared by the authentication pages.

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

// Message above or in place of a form: information (red rule) or error (alert rule).
export function FormMessage({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "error";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-1.5 bg-muted px-5 py-4 text-sm",
        tone === "error" ? "shadow-[inset_2px_0_0_var(--destructive)]" : "shadow-[inset_2px_0_0_var(--primary)]",
      )}
    >
      {title && <p className="font-medium">{title}</p>}
      <div className={cn(title && "text-muted-foreground")}>{children}</div>
    </div>
  );
}

// The show / hide button replaces a second "confirm password" field (docs/auth.md).
export function PasswordInput({
  id,
  invalid,
  describedBy,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & { id: string; invalid?: boolean; describedBy?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="pr-10"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        aria-controls={id}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
}

// The red button of the screen (only one per screen), with the arrow that moves forward.
export function SubmitButton({ children, pending }: { children: React.ReactNode; pending?: boolean }) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <Button type="submit" size="lg" className="w-full" disabled={busy}>
      {children}
      <ArrowRightIcon data-icon="inline-end" />
    </Button>
  );
}
