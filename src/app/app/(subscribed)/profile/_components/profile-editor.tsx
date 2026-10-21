"use client";

import { CheckIcon, DownloadIcon, ExternalLinkIcon, EyeIcon, GripVerticalIcon, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { StatusDot } from "@/components/status-dot";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  contentChangeSummary,
  hasContentChanges,
  isSectionFilled,
  normalizeProfileContent,
  validateProfileContent,
} from "@/lib/profile/content";
import { SECTION_LABELS, type ListName, type ProfileContent, type SectionId } from "@/lib/profile/types";
import { publicProfilePath } from "@/lib/public-profile/handle";
import { cn } from "@/lib/utils";

import { saveProfile } from "../actions";
import { EditorContext, type ContentUpdate, type Editor } from "./editor-context";
import type { FieldErrors } from "./fields";
import {
  CertificationsSection,
  EducationsSection,
  ExperiencesSection,
  LanguagesSection,
  ProjectsSection,
  RecommendationsSection,
  SkillsSection,
} from "./list-sections";
import { AboutSection, ContactSection, FreelanceSection, HeaderSection } from "./single-sections";
import { SortableList } from "./sortable-list";

const SECTIONS: Record<SectionId, () => React.ReactNode> = {
  about: AboutSection,
  freelance: FreelanceSection,
  experiences: ExperiencesSection,
  projects: ProjectsSection,
  educations: EducationsSection,
  certifications: CertificationsSection,
  skills: SkillsSection,
  languages: LanguagesSection,
  recommendations: RecommendationsSection,
};

const NOUNS: Record<ListName, string> = {
  links: "ce lien",
  services: "cette prestation",
  experiences: "cette expérience",
  educations: "cette formation",
  certifications: "cette certification",
  projects: "ce projet",
  skills: "cette compétence",
  languages: "cette langue",
  recommendations: "cette recommandation",
};

const sameName = (a: string, b: string) => a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");

// A skill typed in an experience or a project joins the list of skills at once
// (docs/profile.md, "Compétences").
function withTypedSkills(content: ProfileContent): ProfileContent {
  const typed = [...content.experiences, ...content.projects].flatMap((item) => item.skills);
  const missing = typed.filter(
    (name, index) =>
      name.trim() &&
      !content.skills.some((skill) => sameName(skill.name, name)) &&
      typed.findIndex((other) => sameName(other, name)) === index,
  );
  if (missing.length === 0) return content;
  return {
    ...content,
    skills: [...content.skills, ...missing.map((name) => ({ id: crypto.randomUUID(), name: name.trim(), featured: false }))],
  };
}

// "Mon profil" (docs/profile.md, "Espace privé"): the whole profile on one page, a table of
// contents at the left, one "Enregistrer" in a bar at the bottom.
export function ProfileEditor({
  userId,
  handle,
  initial,
}: {
  userId: string;
  handle: string;
  initial: ProfileContent;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [content, setContent] = useState(initial);
  // Remounts the fields that keep what is typed (the daily rate), after "Annuler".
  const [version, setVersion] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  // The item added last: unfolded, its first field focused when it appears.
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [removal, setRemoval] = useState<{ list: ListName; id: string; name: string } | null>(null);
  // An address the user wants to go to while changes are not saved.
  const [leaving, setLeaving] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const allowLeave = useRef(false);

  const next = useMemo(() => normalizeProfileContent(content), [content]);
  const dirty = hasContentChanges(saved, next);
  const issues = useMemo(() => (showErrors ? validateProfileContent(next) : []), [showErrors, next]);
  const errors: FieldErrors = useMemo(
    () => Object.fromEntries([...issues].reverse().map((issue) => [issue.field, issue.message])),
    [issues],
  );

  const editor: Editor = {
    userId,
    content,
    errors,
    update: (change: ContentUpdate) =>
      setContent((current) => withTypedSkills({ ...current, ...(typeof change === "function" ? change(current) : change) })),
    hasErrors: (prefix) => issues.some((issue) => issue.field.startsWith(`${prefix}.`)),
    isExpanded: (id) => expanded.has(id),
    toggle: (id) =>
      setExpanded((current) => {
        const nextSet = new Set(current);
        if (!nextSet.delete(id)) nextSet.add(id);
        return nextSet;
      }),
    justAdded,
    add: (list, item) => {
      setContent((current) => ({ ...current, [list]: [...current[list], item] }));
      setExpanded((current) => new Set(current).add(item.id));
      setJustAdded(item.id);
    },
    remove: (list, id, name) => setRemoval({ list, id, name }),
  };

  function confirmRemoval() {
    if (!removal) return;
    const { list, id } = removal;
    setContent((current) => {
      const updated = { ...current, [list]: (current[list] as { id: string }[]).filter((item) => item.id !== id) };
      if (list === "skills") {
        // A removed skill leaves the experiences and projects that used it.
        const name = current.skills.find((skill) => skill.id === id)?.name ?? "";
        const keep = (names: string[]) => names.filter((item) => !sameName(item, name));
        updated.experiences = current.experiences.map((item) => ({ ...item, skills: keep(item.skills) }));
        updated.projects = current.projects.map((item) => ({ ...item, skills: keep(item.skills) }));
      }
      if (list === "experiences") {
        updated.projects = current.projects.map((item) => (item.experienceId === id ? { ...item, experienceId: null } : item));
      }
      return updated as ProfileContent;
    });
    setRemoval(null);
  }

  function cancel() {
    setContent(saved);
    setShowErrors(false);
    setExpanded(new Set());
    setVersion((current) => current + 1);
  }

  // Saves, then goes on to `then` (an address the user was leaving for).
  function save(then?: string) {
    const found = validateProfileContent(next);
    if (found.length > 0) {
      setShowErrors(true);
      setLeaving(null);
      // Unfolds the items with an error, then shows the first one.
      setExpanded((current) => {
        const nextSet = new Set(current);
        for (const issue of found) {
          const [, id] = issue.field.split(".");
          if (id) nextSet.add(id);
        }
        return nextSet;
      });
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>("[aria-invalid=true]");
        field?.scrollIntoView({ block: "center" });
        field?.focus({ preventScroll: true });
      });
      toast.error("Certains champs sont à corriger.", { description: "Ils sont signalés en rouge." });
      return;
    }
    startSaving(async () => {
      const result = await saveProfile(next);
      if (!result.ok) {
        setLeaving(null);
        toast.error(
          result.error === "invalid"
            ? "Certaines valeurs ont été refusées. Vérifiez le formulaire."
            : "Le profil n'a pas pu être enregistré. Réessayez.",
        );
        return;
      }
      toast.success("Profil enregistré", { description: contentChangeSummary(saved, next) });
      setSaved(next);
      setContent(next);
      setShowErrors(false);
      if (then) {
        allowLeave.current = true;
        setLeaving(null);
        router.push(then);
      }
    });
  }

  // Leaving with changes not saved: the browser asks for a reload or a closed tab; the app asks
  // "Enregistrer les modifications ?" for its own links (docs/profile.md, "Enregistrement").
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!allowLeave.current) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (allowLeave.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return (
    <EditorContext.Provider value={editor}>
      <div className="flex min-h-svh flex-col">
        <div className="flex flex-1 gap-12 px-8 pt-14 pb-10 sm:px-16">
          <TableOfContents
            content={content}
            handle={handle}
            onOrderChange={(sectionOrder) => editor.update({ sectionOrder })}
          />

          <form
            noValidate
            aria-label="Mon profil"
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="min-w-0 max-w-[760px] flex-1"
          >
            <p className="eyebrow text-muted-foreground">Espace privé</p>
            <h1 className="mt-1.5 font-heading text-5xl font-medium">Mon profil</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tout est facultatif : ce que vous remplissez apparaît sur votre profil public, le reste n&apos;apparaît pas.
            </p>

            <div key={version} className="mt-2">
              <HeaderSection handle={handle} />
              <ContactSection />
              {content.sectionOrder.map((id) => {
                const Section = SECTIONS[id];
                return <Section key={id} />;
              })}
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background px-8 py-3.5 sm:px-16">
          {dirty ? (
            <p className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <StatusDot tone="warning" />
              Modifications non enregistrées
            </p>
          ) : (
            <p className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <CheckIcon className="size-4 text-success" />
              Tout est enregistré
            </p>
          )}
          <Button type="button" variant="outline" disabled={!dirty || saving} onClick={cancel}>
            Annuler
          </Button>
          <Button type="button" disabled={!dirty || saving} onClick={() => save()}>
            {saving && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>

      <Dialog open={!!removal} onOpenChange={(open) => !open && setRemoval(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer {removal ? NOUNS[removal.list] : ""} ?</DialogTitle>
            <DialogDescription>
              {removal?.name ? `« ${removal.name} » sera retiré de votre profil` : "Cet élément sera retiré de votre profil"}{" "}
              à l&apos;enregistrement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoval(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmRemoval}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!leaving} onOpenChange={(open) => !open && !saving && setLeaving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer les modifications ?</DialogTitle>
            <DialogDescription>
              Vous avez modifié votre profil sans l&apos;enregistrer. Si vous quittez la page maintenant, ces
              modifications seront perdues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                const target = leaving;
                allowLeave.current = true;
                setLeaving(null);
                if (target) router.push(target);
              }}
            >
              Ignorer les modifications
            </Button>
            <Button disabled={saving} onClick={() => leaving && save(leaving)}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EditorContext.Provider>
  );
}

const SINGLE_SECTIONS = [
  { id: "header", label: "En-tête" },
  { id: "contact", label: "Coordonnées" },
];

// Status in the table of contents: a check mark for a filled single section, the number of items
// of a list, a dash for an empty section.
function sectionStatus(content: ProfileContent, id: string): number | boolean {
  switch (id) {
    case "header":
      return !!(content.photoUrl || content.firstName || content.lastName || content.headline || content.location);
    case "contact":
      return !!(content.contactEmail || content.phone || content.links.length);
    case "about":
    case "freelance":
      return isSectionFilled(content, id);
    default:
      return content[id as ListName].length;
  }
}

function TableOfContents({
  content,
  handle,
  onOrderChange,
}: {
  content: ProfileContent;
  handle: string;
  onOrderChange: (order: SectionId[]) => void;
}) {
  const [active, setActive] = useState("header");
  const [ordering, setOrdering] = useState(false);
  const entries = [...SINGLE_SECTIONS, ...content.sectionOrder.map((id) => ({ id, label: SECTION_LABELS[id] }))];

  // The section in view is marked in the table of contents.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id.replace("section-", ""));
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );
    for (const section of document.querySelectorAll("section[id^=section-]")) observer.observe(section);
    return () => observer.disconnect();
  }, [content.sectionOrder]);

  const path = publicProfilePath(handle);

  return (
    <nav aria-label="Sections du profil" className="sticky top-14 hidden w-[220px] shrink-0 flex-col gap-0.5 self-start lg:flex">
      <p className="eyebrow mb-2.5 ml-2.5 text-muted-foreground">Sections</p>
      {entries.map(({ id, label }) => {
        const status = sectionStatus(content, id);
        return (
          <a
            key={id}
            href={`#section-${id}`}
            onClick={() => setActive(id)}
            aria-current={active === id ? "location" : undefined}
            className={cn(
              "flex h-[34px] items-center gap-2.5 px-2.5 text-sm transition-colors",
              active === id
                ? "bg-sidebar-accent shadow-[inset_2px_0_0_var(--primary)]"
                : "hover:bg-sidebar-accent/60",
              status === 0 || status === false ? "text-muted-foreground" : "text-foreground",
            )}
          >
            <span className="flex-1 truncate">{label}</span>
            {status === true ? (
              <CheckIcon aria-label="Remplie" className="size-3.5 text-success" />
            ) : typeof status === "number" && status > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">{status}</span>
            ) : (
              <span aria-label="Vide" className="text-muted-foreground">
                —
              </span>
            )}
          </a>
        );
      })}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-3.5 self-start"
        aria-expanded={ordering}
        aria-controls="section-order"
        onClick={() => setOrdering((current) => !current)}
      >
        <GripVerticalIcon data-icon="inline-start" />
        Ordre des sections
      </Button>
      {ordering && (
        <SectionOrder id="section-order" order={content.sectionOrder} onChange={onOrderChange} />
      )}
      <a
        href={path}
        target="_blank"
        rel="noopener"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1.5 self-start")}
      >
        Voir mon profil public
        <ExternalLinkIcon data-icon="inline-end" />
      </a>

      <p className="eyebrow mt-8 mb-2.5 ml-2.5 text-muted-foreground">CV</p>
      <a
        href={`${path}/cv`}
        target="_blank"
        rel="noopener"
        className="flex h-[34px] items-center gap-2.5 px-2.5 text-sm transition-colors hover:bg-sidebar-accent/60"
      >
        <EyeIcon className="size-4 text-muted-foreground" />
        Aperçu du CV
      </a>
      <a
        href={`${path}/cv/pdf`}
        download
        className="flex h-[34px] items-center gap-2.5 px-2.5 text-sm transition-colors hover:bg-sidebar-accent/60"
      >
        <DownloadIcon className="size-4 text-muted-foreground" />
        Télécharger en PDF
      </a>
      <a
        href="/app/profile/cv/png"
        download
        className="flex h-[34px] items-center gap-2.5 px-2.5 text-sm transition-colors hover:bg-sidebar-accent/60"
      >
        <DownloadIcon className="size-4 text-muted-foreground" />
        Télécharger en PNG
      </a>
      <p className="mt-1 px-2.5 text-xs text-muted-foreground">Le CV reprend le profil enregistré.</p>
    </nav>
  );
}

// "Ordre des sections", under the table of contents: the sections below the header, dragged and
// dropped. The header and the contact details stay at the top.
function SectionOrder({ id, order, onChange }: { id: string; order: SectionId[]; onChange: (order: SectionId[]) => void }) {
  return (
    <div id={id} className="mt-2 flex flex-col gap-2">
      <p className="px-2.5 text-xs text-muted-foreground">
        Sur la page publique, l&apos;ordre s&apos;applique dans chaque colonne.
      </p>
      <SortableList
        items={order.map((section) => ({ id: section }))}
        itemLabel={(item) => SECTION_LABELS[item.id]}
        onReorder={(sorted) => onChange(sorted.map((item) => item.id))}
        className="gap-1"
      >
        {(item, handle) => (
          <div className="flex items-center gap-1 border border-border bg-card pr-2 text-sm">
            {handle}
            {SECTION_LABELS[item.id]}
          </div>
        )}
      </SortableList>
    </div>
  );
}
