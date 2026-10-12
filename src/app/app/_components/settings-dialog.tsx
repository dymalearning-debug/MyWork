"use client";

import { CheckIcon, CircleAlertIcon, CircleHelpIcon, LoaderCircleIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  changeSummary,
  hasChanges,
  NAME_MAX_LENGTH,
  normalizeProfileSettings,
  type ProfileSettings,
} from "@/lib/account/settings";
import { isValidHandle } from "@/lib/public-profile/handle";
import { cn } from "@/lib/utils";

import { checkHandle, deleteAccount, saveProfileSettings } from "../actions";

// Sections of the Settings, in the menu at the left of the dialog. Subscription and module
// settings will be added here.
const SECTIONS = [{ id: "profile", label: "Profil", icon: UserIcon }] as const;

const FORM_ID = "settings-profile";

// Live check of the address of the public profile, a short while after the user stops typing.
const CHECK_DELAY = 400;

type HandleStatus = "idle" | "checking" | "available" | "unavailable" | "invalid";

const HANDLE_MESSAGES: Record<HandleStatus, string> = {
  idle: "",
  checking: "Vérification…",
  available: "Disponible",
  unavailable: "Cette adresse n'est pas disponible.",
  invalid:
    "3 à 30 caractères : lettres minuscules sans accents, chiffres et tirets, sans tiret au début ni à la fin.",
};

// The site we are on (local, preview or production), shown before the handle.
const subscribeToNothing = () => () => {};
function useSiteHost() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => window.location.host,
    () => "",
  );
}

// Settings dialog (docs/settings.md), opened from the profile menu: a large dialog with the
// sections at the left and one "Enregistrer" for everything it holds. Mounted again at each
// opening, so that it always starts from the saved values.
export function SettingsDialog({
  open,
  onOpenChange,
  email,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  profile: ProfileSettings;
}) {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("profile");
  const [values, setValues] = useState(profile);
  const [handleStatus, setHandleStatus] = useState<HandleStatus>("idle");
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const checkRequest = useRef(0);
  const host = useSiteHost();

  useEffect(() => () => clearTimeout(checkTimer.current), []);

  const next = normalizeProfileSettings(values);
  const dirty = hasChanges(profile, next);
  const canSave = dirty && !saving && (handleStatus === "idle" || handleStatus === "available");

  function onHandleChange(input: string) {
    const handle = input.toLowerCase();
    setValues((current) => ({ ...current, handle }));
    clearTimeout(checkTimer.current);
    const request = ++checkRequest.current;
    const candidate = handle.trim();
    if (candidate === profile.handle) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    checkTimer.current = setTimeout(async () => {
      const result = isValidHandle(candidate) ? await checkHandle(candidate) : "invalid";
      // Only the answer for what the field holds now; a failed check leaves the save to decide.
      if (request === checkRequest.current) setHandleStatus(result ?? "idle");
    }, CHECK_DELAY);
  }

  // Closing with the cross, Escape or a click outside: a question first when changes are not saved.
  function requestClose() {
    if (dirty) setConfirmClose(true);
    else onOpenChange(false);
  }

  function save() {
    if (!canSave) return;
    startSaving(async () => {
      const result = await saveProfileSettings(next);
      setConfirmClose(false);
      if (result.ok) {
        toast.success("Paramètres enregistrés", { description: changeSummary(profile, next) });
        onOpenChange(false);
      } else if (result.error === "failed") {
        toast.error("Les paramètres n'ont pas pu être enregistrés. Réessayez.");
      } else {
        setHandleStatus(result.error);
      }
    });
  }

  function removeAccount() {
    startDeleting(async () => {
      // On success, the action signs out and leads to the login page.
      const result = await deleteAccount();
      if (result && !result.ok) toast.error("Le compte n'a pas pu être supprimé. Réessayez.");
    });
  }

  const handleError = handleStatus === "unavailable" || handleStatus === "invalid";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : requestClose())}>
      <DialogContent className="flex h-[min(680px,calc(100svh-4rem))] max-w-[calc(100%-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[960px]">
        <div className="flex min-h-0 flex-1">
          <nav
            aria-label="Sections des paramètres"
            className="flex w-58 shrink-0 flex-col gap-0.5 border-r border-border bg-sidebar px-3 py-6"
          >
            <DialogTitle className="px-3 pb-4">Paramètres</DialogTitle>
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-current={section === id ? "page" : undefined}
                onClick={() => setSection(id)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  section === id
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <form
            id={FORM_ID}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="flex min-w-0 flex-1 flex-col overflow-y-auto px-12 pt-10 pb-8"
          >
            <h3 className="pb-6 font-heading text-2xl font-semibold">Profil</h3>

            <div className="flex max-w-[520px] flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-first-name">Prénom</Label>
                  <Input
                    id="settings-first-name"
                    value={values.firstName}
                    onChange={(event) => setValues((current) => ({ ...current, firstName: event.target.value }))}
                    placeholder="Jeanne"
                    autoComplete="given-name"
                    maxLength={NAME_MAX_LENGTH}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="settings-last-name">Nom</Label>
                  <Input
                    id="settings-last-name"
                    value={values.lastName}
                    onChange={(event) => setValues((current) => ({ ...current, lastName: event.target.value }))}
                    placeholder="Martin"
                    autoComplete="family-name"
                    maxLength={NAME_MAX_LENGTH}
                  />
                </div>
              </div>

              {/* Not editable yet: changing it needs a confirmation by email (docs/settings.md). */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="settings-email">Adresse e-mail</Label>
                <Input id="settings-email" type="email" value={email} disabled readOnly />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="settings-handle">Adresse de mon profil public</Label>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          aria-label="À quoi sert cette adresse ?"
                          className="inline-flex size-5 items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      }
                    >
                      <CircleHelpIcon className="size-3.5" />
                    </TooltipTrigger>
                    <TooltipContent align="start">
                      L&apos;adresse de la page que vous partagez avec vos clients et recruteurs.
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-sm text-muted-foreground">{host}/</span>
                  <Input
                    id="settings-handle"
                    value={values.handle}
                    onChange={(event) => onHandleChange(event.target.value)}
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={handleError || undefined}
                    aria-describedby="settings-handle-status"
                  />
                </div>
                <p
                  id="settings-handle-status"
                  role="status"
                  className={cn(
                    "flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground",
                    handleStatus === "available" && "text-success",
                    handleError && "text-destructive",
                  )}
                >
                  {handleStatus === "checking" && <LoaderCircleIcon className="size-3.5 shrink-0 animate-spin" />}
                  {handleStatus === "available" && <CheckIcon className="size-3.5 shrink-0" />}
                  {handleError && <CircleAlertIcon className="size-3.5 shrink-0" />}
                  {HANDLE_MESSAGES[handleStatus]}
                </p>
              </div>

              {handleStatus === "available" && (
                <p className="bg-muted px-4 py-3 text-sm shadow-[inset_2px_0_0_var(--primary)]">
                  Votre profil public changera d&apos;adresse : {`${host}/${next.handle}`}. L&apos;ancienne,{" "}
                  {`${host}/${profile.handle}`}, ne fonctionnera plus. Pensez à transmettre la nouvelle.
                </p>
              )}
            </div>

            <div className="mt-auto flex pt-8">
              <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
                Supprimer le compte
              </Button>
            </div>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/50 px-5 py-3.5">
          {dirty && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusDot tone="warning" />
              Modifications non enregistrées
            </p>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" form={FORM_ID} disabled={!canSave}>
              Enregistrer
            </Button>
          </div>
        </div>

        {/* Nested dialogs: they open above the Settings. */}
        <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enregistrer les modifications ?</DialogTitle>
              <DialogDescription>
                Vous avez modifié vos paramètres sans les enregistrer. Si vous fermez maintenant, ces
                modifications seront perdues.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setConfirmClose(false);
                  onOpenChange(false);
                }}
              >
                Ignorer les modifications
              </Button>
              <Button onClick={save} disabled={!canSave}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={confirmDelete} onOpenChange={(nextOpen) => !deleting && setConfirmDelete(nextOpen)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <p className="eyebrow text-destructive">Action irréversible</p>
              <DialogTitle>Supprimer votre compte ?</DialogTitle>
              <DialogDescription>
                Toutes les données liées à votre compte seront supprimées définitivement : votre profil,
                votre page publique et tout ce que vous avez créé dans MyWork. Vous serez ensuite
                déconnecté.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>
                Annuler
              </Button>
              <Button variant="destructive" disabled={deleting} onClick={removeAccount}>
                Supprimer définitivement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
