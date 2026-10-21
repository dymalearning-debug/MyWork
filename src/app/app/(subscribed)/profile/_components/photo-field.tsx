"use client";

import { LoaderCircleIcon, UploadIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { ProfilePhoto } from "@/components/profile-photo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IMAGE_TYPES, imageFileProblem } from "@/lib/profile/images";
import { cropToSquare, uploadProfileImage } from "@/lib/profile/upload";

// Photo of the header (docs/profile.md, "En-tête"): JPG, PNG or WebP, 5 MB at most, cropped to a
// square when it is sent (zoom and move). Without a photo, the initials.
export function PhotoField({
  userId,
  photoUrl,
  initials,
  onChange,
}: {
  userId: string;
  photoUrl: string | null;
  initials: string;
  onChange: (url: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => () => void (source && URL.revokeObjectURL(source)), [source]);

  function choose(file: File | undefined) {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setSource(URL.createObjectURL(file));
  }

  async function confirm() {
    if (!source || !area) return;
    setSending(true);
    try {
      const blob = await cropToSquare(source, area);
      onChange(await uploadProfileImage(userId, blob));
      setSource(null);
    } catch (error) {
      console.error(error);
      toast.error("La photo n'a pas pu être envoyée. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <ProfilePhoto url={photoUrl} initials={initials} className="size-22 text-3xl" />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Photo</span>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()}>
            <UploadIcon data-icon="inline-start" />
            {photoUrl ? "Changer la photo" : "Envoyer une photo"}
          </Button>
          {photoUrl && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              Retirer
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">JPG, PNG ou WebP, 5 Mo au plus. Recadrée en carré.</span>
        <input
          ref={input}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          aria-label="Fichier de la photo"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            choose(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <Dialog open={!!source} onOpenChange={(open) => !open && !sending && setSource(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recadrer la photo</DialogTitle>
            <DialogDescription>Déplacez l&apos;image et réglez le zoom : la photo est carrée.</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full bg-muted">
            {source && (
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setArea(pixels)}
              />
            )}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="flex-1 accent-foreground"
            />
          </label>
          <DialogFooter>
            <Button variant="outline" disabled={sending} onClick={() => setSource(null)}>
              Annuler
            </Button>
            <Button disabled={sending || !area} onClick={confirm}>
              {sending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
