import { ArrowUpRightIcon } from "lucide-react";

import { SiteIcon } from "@/components/site-icon";
import { availabilityText, isSectionFilled } from "@/lib/profile/content";
import { formatDuration, formatPeriod, formatPeriodWithDuration, formatYearMonth } from "@/lib/profile/dates";
import { linkText } from "@/lib/profile/links";
import { groupExperiences, isExpired, sortCertifications, sortEducations, sortExperiences } from "@/lib/profile/ordering";
import {
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  RIGHT_COLUMN_SECTIONS,
  SECTION_LABELS,
  WORK_MODE_LABELS,
  type Experience,
  type ProfileContent,
  type SectionId,
} from "@/lib/profile/types";
import { cn } from "@/lib/utils";

import { ProjectCard } from "./project-card";

// "Profil" tab of the public page (docs/profile.md, "Page publique"), board "1 · Classique": the
// sections that are filled, in two columns on a computer (the career at the left, boxes at the
// right), in the order chosen. On mobile, one column, in the same order.

export function ProfileTab({ profile }: { profile: ProfileContent }) {
  const sections = profile.sectionOrder.filter((id) => isSectionFilled(profile, id));
  const left = sections.filter((id) => !RIGHT_COLUMN_SECTIONS.includes(id));
  const right = sections.filter((id) => RIGHT_COLUMN_SECTIONS.includes(id));
  // On mobile, the two columns vanish (display: contents) and their sections follow the order chosen.
  const order = (id: SectionId) => ({ order: profile.sectionOrder.indexOf(id) });

  if (sections.length === 0 && profile.links.length === 0) {
    return <p className="text-sm text-muted-foreground">Ce profil est encore vide.</p>;
  }

  return (
    <div className="flex flex-col gap-14 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
      <div className="contents lg:flex lg:flex-col lg:gap-16">
        {left.map((id) => (
          <div key={id} style={order(id)}>
            <Section id={id} profile={profile} />
          </div>
        ))}
      </div>
      <div className="contents lg:flex lg:flex-col lg:gap-6">
        {right.map((id) => (
          <div key={id} style={order(id)}>
            <Section id={id} profile={profile} />
          </div>
        ))}
        {profile.links.length > 0 && (
          <div style={{ order: 100 }}>
            <LinksBox profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ id, profile }: { id: SectionId; profile: ProfileContent }) {
  switch (id) {
    case "about":
      return <About profile={profile} />;
    case "freelance":
      return <FreelanceBox profile={profile} />;
    case "experiences":
      return <Experiences profile={profile} />;
    case "projects":
      return <Projects profile={profile} />;
    case "educations":
      return <Educations profile={profile} />;
    case "certifications":
      return <Certifications profile={profile} />;
    case "skills":
      return <SkillsBox profile={profile} />;
    case "languages":
      return <LanguagesBox profile={profile} />;
    case "recommendations":
      return <Recommendations profile={profile} />;
  }
}

// ——— Left column ———

function MainSection({ id, children }: { id: SectionId; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`profile-${id}`}>
      <h2 id={`profile-${id}`} className="mb-6 font-heading text-[1.75rem] leading-9 font-medium">
        {SECTION_LABELS[id]}
      </h2>
      {children}
    </section>
  );
}

function Chips({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item} className="eyebrow inline-flex h-7 items-center border border-border px-2.5 text-[0.625rem]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function About({ profile }: { profile: ProfileContent }) {
  const featured = profile.skills.filter((skill) => skill.featured).map((skill) => skill.name);
  return (
    <MainSection id="about">
      {profile.about && <p className="text-lg leading-[30px] whitespace-pre-line">{profile.about}</p>}
      {featured.length > 0 && <Chips items={featured} className="mt-6" />}
    </MainSection>
  );
}

// "Freelance · Hybride, Lyon"
function experienceDetails(experience: Experience) {
  const where = [experience.workMode && WORK_MODE_LABELS[experience.workMode], experience.location]
    .filter(Boolean)
    .join(", ");
  return [experience.employmentType && EMPLOYMENT_TYPE_LABELS[experience.employmentType], where].filter(Boolean).join(" · ");
}

function Experiences({ profile }: { profile: ProfileContent }) {
  const groups = groupExperiences(sortExperiences(profile.experiences));
  return (
    <MainSection id="experiences">
      <ol className="border-l border-border">
        {groups.map((group) => {
          const [first] = group.experiences;
          if (!group.company) {
            const details = [first.company, experienceDetails(first)].filter(Boolean).join(" · ");
            return (
              <li key={first.id} className="relative pb-8 pl-7 last:pb-0">
                <span aria-hidden className="absolute top-[7px] -left-[5px] size-[9px] border border-foreground bg-background" />
                <p className="eyebrow text-muted-foreground tabular-nums">{formatPeriodWithDuration(first)}</p>
                <h3 className="mt-1 font-heading text-[1.375rem] leading-7 font-semibold">{first.title}</h3>
                {details && <p className="mt-0.5 text-sm text-muted-foreground">{details}</p>}
                <ExperienceBody experience={first} />
              </li>
            );
          }
          // Several positions in a row at the same company, grouped under it.
          const last = group.experiences[group.experiences.length - 1];
          const span = formatPeriod({ start: last.start, end: first.end, isCurrent: first.isCurrent });
          return (
            <li key={first.id} className="relative pb-8 pl-7 last:pb-0">
              <span aria-hidden className="absolute top-[7px] -left-[5px] size-[9px] border border-foreground bg-foreground" />
              <p className="eyebrow text-muted-foreground tabular-nums">
                {span}
                {group.months && ` · ${formatDuration(group.months)}`}
              </p>
              <h3 className="mt-1 font-heading text-[1.375rem] leading-7 font-semibold">{group.company}</h3>
              <ol className="mt-3 flex flex-col gap-4 border-l border-border pl-4">
                {group.experiences.map((experience) => (
                  <li key={experience.id}>
                    <p className="text-sm font-medium">{experience.title}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {[formatPeriodWithDuration(experience), experienceDetails(experience)].filter(Boolean).join(" · ")}
                    </p>
                    <ExperienceBody experience={experience} />
                  </li>
                ))}
              </ol>
            </li>
          );
        })}
      </ol>
    </MainSection>
  );
}

function ExperienceBody({ experience }: { experience: Experience }) {
  return (
    <>
      {experience.description && <p className="mt-2.5 text-sm whitespace-pre-line">{experience.description}</p>}
      {experience.skills.length > 0 && <Chips items={experience.skills} className="mt-3 gap-1.5" />}
    </>
  );
}

function Projects({ profile }: { profile: ProfileContent }) {
  return (
    <MainSection id="projects">
      <div className="grid gap-6 sm:grid-cols-2">
        {profile.projects.map((project) => {
          const experience = profile.experiences.find((item) => item.id === project.experienceId);
          const client = experience?.company || experience?.title;
          return (
            <ProjectCard
              key={project.id}
              project={project}
              period={formatPeriod(project, { ongoing: "en cours" })}
              mission={client ? `Mission pour ${client}` : ""}
            />
          );
        })}
      </div>
    </MainSection>
  );
}

// A line of the education and certifications lists: the name at the left, the date at the right.
function DatedRow({ title, details, date }: { title: React.ReactNode; details?: React.ReactNode; date?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-5 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {details && <div className="text-sm text-muted-foreground">{details}</div>}
      </div>
      {date && <p className="shrink-0 text-sm text-muted-foreground tabular-nums">{date}</p>}
    </div>
  );
}

function Educations({ profile }: { profile: ProfileContent }) {
  return (
    <MainSection id="educations">
      <div className="flex flex-col gap-5">
        {sortEducations(profile.educations).map((education) => (
          <DatedRow
            key={education.id}
            title={education.school}
            details={
              <>
                {[education.degree, education.field].filter(Boolean).join(", ")}
                {education.description && <p className="mt-1.5 whitespace-pre-line text-foreground">{education.description}</p>}
              </>
            }
            date={formatPeriod(education, { ongoing: "en cours" })}
          />
        ))}
      </div>
    </MainSection>
  );
}

function Certifications({ profile }: { profile: ProfileContent }) {
  return (
    <MainSection id="certifications">
      <div className="flex flex-col gap-5">
        {sortCertifications(profile.certifications).map((certification) => (
          <DatedRow
            key={certification.id}
            title={certification.name}
            details={
              (certification.issuer || certification.credentialId || certification.verificationUrl || certification.expires) && (
                <p className="flex flex-wrap gap-x-1.5">
                  {[certification.issuer, certification.credentialId && `ID ${certification.credentialId}`]
                    .filter(Boolean)
                    .join(" · ")}
                  {certification.expires && (
                    <span className={cn(isExpired(certification) && "text-warning")}>
                      {certification.issuer || certification.credentialId ? "· " : ""}
                      {isExpired(certification) ? "Expirée" : "Expire"} en {formatYearMonth(certification.expires, { long: true })}
                    </span>
                  )}
                  {certification.verificationUrl && (
                    <a
                      href={certification.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                    >
                      Vérifier
                    </a>
                  )}
                </p>
              )
            }
            date={certification.issued ? formatYearMonth(certification.issued) : undefined}
          />
        ))}
      </div>
    </MainSection>
  );
}

function Recommendations({ profile }: { profile: ProfileContent }) {
  return (
    <MainSection id="recommendations">
      <div className="flex flex-col gap-10">
        {profile.recommendations.map((recommendation) => {
          const role = [recommendation.authorRole, recommendation.authorCompany].filter(Boolean).join(", ");
          return (
            <figure key={recommendation.id} className="border-t border-foreground pt-6">
              <blockquote className="font-heading text-[1.375rem] leading-8 whitespace-pre-line">
                « {recommendation.text} »
              </blockquote>
              <figcaption className="mt-3.5 text-sm text-muted-foreground">
                {recommendation.authorUrl ? (
                  <a
                    href={recommendation.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
                  >
                    {recommendation.author}
                  </a>
                ) : (
                  <span className="text-foreground">{recommendation.author}</span>
                )}
                {role && ` · ${role}`}
                {recommendation.date && ` · ${formatYearMonth(recommendation.date)}`}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </MainSection>
  );
}

// ——— Right column: boxes ———

function Box({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`profile-${id}`} className="flex flex-col gap-4 border border-border p-6">
      <h2 id={`profile-${id}`} className="eyebrow text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function BoxRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={cn("text-right", className)}>{children}</span>
    </div>
  );
}

function FreelanceBox({ profile }: { profile: ProfileContent }) {
  const availability = availabilityText(profile);
  return (
    <Box id="freelance" title={SECTION_LABELS.freelance}>
      {profile.dailyRate !== null && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">TJM</span>
          <span className="font-heading text-[1.75rem] tabular-nums">
            {profile.dailyRate.toLocaleString("fr-FR")} €{" "}
            <span className="font-sans text-sm text-muted-foreground">HT / jour</span>
          </span>
        </div>
      )}
      {availability && (
        <BoxRow label="Disponibilité" className={availability.available ? "text-success" : undefined}>
          {availability.text}
        </BoxRow>
      )}
      {profile.workModes.length > 0 && (
        <BoxRow label="Mode">{profile.workModes.map((mode) => WORK_MODE_LABELS[mode]).join(", ")}</BoxRow>
      )}
      {profile.travelZone && <BoxRow label="Zone">{profile.travelZone}</BoxRow>}
      {profile.services.length > 0 && (
        <ul
          className={cn(
            "flex flex-col gap-3",
            (profile.dailyRate !== null || availability || profile.workModes.length > 0 || profile.travelZone) &&
              "border-t border-border pt-4",
          )}
        >
          {profile.services.map((service) => (
            <li key={service.id} className="text-sm">
              <p className="font-medium">{service.name}</p>
              {service.description && <p className="whitespace-pre-line text-muted-foreground">{service.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </Box>
  );
}

function SkillsBox({ profile }: { profile: ProfileContent }) {
  return (
    <Box id="skills" title={SECTION_LABELS.skills}>
      <Chips items={profile.skills.map((skill) => skill.name)} className="gap-1.5" />
    </Box>
  );
}

function LanguagesBox({ profile }: { profile: ProfileContent }) {
  return (
    <Box id="languages" title={SECTION_LABELS.languages}>
      {profile.languages.map((language) => (
        <div key={language.id} className="flex justify-between gap-3 text-sm">
          <span>{language.name}</span>
          {language.level && <span className="text-muted-foreground">{LANGUAGE_LEVEL_LABELS[language.level]}</span>}
        </div>
      ))}
    </Box>
  );
}

function LinksBox({ profile }: { profile: ProfileContent }) {
  return (
    <Box id="links" title="Liens">
      {profile.links.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer me"
          className="group flex items-center gap-2.5 text-sm"
        >
          <SiteIcon url={link.url} className="text-muted-foreground group-hover:text-foreground" />
          <span className="flex-1 underline decoration-transparent underline-offset-4 group-hover:decoration-foreground/40">
            {linkText(link)}
          </span>
          <ArrowUpRightIcon aria-hidden className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </a>
      ))}
    </Box>
  );
}
