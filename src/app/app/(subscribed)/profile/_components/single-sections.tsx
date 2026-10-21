"use client";

import { StarIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { SiteIcon } from "@/components/site-icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { parseDailyRate, profileInitials } from "@/lib/profile/content";
import { siteOf, linkText } from "@/lib/profile/links";
import {
  FEATURED_SKILLS_MAX,
  LIST_LIMITS,
  MAX_LENGTH,
  WORK_MODE_LABELS,
  WORK_MODES,
  type Availability,
  type ProfileLink,
} from "@/lib/profile/types";
import { cn } from "@/lib/utils";

import { AddButton, EditorSection, ItemCard, ItemFooter, patchItem, useEditor } from "./editor-context";
import { errorProps, Field, TextAreaField, TextField } from "./fields";
import { PhotoField } from "./photo-field";
import { SortableList } from "./sortable-list";

// Sections of "Mon profil" made of single fields: header, contact details, about, freelance offer.

export function HeaderSection({ handle }: { handle: string }) {
  const { content, update, errors, userId } = useEditor();
  return (
    <EditorSection id="header" title="En-tête">
      <PhotoField
        userId={userId}
        photoUrl={content.photoUrl}
        initials={profileInitials({ ...content, handle })}
        onChange={(photoUrl) => update({ photoUrl })}
      />
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <TextField
          id="profile-first-name"
          label="Prénom"
          value={content.firstName}
          onChange={(firstName) => update({ firstName })}
          error={errors.firstName}
          maxLength={MAX_LENGTH.name}
          autoComplete="given-name"
        />
        <TextField
          id="profile-last-name"
          label="Nom"
          value={content.lastName}
          onChange={(lastName) => update({ lastName })}
          error={errors.lastName}
          maxLength={MAX_LENGTH.name}
          autoComplete="family-name"
        />
        <TextField
          id="profile-headline"
          label="Titre professionnel"
          value={content.headline}
          onChange={(headline) => update({ headline })}
          error={errors.headline}
          maxLength={MAX_LENGTH.headline}
          placeholder="Product designer freelance · Design systems"
          className="sm:col-span-2"
        />
        <TextField
          id="profile-location"
          label="Localisation"
          value={content.location}
          onChange={(location) => update({ location })}
          error={errors.location}
          maxLength={MAX_LENGTH.location}
          placeholder="Lyon, France"
        />
      </div>
    </EditorSection>
  );
}

export function ContactSection() {
  const { content, update, errors, add, remove } = useEditor();
  return (
    <EditorSection id="contact" title="Coordonnées">
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <TextField
          id="profile-contact-email"
          label="E-mail de contact"
          type="email"
          value={content.contactEmail}
          onChange={(contactEmail) => update({ contactEmail })}
          error={errors.contactEmail}
          maxLength={MAX_LENGTH.contactEmail}
          autoComplete="email"
        />
        <TextField
          id="profile-phone"
          label="Téléphone"
          type="tel"
          value={content.phone}
          onChange={(phone) => update({ phone })}
          error={errors.phone}
          maxLength={20}
          placeholder="+33 6 12 34 56 78"
          autoComplete="tel"
        />
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Affichés seulement au clic sur « Me contacter », pour les protéger des robots.
      </p>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Liens</span>
        {content.links.length > 0 && (
          <SortableList
            items={content.links}
            itemLabel={linkText}
            onReorder={(links) => update({ links })}
          >
            {(link, handle) => (
              <LinkRow link={link} handle={handle} error={errors[`links.${link.id}.url`]} onRemove={() => remove("links", link.id, linkText(link))} />
            )}
          </SortableList>
        )}
        {errors.links && <p className="text-xs text-destructive">{errors.links}</p>}
        <AddButton
          label="Ajouter un lien"
          disabled={content.links.length >= LIST_LIMITS.links}
          onClick={() => add("links", { id: crypto.randomUUID(), url: "", label: "" })}
        />
      </div>
    </EditorSection>
  );
}

function LinkRow({
  link,
  handle,
  error,
  onRemove,
}: {
  link: ProfileLink;
  handle: React.ReactNode;
  error?: string;
  onRemove: () => void;
}) {
  const { update, justAdded } = useEditor();
  const urlId = `links-${link.id}-url`;
  const known = link.url ? siteOf(link.url.includes("://") ? link.url : `https://${link.url}`) : null;
  return (
    <div className={cn("flex flex-col gap-1 border bg-card p-1.5", error ? "border-destructive" : "border-border")}>
      <div className="flex items-center gap-2">
        {handle}
        <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
          <SiteIcon url={link.url.includes("://") ? link.url : `https://${link.url}`} />
        </span>
        <Input
          id={urlId}
          aria-label="Adresse du lien"
          placeholder="linkedin.com/in/…"
          value={link.url}
          autoFocus={justAdded === link.id}
          onChange={(event) => update(patchItem("links", link.id, { url: event.target.value }))}
          maxLength={MAX_LENGTH.url}
          className="min-w-0 flex-[3]"
          {...errorProps(urlId, error)}
        />
        <Input
          aria-label="Libellé du lien"
          placeholder={known?.name ?? "Libellé"}
          value={link.label}
          onChange={(event) => update(patchItem("links", link.id, { label: event.target.value }))}
          maxLength={MAX_LENGTH.short}
          className="min-w-0 flex-[2]"
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Retirer le lien ${linkText(link)}`} onClick={onRemove}>
          <XIcon />
        </Button>
      </div>
      {error && (
        <p id={`${urlId}-error`} className="pb-1 pl-20 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function AboutSection() {
  const { content, update, errors } = useEditor();
  const featuredCount = content.skills.filter((skill) => skill.featured).length;
  return (
    <EditorSection id="about" title="À propos">
      <TextAreaField
        id="profile-about"
        label="Présentation"
        value={content.about}
        onChange={(about) => update({ about })}
        error={errors.about}
        max={MAX_LENGTH.about}
        rows={6}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          Compétences phares <span className="font-normal text-muted-foreground">· {FEATURED_SKILLS_MAX} au plus</span>
        </span>
        {content.skills.length === 0 ? (
          <p className="text-xs text-muted-foreground">Ajoutez d&apos;abord des compétences, dans la section Compétences.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {content.skills.map((skill) => {
              const disabled = !skill.featured && featuredCount >= FEATURED_SKILLS_MAX;
              return (
                <button
                  key={skill.id}
                  type="button"
                  aria-pressed={skill.featured}
                  disabled={disabled}
                  onClick={() => update(patchItem("skills", skill.id, { featured: !skill.featured }))}
                  className={cn(
                    "eyebrow inline-flex h-7 items-center gap-1.5 border px-2.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40",
                    skill.featured
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  <StarIcon aria-hidden className={cn("size-3", skill.featured && "fill-current")} />
                  {skill.name}
                </button>
              );
            })}
          </div>
        )}
        {errors.featuredSkills && <p className="text-xs text-destructive">{errors.featuredSkills}</p>}
      </div>
    </EditorSection>
  );
}

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: "unspecified", label: "Non précisée" },
  { value: "available", label: "Disponible" },
  { value: "available_from", label: "À partir du" },
  { value: "unavailable", label: "Indisponible" },
];

export function FreelanceSection() {
  const { content, update, errors, add } = useEditor();
  // The amount as typed: "550", or a mistake to point out.
  const [rate, setRate] = useState(content.dailyRate === null ? "" : String(content.dailyRate));

  return (
    <EditorSection
      id="freelance"
      title="Offre freelance"
      action={
        <label className="flex items-center gap-3 text-sm">
          Je propose mes services en freelance
          <Switch checked={content.isFreelance} onCheckedChange={(isFreelance) => update({ isFreelance })} />
        </label>
      }
    >
      {!content.isFreelance ? (
        <p className="text-sm text-muted-foreground">
          Votre offre freelance n&apos;apparaît ni sur votre profil public ni dans votre CV. Elle est gardée, pour le
          jour où vous la réactiverez.
        </p>
      ) : (
        <>
          <Field id="profile-availability" label="Disponibilité" error={errors.availableFrom}>
            <RadioGroup
              id="profile-availability"
              aria-label="Disponibilité"
              value={content.availability}
              onValueChange={(value) => update({ availability: value as Availability })}
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              {AVAILABILITY_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value={option.value} />
                  {option.label}
                </label>
              ))}
              {content.availability === "available_from" && (
                <Input
                  type="date"
                  aria-label="Disponible à partir du"
                  value={content.availableFrom ?? ""}
                  onChange={(event) => update({ availableFrom: event.target.value || null })}
                  className="w-40 tabular-nums"
                  {...errorProps("profile-availability", errors.availableFrom)}
                />
              )}
            </RadioGroup>
          </Field>

          <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">Mode de travail</legend>
              <div className="flex h-9 flex-wrap items-center gap-x-5 gap-y-2">
                {WORK_MODES.map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={content.workModes.includes(mode)}
                      onCheckedChange={(checked) =>
                        update((current) => ({
                          workModes: checked
                            ? [...current.workModes, mode]
                            : current.workModes.filter((item) => item !== mode),
                        }))
                      }
                    />
                    {WORK_MODE_LABELS[mode]}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="profile-daily-rate" label="TJM" error={errors.dailyRate}>
              <div className="flex items-center gap-3">
                <Input
                  id="profile-daily-rate"
                  inputMode="numeric"
                  value={rate}
                  onChange={(event) => {
                    setRate(event.target.value);
                    const text = event.target.value.trim();
                    update({ dailyRate: text ? (parseDailyRate(text) ?? Number.NaN) : null });
                  }}
                  className="w-32 tabular-nums"
                  {...errorProps("profile-daily-rate", errors.dailyRate)}
                />
                <span className="text-sm text-muted-foreground">€ HT / jour</span>
              </div>
            </Field>
            <TextField
              id="profile-travel-zone"
              label="Zone de déplacement"
              value={content.travelZone}
              onChange={(travelZone) => update({ travelZone })}
              error={errors.travelZone}
              maxLength={MAX_LENGTH.travelZone}
              placeholder="Lyon et environs, Paris ponctuellement"
              className="sm:col-span-2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Prestations</Label>
            {content.services.length > 0 && (
              <SortableList
                items={content.services}
                itemLabel={(service) => service.name}
                onReorder={(services) => update({ services })}
              >
                {(service, handle) => <ServiceItem id={service.id} handle={handle} />}
              </SortableList>
            )}
            {errors.services && <p className="text-xs text-destructive">{errors.services}</p>}
            <AddButton
              label="Ajouter une prestation"
              disabled={content.services.length >= LIST_LIMITS.services}
              onClick={() => add("services", { id: crypto.randomUUID(), name: "", description: "" })}
            />
          </div>
        </>
      )}
    </EditorSection>
  );
}

function ServiceItem({ id, handle }: { id: string; handle: React.ReactNode }) {
  const { content, update, errors, justAdded } = useEditor();
  const service = content.services.find((item) => item.id === id);
  if (!service) return null;
  const prefix = `services.${id}`;
  return (
    <ItemCard id={id} errorPrefix={prefix} title={service.name} subtitle={service.description} handle={handle}>
      <TextField
        id={`services-${id}-name`}
        label="Nom"
        required
        value={service.name}
        onChange={(name) => update(patchItem("services", id, { name }))}
        error={errors[`${prefix}.name`]}
        maxLength={MAX_LENGTH.serviceName}
        placeholder="Audit UX"
        autoFocus={justAdded === id}
      />
      <TextAreaField
        id={`services-${id}-description`}
        label="Description"
        value={service.description}
        onChange={(description) => update(patchItem("services", id, { description }))}
        error={errors[`${prefix}.description`]}
        max={MAX_LENGTH.serviceDescription}
        rows={3}
      />
      <ItemFooter list="services" id={id} name={service.name} />
    </ItemCard>
  );
}
