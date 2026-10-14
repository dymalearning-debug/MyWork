"use client";

import { ArrowUpRightIcon } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { shortUrl } from "@/lib/profile/links";
import type { Project } from "@/lib/profile/types";

// A project on the public page: a card (cover, name, mission), which opens the whole project with
// all its images (docs/profile.md, "Projets").
export function ProjectCard({ project, period, mission }: { project: Project; period: string; mission: string }) {
  const [cover] = project.images;
  const subtitle = [mission, period].filter(Boolean).join(" · ");
  return (
    <Dialog>
      <DialogTrigger
        className="group flex flex-col border border-border text-left transition-colors outline-none hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label={`Voir le projet ${project.name}`}
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="aspect-[4/3] w-full bg-muted object-cover" />
        ) : (
          <span aria-hidden className="flex aspect-[4/3] w-full items-center justify-center bg-muted bg-spotlight">
            <span className="font-heading text-3xl text-muted-foreground">{project.name.charAt(0)}</span>
          </span>
        )}
        <span className="flex flex-col gap-0.5 p-4">
          <span className="font-medium">{project.name}</span>
          {subtitle && <span className="text-sm text-muted-foreground">{subtitle}</span>}
        </span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto sm:max-w-3xl">
        <div className="flex flex-col gap-1.5 pr-8">
          {subtitle && <p className="eyebrow text-muted-foreground">{subtitle}</p>}
          <DialogTitle className="font-heading text-3xl font-medium">{project.name}</DialogTitle>
        </div>
        {project.description ? (
          <DialogDescription className="text-base whitespace-pre-line text-foreground">{project.description}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">Détail du projet {project.name}</DialogDescription>
        )}
        {project.skills.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {project.skills.map((skill) => (
              <li key={skill} className="eyebrow inline-flex h-7 items-center border border-border px-2.5">
                {skill}
              </li>
            ))}
          </ul>
        )}
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 self-start text-sm underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
            {shortUrl(project.url)}
            <ArrowUpRightIcon aria-hidden className="size-3.5" />
          </a>
        )}
        {project.images.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={url} src={url} alt={`${project.name}, image ${index + 1}`} className="w-full border border-border" />
        ))}
      </DialogContent>
    </Dialog>
  );
}
