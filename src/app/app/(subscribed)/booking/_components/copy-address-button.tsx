"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// "Copier l'adresse de réservation": the full address of the "Rendez-vous" tab of the public
// profile, on the site where we are (local, preview or production).
export function CopyAddressButton({
  path,
  label = "Copier l'adresse de réservation",
  variant = "outline",
}: {
  path: string;
  label?: string;
  variant?: "outline" | "contrast";
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    } catch {
      toast.error("L'adresse n'a pas pu être copiée.");
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant={variant} size="sm" onClick={copy}>
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copied ? "Adresse copiée" : label}
    </Button>
  );
}
