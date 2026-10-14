"use client";

import { Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// "Partager" (docs/profile.md, "En-tête"): the share menu of the phone on mobile; on a computer,
// the address of the profile is copied.
export function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = window.location.href.split("#")[0];
    const touch = window.matchMedia("(pointer: coarse)").matches;
    if (touch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
      } catch {
        // Closed without sharing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Adresse copiée", { description: "L'adresse du profil est dans le presse-papiers." });
    } catch {
      toast.error("L'adresse n'a pas pu être copiée.");
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon-lg" aria-label="Partager le profil" onClick={share}>
      <Share2Icon />
    </Button>
  );
}
