"use client";

import { ArrowRightIcon, CheckIcon, CopyIcon, LoaderCircleIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import type { ProfileContact } from "@/lib/public-profile/data";
import { cn } from "@/lib/utils";

import { fetchProfileContact } from "../actions";

// "Me contacter", the red button of the header: a panel with the email and the phone, read only at
// the first click (docs/profile.md, "Coordonnées"). Each with "Copier", and "Écrire" or "Appeler".
export function ContactButton({ handle }: { handle: string }) {
  const [contact, setContact] = useState<ProfileContact | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "failed">("idle");

  async function load() {
    if (state === "loading" || state === "ready") return;
    setState("loading");
    const result = await fetchProfileContact(handle);
    setContact(result);
    setState(result ? "ready" : "failed");
  }

  return (
    <Popover onOpenChange={(open) => open && void load()}>
      <PopoverTrigger render={<Button size="lg" />}>
        Me contacter
        <ArrowRightIcon data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[min(340px,calc(100vw-2rem))] gap-3.5 p-5">
        <PopoverTitle className="eyebrow text-muted-foreground">Me contacter</PopoverTitle>
        {state === "loading" && <LoaderCircleIcon aria-label="Chargement" className="size-4 animate-spin text-muted-foreground" />}
        {state === "failed" && <p className="text-sm text-muted-foreground">Les coordonnées n&apos;ont pas pu être chargées. Réessayez.</p>}
        {state === "ready" && contact && <ContactDetails contact={contact} />}
      </PopoverContent>
    </Popover>
  );
}

// The content of the panel, once read: also shown on its own in the showcase (/design).
export function ContactDetails({ contact }: { contact: ProfileContact }) {
  return (
    <div className="flex flex-col divide-y divide-border">
      {contact.email && <ContactRow value={contact.email} href={`mailto:${contact.email}`} action="Écrire" kind="E-mail" />}
      {contact.phone && (
        <ContactRow value={contact.phone} href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} action="Appeler" kind="Téléphone" />
      )}
    </div>
  );
}

function ContactRow({ value, href, action, kind }: { value: string; href: string; action: string; kind: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("La copie n'a pas fonctionné.");
    }
  }

  return (
    <div className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
      <span className="min-w-0 flex-1 truncate text-sm tabular-nums" title={value}>
        {value}
      </span>
      <Button type="button" variant="ghost" size="sm" aria-label={`Copier : ${kind}`} onClick={copy}>
        {copied ? <CheckIcon data-icon="inline-start" className="text-success" /> : <CopyIcon data-icon="inline-start" />}
        {copied ? "Copié" : "Copier"}
      </Button>
      <a href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
        {action}
      </a>
    </div>
  );
}
