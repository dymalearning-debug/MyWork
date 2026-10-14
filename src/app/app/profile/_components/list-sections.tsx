"use client";

import { ImagePlusIcon, LoaderCircleIcon, StarIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { formatPeriod, formatYearMonth } from "@/lib/profile/dates";
import { IMAGE_TYPES, imageFileProblem } from "@/lib/profile/images";
import { sortCertifications, sortEducations, sortExperiences } from "@/lib/profile/ordering";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPES,
  FEATURED_SKILLS_MAX,
  LANGUAGE_LEVEL_LABELS,
  LANGUAGE_LEVELS,
  LIST_LIMITS,
  MAX_LENGTH,
  PROJECT_IMAGES_MAX,
  SECTION_LABELS,
  WORK_MODE_LABELS,
  WORK_MODES,
  type EmploymentType,
  type Experience,
  type LanguageLevel,
  type ProfileContent,
  type WorkMode,
} from "@/lib/profile/types";
import { uploadProfileImage } from "@/lib/profile/upload";
import { cn } from "@/lib/utils";

import { AddButton, EditorSection, ItemCard, ItemFooter, patchItem, useEditor } from "./editor-context";
import { errorProps, Field, SkillsField, TextAreaField, TextField, YearMonthField } from "./fields";
import { SortableList } from "./sortable-list";

// Sections of "Mon profil" made of lists: experiences, projects, education, certifications,
// skills, languages, recommendations.

function ListError({ list }: { list: keyof ProfileContent }) {
  const { errors } = useEditor();
  return errors[list] ? <p className="text-xs text-destructive">{errors[list]}</p> : null;
}

// "Poste actuel", "En cours": a checkbox that empties the end date.
function OngoingCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {label}
    </label>
  );
}

const experienceTitle = (experience: Experience) =>
  [experience.title, experience.company].filter(Boolean).join(" · ");

// ——— Experiences ———

export function ExperiencesSection() {
  const { content, add } = useEditor();
  // Automatic order, by date: current positions first (docs/profile.md, "Expériences").
  const sorted = sortExperiences(content.experiences);
  return (
    <EditorSection id="experiences" title={SECTION_LABELS.experiences}>
      {sorted.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sorted.map((experience) => (
            <li key={experience.id}>
              <ExperienceItem experience={experience} />
            </li>
          ))}
        </ul>
      )}
      <ListError list="experiences" />
      <AddButton
        label="Ajouter une expérience"
        disabled={content.experiences.length >= LIST_LIMITS.experiences}
        onClick={() =>
          add("experiences", {
            id: crypto.randomUUID(),
            title: "",
            company: "",
            location: "",
            employmentType: null,
            workMode: null,
            start: null,
            end: null,
            isCurrent: false,
            description: "",
            skills: [],
          })
        }
      />
    </EditorSection>
  );
}

function ExperienceItem({ experience }: { experience: Experience }) {
  const { content, update, errors, justAdded } = useEditor();
  const { id } = experience;
  const prefix = `experiences.${id}`;
  const set = (patch: Partial<Experience>) => update(patchItem("experiences", id, patch));
  return (
    <ItemCard
      id={id}
      errorPrefix={prefix}
      title={experienceTitle(experience)}
      subtitle={formatPeriod(experience)}
    >
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <TextField
          id={`experiences-${id}-title`}
          label="Poste"
          required
          value={experience.title}
          onChange={(title) => set({ title })}
          error={errors[`${prefix}.title`]}
          maxLength={MAX_LENGTH.short}
          autoFocus={justAdded === id}
        />
        <TextField
          id={`experiences-${id}-company`}
          label="Entreprise ou client"
          value={experience.company}
          onChange={(company) => set({ company })}
          error={errors[`${prefix}.company`]}
          maxLength={MAX_LENGTH.short}
          hint="Client confidentiel : un nom générique suffit."
        />
        <TextField
          id={`experiences-${id}-location`}
          label="Lieu"
          value={experience.location}
          onChange={(location) => set({ location })}
          error={errors[`${prefix}.location`]}
          maxLength={MAX_LENGTH.short}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field id={`experiences-${id}-type`} label="Type">
            <NativeSelect
              id={`experiences-${id}-type`}
              value={experience.employmentType ?? ""}
              onChange={(event) => set({ employmentType: (event.target.value || null) as EmploymentType | null })}
              className="w-full"
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {EMPLOYMENT_TYPES.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field id={`experiences-${id}-mode`} label="Mode">
            <NativeSelect
              id={`experiences-${id}-mode`}
              value={experience.workMode ?? ""}
              onChange={(event) => set({ workMode: (event.target.value || null) as WorkMode | null })}
              className="w-full"
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {WORK_MODES.map((mode) => (
                <NativeSelectOption key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
        <YearMonthField
          id={`experiences-${id}-start`}
          label="Début"
          required
          value={experience.start}
          onChange={(start) => set({ start })}
          error={errors[`${prefix}.start`]}
        />
        <div className="flex flex-col gap-2">
          <YearMonthField
            id={`experiences-${id}-end`}
            label="Fin"
            value={experience.isCurrent ? null : experience.end}
            onChange={(end) => set({ end })}
            error={errors[`${prefix}.end`]}
            disabled={experience.isCurrent}
          />
          <OngoingCheckbox label="Poste actuel" checked={experience.isCurrent} onChange={(isCurrent) => set({ isCurrent })} />
        </div>
      </div>
      <TextAreaField
        id={`experiences-${id}-description`}
        label="Description"
        value={experience.description}
        onChange={(description) => set({ description })}
        error={errors[`${prefix}.description`]}
        max={MAX_LENGTH.experienceDescription}
      />
      <SkillsField
        id={`experiences-${id}-skills`}
        label="Compétences utilisées"
        value={experience.skills}
        onChange={(skills) => set({ skills })}
        suggestions={content.skills.map((skill) => skill.name)}
      />
      <ItemFooter list="experiences" id={id} name={experienceTitle(experience)} />
    </ItemCard>
  );
}

// ——— Projects ———

export function ProjectsSection() {
  const { content, update, add } = useEditor();
  return (
    <EditorSection id="projects" title={SECTION_LABELS.projects}>
      {content.projects.length > 0 && (
        <SortableList items={content.projects} itemLabel={(project) => project.name} onReorder={(projects) => update({ projects })}>
          {(project, handle) => <ProjectItem id={project.id} handle={handle} />}
        </SortableList>
      )}
      <ListError list="projects" />
      <AddButton
        label="Ajouter un projet"
        disabled={content.projects.length >= LIST_LIMITS.projects}
        onClick={() =>
          add("projects", {
            id: crypto.randomUUID(),
            name: "",
            description: "",
            start: null,
            end: null,
            isCurrent: false,
            url: "",
            experienceId: null,
            images: [],
            skills: [],
          })
        }
      />
    </EditorSection>
  );
}

function ProjectItem({ id, handle }: { id: string; handle: React.ReactNode }) {
  const { content, update, errors, justAdded } = useEditor();
  const project = content.projects.find((item) => item.id === id);
  if (!project) return null;
  const prefix = `projects.${id}`;
  const set = (patch: Partial<typeof project>) => update(patchItem("projects", id, patch));
  return (
    <ItemCard
      id={id}
      errorPrefix={prefix}
      title={project.name}
      subtitle={formatPeriod(project, { ongoing: "en cours" })}
      handle={handle}
    >
      <TextField
        id={`projects-${id}-name`}
        label="Nom"
        required
        value={project.name}
        onChange={(name) => set({ name })}
        error={errors[`${prefix}.name`]}
        maxLength={MAX_LENGTH.short}
        autoFocus={justAdded === id}
      />
      <TextAreaField
        id={`projects-${id}-description`}
        label="Description"
        value={project.description}
        onChange={(description) => set({ description })}
        error={errors[`${prefix}.description`]}
        max={MAX_LENGTH.projectDescription}
      />
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <YearMonthField
          id={`projects-${id}-start`}
          label="Début"
          value={project.start}
          onChange={(start) => set({ start })}
          error={errors[`${prefix}.start`]}
        />
        <div className="flex flex-col gap-2">
          <YearMonthField
            id={`projects-${id}-end`}
            label="Fin"
            value={project.isCurrent ? null : project.end}
            onChange={(end) => set({ end })}
            error={errors[`${prefix}.end`]}
            disabled={project.isCurrent}
          />
          <OngoingCheckbox label="En cours" checked={project.isCurrent} onChange={(isCurrent) => set({ isCurrent })} />
        </div>
        <TextField
          id={`projects-${id}-url`}
          label="Lien"
          value={project.url}
          onChange={(url) => set({ url })}
          error={errors[`${prefix}.url`]}
          maxLength={MAX_LENGTH.url}
          placeholder="exemple.fr/projet"
        />
        <Field id={`projects-${id}-experience`} label="Expérience associée">
          <NativeSelect
            id={`projects-${id}-experience`}
            value={project.experienceId ?? ""}
            onChange={(event) => set({ experienceId: event.target.value || null })}
            className="w-full"
          >
            <NativeSelectOption value="">Aucune</NativeSelectOption>
            {sortExperiences(content.experiences).map((experience) => (
              <NativeSelectOption key={experience.id} value={experience.id}>
                {experienceTitle(experience) || "Sans titre"}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <ProjectImages id={id} images={project.images} onChange={(images) => set({ images })} error={errors[`${prefix}.images`]} />
      <SkillsField
        id={`projects-${id}-skills`}
        label="Compétences utilisées"
        value={project.skills}
        onChange={(skills) => set({ skills })}
        suggestions={content.skills.map((skill) => skill.name)}
      />
      <ItemFooter list="projects" id={id} name={project.name} />
    </ItemCard>
  );
}

// Images of a project, 5 at most: the first is the cover on the public page.
function ProjectImages({
  id,
  images,
  onChange,
  error,
}: {
  id: string;
  images: string[];
  onChange: (images: string[]) => void;
  error?: string;
}) {
  const { userId } = useEditor();
  const input = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);

  async function send(files: File[]) {
    const room = PROJECT_IMAGES_MAX - images.length;
    if (files.length > room) toast.error(`${PROJECT_IMAGES_MAX} images au plus par projet.`);
    const accepted: File[] = [];
    for (const file of files.slice(0, room)) {
      const problem = imageFileProblem(file);
      if (problem) toast.error(`${file.name} : ${problem}`);
      else accepted.push(file);
    }
    if (accepted.length === 0) return;
    setSending(true);
    try {
      const urls = await Promise.all(accepted.map((file) => uploadProfileImage(userId, file)));
      onChange([...images, ...urls]);
    } catch (uploadError) {
      console.error(uploadError);
      toast.error("Les images n'ont pas pu être envoyées. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Field
      id={`projects-${id}-images`}
      label="Images"
      error={error}
      hint={`${PROJECT_IMAGES_MAX} au plus, JPG, PNG ou WebP de 5 Mo au plus. La première sert de couverture.`}
    >
      <div className="flex flex-wrap gap-3">
        {images.map((url, index) => (
          <figure key={url} className="relative size-28 border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Image ${index + 1} du projet`} className="size-full object-cover" />
            {index === 0 && (
              <figcaption className="eyebrow absolute bottom-0 left-0 bg-foreground px-1.5 text-[0.625rem] text-background">
                Couverture
              </figcaption>
            )}
            <div className="absolute top-1 right-1 flex gap-1">
              {index > 0 && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  aria-label={`Mettre l'image ${index + 1} en couverture`}
                  onClick={() => onChange([url, ...images.filter((item) => item !== url)])}
                >
                  <StarIcon />
                </Button>
              )}
              <Button
                type="button"
                size="icon-xs"
                variant="secondary"
                aria-label={`Retirer l'image ${index + 1}`}
                onClick={() => onChange(images.filter((item) => item !== url))}
              >
                <XIcon />
              </Button>
            </div>
          </figure>
        ))}
        {images.length < PROJECT_IMAGES_MAX && (
          <button
            id={`projects-${id}-images`}
            type="button"
            disabled={sending}
            onClick={() => input.current?.click()}
            className="flex size-28 flex-col items-center justify-center gap-2 border border-dashed border-input text-xs text-muted-foreground transition-colors outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {sending ? <LoaderCircleIcon className="size-4 animate-spin" /> : <ImagePlusIcon className="size-4" />}
            Ajouter
          </button>
        )}
        <input
          ref={input}
          type="file"
          multiple
          accept={IMAGE_TYPES.join(",")}
          aria-label="Fichiers des images du projet"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            void send(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
    </Field>
  );
}

// ——— Education ———

export function EducationsSection() {
  const { content, update, errors, add, justAdded } = useEditor();
  return (
    <EditorSection id="educations" title={SECTION_LABELS.educations}>
      {content.educations.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sortEducations(content.educations).map((education) => {
            const { id } = education;
            const prefix = `educations.${id}`;
            const set = (patch: Partial<typeof education>) => update(patchItem("educations", id, patch));
            const title = [education.school, education.degree].filter(Boolean).join(" · ");
            return (
              <li key={id}>
                <ItemCard id={id} errorPrefix={prefix} title={title} subtitle={formatPeriod(education, { ongoing: "en cours" })}>
                  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                    <TextField
                      id={`educations-${id}-school`}
                      label="Établissement"
                      required
                      value={education.school}
                      onChange={(school) => set({ school })}
                      error={errors[`${prefix}.school`]}
                      maxLength={MAX_LENGTH.short}
                      autoFocus={justAdded === id}
                    />
                    <TextField
                      id={`educations-${id}-degree`}
                      label="Diplôme"
                      value={education.degree}
                      onChange={(degree) => set({ degree })}
                      error={errors[`${prefix}.degree`]}
                      maxLength={MAX_LENGTH.short}
                    />
                    <TextField
                      id={`educations-${id}-field`}
                      label="Domaine d'études"
                      value={education.field}
                      onChange={(field) => set({ field })}
                      error={errors[`${prefix}.field`]}
                      maxLength={MAX_LENGTH.short}
                      className="sm:col-span-2"
                    />
                    <YearMonthField
                      id={`educations-${id}-start`}
                      label="Début"
                      value={education.start}
                      onChange={(start) => set({ start })}
                      error={errors[`${prefix}.start`]}
                    />
                    <div className="flex flex-col gap-2">
                      <YearMonthField
                        id={`educations-${id}-end`}
                        label="Fin"
                        value={education.isCurrent ? null : education.end}
                        onChange={(end) => set({ end })}
                        error={errors[`${prefix}.end`]}
                        disabled={education.isCurrent}
                      />
                      <OngoingCheckbox label="En cours" checked={education.isCurrent} onChange={(isCurrent) => set({ isCurrent })} />
                    </div>
                  </div>
                  <TextAreaField
                    id={`educations-${id}-description`}
                    label="Description"
                    value={education.description}
                    onChange={(description) => set({ description })}
                    error={errors[`${prefix}.description`]}
                    max={MAX_LENGTH.educationDescription}
                    rows={3}
                  />
                  <ItemFooter list="educations" id={id} name={title} />
                </ItemCard>
              </li>
            );
          })}
        </ul>
      )}
      <ListError list="educations" />
      <AddButton
        label="Ajouter une formation"
        disabled={content.educations.length >= LIST_LIMITS.educations}
        onClick={() =>
          add("educations", {
            id: crypto.randomUUID(),
            school: "",
            degree: "",
            field: "",
            start: null,
            end: null,
            isCurrent: false,
            description: "",
          })
        }
      />
    </EditorSection>
  );
}

// ——— Certifications ———

export function CertificationsSection() {
  const { content, update, errors, add, justAdded } = useEditor();
  return (
    <EditorSection id="certifications" title={SECTION_LABELS.certifications}>
      {content.certifications.length > 0 && (
        <ul className="flex flex-col gap-2">
          {sortCertifications(content.certifications).map((certification) => {
            const { id } = certification;
            const prefix = `certifications.${id}`;
            const set = (patch: Partial<typeof certification>) => update(patchItem("certifications", id, patch));
            return (
              <li key={id}>
                <ItemCard
                  id={id}
                  errorPrefix={prefix}
                  title={[certification.name, certification.issuer].filter(Boolean).join(" · ")}
                  subtitle={certification.issued ? formatYearMonth(certification.issued) : undefined}
                >
                  <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
                    <TextField
                      id={`certifications-${id}-name`}
                      label="Nom"
                      required
                      value={certification.name}
                      onChange={(name) => set({ name })}
                      error={errors[`${prefix}.name`]}
                      maxLength={MAX_LENGTH.short}
                      autoFocus={justAdded === id}
                    />
                    <TextField
                      id={`certifications-${id}-issuer`}
                      label="Organisme"
                      value={certification.issuer}
                      onChange={(issuer) => set({ issuer })}
                      error={errors[`${prefix}.issuer`]}
                      maxLength={MAX_LENGTH.short}
                    />
                    <YearMonthField
                      id={`certifications-${id}-issued`}
                      label="Date d'obtention"
                      value={certification.issued}
                      onChange={(issued) => set({ issued })}
                      error={errors[`${prefix}.issued`]}
                    />
                    <div className="flex flex-col gap-2">
                      <YearMonthField
                        id={`certifications-${id}-expires`}
                        label="Date d'expiration"
                        value={certification.expires}
                        onChange={(expires) => set({ expires })}
                        error={errors[`${prefix}.expires`]}
                      />
                      {!certification.expires && <p className="text-xs text-muted-foreground">Vide : n&apos;expire pas.</p>}
                    </div>
                    <TextField
                      id={`certifications-${id}-credential`}
                      label="Identifiant"
                      value={certification.credentialId}
                      onChange={(credentialId) => set({ credentialId })}
                      error={errors[`${prefix}.credentialId`]}
                      maxLength={MAX_LENGTH.short}
                    />
                    <TextField
                      id={`certifications-${id}-verification`}
                      label="Lien de vérification"
                      value={certification.verificationUrl}
                      onChange={(verificationUrl) => set({ verificationUrl })}
                      error={errors[`${prefix}.verificationUrl`]}
                      maxLength={MAX_LENGTH.url}
                    />
                  </div>
                  <ItemFooter list="certifications" id={id} name={certification.name} />
                </ItemCard>
              </li>
            );
          })}
        </ul>
      )}
      <ListError list="certifications" />
      <AddButton
        label="Ajouter une certification"
        disabled={content.certifications.length >= LIST_LIMITS.certifications}
        onClick={() =>
          add("certifications", {
            id: crypto.randomUUID(),
            name: "",
            issuer: "",
            credentialId: "",
            issued: null,
            expires: null,
            verificationUrl: "",
          })
        }
      />
    </EditorSection>
  );
}

// ——— Skills ———

export function SkillsSection() {
  const { content, update, errors, remove } = useEditor();
  const [draft, setDraft] = useState("");
  const featuredCount = content.skills.filter((skill) => skill.featured).length;
  const full = content.skills.length >= LIST_LIMITS.skills;

  // A renamed skill is renamed in the experiences and projects that use it too.
  function rename(id: string, name: string) {
    update((current) => {
      const before = current.skills.find((skill) => skill.id === id)?.name.toLocaleLowerCase("fr");
      const swap = (names: string[]) => names.map((item) => (item.toLocaleLowerCase("fr") === before ? name : item));
      return {
        skills: current.skills.map((skill) => (skill.id === id ? { ...skill, name } : skill)),
        experiences: current.experiences.map((item) => ({ ...item, skills: swap(item.skills) })),
        projects: current.projects.map((item) => ({ ...item, skills: swap(item.skills) })),
      };
    });
  }

  function addSkill() {
    const name = draft.replace(/\s+/g, " ").trim();
    if (!name || full) return;
    setDraft("");
    if (content.skills.some((skill) => skill.name.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"))) return;
    update((current) => ({ skills: [...current.skills, { id: crypto.randomUUID(), name, featured: false }] }));
  }

  return (
    <EditorSection id="skills" title={SECTION_LABELS.skills}>
      <p className="-mt-2 text-xs text-muted-foreground">
        Sans niveau. L&apos;étoile marque une compétence phare, affichée sous votre présentation ({FEATURED_SKILLS_MAX} au
        plus).
      </p>
      {content.skills.length > 0 && (
        <SortableList items={content.skills} itemLabel={(skill) => skill.name} onReorder={(skills) => update({ skills })}>
          {(skill, handle) => {
            const nameId = `skills-${skill.id}-name`;
            const error = errors[`skills.${skill.id}.name`];
            return (
              <div className={cn("flex items-center gap-2 border bg-card p-1.5", error ? "border-destructive" : "border-border")}>
                {handle}
                <Input
                  id={nameId}
                  aria-label="Nom de la compétence"
                  value={skill.name}
                  maxLength={MAX_LENGTH.skill}
                  onChange={(event) => rename(skill.id, event.target.value)}
                  className="min-w-0 flex-1"
                  {...errorProps(nameId, error)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Compétence phare : ${skill.name}`}
                  aria-pressed={skill.featured}
                  disabled={!skill.featured && featuredCount >= FEATURED_SKILLS_MAX}
                  onClick={() => update(patchItem("skills", skill.id, { featured: !skill.featured }))}
                >
                  <StarIcon className={cn(skill.featured && "fill-current")} />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Supprimer la compétence ${skill.name}`}
                  onClick={() => remove("skills", skill.id, skill.name)}
                >
                  <XIcon />
                </Button>
              </div>
            );
          }}
        </SortableList>
      )}
      <ListError list="skills" />
      <div className="flex gap-2">
        <Input
          aria-label="Nouvelle compétence"
          placeholder="Nouvelle compétence"
          value={draft}
          maxLength={MAX_LENGTH.skill}
          disabled={full}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSkill();
            }
          }}
          className="max-w-xs"
        />
        <AddButton label="Ajouter" disabled={full || !draft.trim()} onClick={addSkill} />
      </div>
    </EditorSection>
  );
}

// ——— Languages ———

const LANGUAGE_SUGGESTIONS = [
  "Français",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Italien",
  "Portugais",
  "Néerlandais",
  "Arabe",
  "Chinois",
  "Japonais",
  "Russe",
  "Langue des signes française",
];

export function LanguagesSection() {
  const { content, update, errors, add, remove, justAdded } = useEditor();
  return (
    <EditorSection id="languages" title={SECTION_LABELS.languages}>
      {content.languages.length > 0 && (
        <SortableList items={content.languages} itemLabel={(language) => language.name} onReorder={(languages) => update({ languages })}>
          {(language, handle) => {
            const nameId = `languages-${language.id}-name`;
            const error = errors[`languages.${language.id}.name`];
            return (
              <div className={cn("flex items-center gap-2 border bg-card p-1.5", error ? "border-destructive" : "border-border")}>
                {handle}
                <Input
                  id={nameId}
                  aria-label="Langue"
                  placeholder="Langue"
                  list="profile-language-suggestions"
                  value={language.name}
                  maxLength={MAX_LENGTH.language}
                  autoFocus={justAdded === language.id}
                  onChange={(event) => update(patchItem("languages", language.id, { name: event.target.value }))}
                  className="min-w-0 flex-1"
                  {...errorProps(nameId, error)}
                />
                <NativeSelect
                  aria-label={`Niveau en ${language.name || "cette langue"}`}
                  value={language.level ?? ""}
                  onChange={(event) =>
                    update(patchItem("languages", language.id, { level: (event.target.value || null) as LanguageLevel | null }))
                  }
                  className="w-48"
                >
                  <NativeSelectOption value="">Niveau</NativeSelectOption>
                  {LANGUAGE_LEVELS.map((level) => (
                    <NativeSelectOption key={level} value={level}>
                      {LANGUAGE_LEVEL_LABELS[level]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Supprimer la langue ${language.name}`}
                  onClick={() => remove("languages", language.id, language.name)}
                >
                  <XIcon />
                </Button>
              </div>
            );
          }}
        </SortableList>
      )}
      <datalist id="profile-language-suggestions">
        {LANGUAGE_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <ListError list="languages" />
      <AddButton
        label="Ajouter une langue"
        disabled={content.languages.length >= LIST_LIMITS.languages}
        onClick={() => add("languages", { id: crypto.randomUUID(), name: "", level: null })}
      />
    </EditorSection>
  );
}

// ——— Recommendations ———

export function RecommendationsSection() {
  const { content, update, add } = useEditor();
  return (
    <EditorSection id="recommendations" title={SECTION_LABELS.recommendations}>
      {content.recommendations.length > 0 && (
        <SortableList
          items={content.recommendations}
          itemLabel={(recommendation) => recommendation.author}
          onReorder={(recommendations) => update({ recommendations })}
        >
          {(recommendation, handle) => <RecommendationItem id={recommendation.id} handle={handle} />}
        </SortableList>
      )}
      <ListError list="recommendations" />
      <AddButton
        label="Ajouter une recommandation"
        disabled={content.recommendations.length >= LIST_LIMITS.recommendations}
        onClick={() =>
          add("recommendations", {
            id: crypto.randomUUID(),
            text: "",
            author: "",
            authorRole: "",
            authorCompany: "",
            authorUrl: "",
            date: null,
          })
        }
      />
    </EditorSection>
  );
}

function RecommendationItem({ id, handle }: { id: string; handle: React.ReactNode }) {
  const { content, update, errors, justAdded } = useEditor();
  const recommendation = content.recommendations.find((item) => item.id === id);
  if (!recommendation) return null;
  const prefix = `recommendations.${id}`;
  const set = (patch: Partial<typeof recommendation>) => update(patchItem("recommendations", id, patch));
  return (
    <ItemCard
      id={id}
      errorPrefix={prefix}
      title={recommendation.author}
      subtitle={recommendation.text}
      handle={handle}
    >
      <TextAreaField
        id={`recommendations-${id}-text`}
        label="Texte"
        required
        value={recommendation.text}
        onChange={(text) => set({ text })}
        error={errors[`${prefix}.text`]}
        max={MAX_LENGTH.recommendation}
      />
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <TextField
          id={`recommendations-${id}-author`}
          label="Auteur"
          required
          value={recommendation.author}
          onChange={(author) => set({ author })}
          error={errors[`${prefix}.author`]}
          maxLength={MAX_LENGTH.short}
          autoFocus={justAdded === id}
        />
        <TextField
          id={`recommendations-${id}-role`}
          label="Son rôle"
          value={recommendation.authorRole}
          onChange={(authorRole) => set({ authorRole })}
          error={errors[`${prefix}.authorRole`]}
          maxLength={MAX_LENGTH.short}
        />
        <TextField
          id={`recommendations-${id}-company`}
          label="Son entreprise"
          value={recommendation.authorCompany}
          onChange={(authorCompany) => set({ authorCompany })}
          error={errors[`${prefix}.authorCompany`]}
          maxLength={MAX_LENGTH.short}
        />
        <TextField
          id={`recommendations-${id}-url`}
          label="Lien vers son profil"
          value={recommendation.authorUrl}
          onChange={(authorUrl) => set({ authorUrl })}
          error={errors[`${prefix}.authorUrl`]}
          maxLength={MAX_LENGTH.url}
          placeholder="linkedin.com/in/…"
        />
        <YearMonthField
          id={`recommendations-${id}-date`}
          label="Date"
          value={recommendation.date}
          onChange={(date) => set({ date })}
          error={errors[`${prefix}.date`]}
        />
      </div>
      <ItemFooter list="recommendations" id={id} name={recommendation.author} />
    </ItemCard>
  );
}
