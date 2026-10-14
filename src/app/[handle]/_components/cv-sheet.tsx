import { ProfilePhoto } from "@/components/profile-photo";
import { availabilityText, formatDailyRate, isSectionFilled, profileDisplayName, profileInitials } from "@/lib/profile/content";
import { formatPeriod, formatPeriodWithDuration, formatYearMonth } from "@/lib/profile/dates";
import { linkText, shortUrl } from "@/lib/profile/links";
import { isExpired, sortCertifications, sortEducations, sortExperiences } from "@/lib/profile/ordering";
import {
  EMPLOYMENT_TYPE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  RIGHT_COLUMN_SECTIONS,
  SECTION_LABELS,
  WORK_MODE_LABELS,
  type SectionId,
  type StoredProfile,
} from "@/lib/profile/types";
import type { ProfileContact } from "@/lib/public-profile/data";

// The CV (docs/profile.md, "Export du CV"): a sober A4 layout, always in the light theme, on one
// page or more. It is the preview in "Mon profil" and the model of the PDF and the PNG, so the
// export is what the preview shows. The content of the public page, without the project images
// nor the recommendations; the email and the phone in full, since it is a CV.

// Sections of the CV: the recommendations stay on the public page.
const CV_SECTIONS: SectionId[] = [
  "about",
  "freelance",
  "experiences",
  "projects",
  "educations",
  "certifications",
  "skills",
  "languages",
];

export function CvSheet({
  profile,
  contact,
  publicAddress,
}: {
  profile: StoredProfile;
  contact: ProfileContact | null;
  // The address of the public profile, in the footer, when it is online.
  publicAddress: string | null;
}) {
  const sections = profile.sectionOrder.filter((id) => CV_SECTIONS.includes(id) && isSectionFilled(profile, id));
  const main = sections.filter((id) => !RIGHT_COLUMN_SECTIONS.includes(id));
  const side = sections.filter((id) => RIGHT_COLUMN_SECTIONS.includes(id));
  const contactLines = [contact?.email, contact?.phone, profile.location].filter((line): line is string => !!line);

  return (
    <article
      data-cv-sheet
      className="mx-auto flex min-h-[297mm] w-[210mm] flex-col bg-background px-[16mm] py-[14mm] text-[9.5pt] leading-[1.45] text-foreground print:min-h-0 print:w-auto print:p-0"
    >
      <header className="flex items-start gap-[6mm] border-b border-foreground pb-[5mm]">
        <div className="min-w-0 flex-1">
          {profile.headline && <p className="eyebrow text-[7pt] text-muted-foreground">{profile.headline}</p>}
          <h1 className="mt-[1.5mm] font-heading text-[26pt] leading-none font-medium">{profileDisplayName(profile)}</h1>
          {contactLines.length > 0 && (
            <p className="mt-[3mm] flex flex-wrap gap-x-[4mm] text-muted-foreground tabular-nums">
              {contactLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
          )}
        </div>
        {profile.photoUrl && (
          <ProfilePhoto url={profile.photoUrl} initials={profileInitials(profile)} className="size-[26mm]" />
        )}
      </header>

      <div className="mt-[6mm] grid flex-1 grid-cols-[minmax(0,1fr)_52mm] gap-[8mm]">
        <div className="flex min-w-0 flex-col gap-[6mm]">
          {main.map((id) => (
            <CvSection key={id} id={id} profile={profile} />
          ))}
        </div>
        <aside className="flex min-w-0 flex-col gap-[6mm]">
          {side.map((id) => (
            <CvSection key={id} id={id} profile={profile} />
          ))}
          {profile.links.length > 0 && (
            <SideBlock title="Liens">
              {profile.links.map((link) => (
                <p key={link.id} className="break-words">
                  <span className="font-medium">{linkText(link)}</span>
                  <br />
                  <span className="text-muted-foreground">{shortUrl(link.url)}</span>
                </p>
              ))}
            </SideBlock>
          )}
        </aside>
      </div>

      {publicAddress && (
        <footer className="mt-[8mm] flex justify-between border-t border-border pt-[3mm] text-[7.5pt] text-muted-foreground">
          <span>Profil en ligne : {publicAddress}</span>
          <span>MyWork</span>
        </footer>
      )}
    </article>
  );
}

function CvSection({ id, profile }: { id: SectionId; profile: StoredProfile }) {
  switch (id) {
    case "about": {
      const featured = profile.skills.filter((skill) => skill.featured).map((skill) => skill.name);
      return (
        <MainBlock title={SECTION_LABELS.about}>
          {profile.about && <p className="whitespace-pre-line">{profile.about}</p>}
          {featured.length > 0 && <p className="mt-[2mm] font-medium">{featured.join(" · ")}</p>}
        </MainBlock>
      );
    }
    case "experiences":
      return (
        <MainBlock title={SECTION_LABELS.experiences}>
          {sortExperiences(profile.experiences).map((experience) => {
            const details = [
              experience.company,
              experience.employmentType && EMPLOYMENT_TYPE_LABELS[experience.employmentType],
              [experience.workMode && WORK_MODE_LABELS[experience.workMode], experience.location].filter(Boolean).join(", "),
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <Entry
                key={experience.id}
                title={experience.title}
                details={details}
                date={formatPeriodWithDuration(experience)}
                text={experience.description}
                skills={experience.skills}
              />
            );
          })}
        </MainBlock>
      );
    case "projects":
      return (
        <MainBlock title={SECTION_LABELS.projects}>
          {profile.projects.map((project) => {
            const experience = profile.experiences.find((item) => item.id === project.experienceId);
            const client = experience?.company || experience?.title;
            return (
              <Entry
                key={project.id}
                title={project.name}
                details={[client && `Mission pour ${client}`, project.url && shortUrl(project.url)].filter(Boolean).join(" · ")}
                date={formatPeriod(project, { ongoing: "en cours" })}
                text={project.description}
                skills={project.skills}
              />
            );
          })}
        </MainBlock>
      );
    case "educations":
      return (
        <MainBlock title={SECTION_LABELS.educations}>
          {sortEducations(profile.educations).map((education) => (
            <Entry
              key={education.id}
              title={education.school}
              details={[education.degree, education.field].filter(Boolean).join(", ")}
              date={formatPeriod(education, { ongoing: "en cours" })}
              text={education.description}
            />
          ))}
        </MainBlock>
      );
    case "certifications":
      return (
        <MainBlock title={SECTION_LABELS.certifications}>
          {sortCertifications(profile.certifications).map((certification) => (
            <Entry
              key={certification.id}
              title={certification.name}
              details={[
                certification.issuer,
                certification.credentialId && `ID ${certification.credentialId}`,
                certification.expires &&
                  `${isExpired(certification) ? "Expirée" : "Expire"} en ${formatYearMonth(certification.expires, { long: true })}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              date={certification.issued ? formatYearMonth(certification.issued) : ""}
            />
          ))}
        </MainBlock>
      );
    case "freelance": {
      const availability = availabilityText(profile);
      return (
        <SideBlock title={SECTION_LABELS.freelance}>
          {profile.dailyRate !== null && <p className="font-medium tabular-nums">{formatDailyRate(profile.dailyRate)}</p>}
          {availability && <p>{availability.text}</p>}
          {profile.workModes.length > 0 && <p>{profile.workModes.map((mode) => WORK_MODE_LABELS[mode]).join(", ")}</p>}
          {profile.travelZone && <p className="text-muted-foreground">{profile.travelZone}</p>}
          {profile.services.map((service) => (
            <p key={service.id} className="break-inside-avoid">
              <span className="font-medium">{service.name}</span>
              {service.description && (
                <>
                  <br />
                  <span className="text-muted-foreground">{service.description}</span>
                </>
              )}
            </p>
          ))}
        </SideBlock>
      );
    }
    case "skills":
      return (
        <SideBlock title={SECTION_LABELS.skills}>
          <p>{profile.skills.map((skill) => skill.name).join(" · ")}</p>
        </SideBlock>
      );
    case "languages":
      return (
        <SideBlock title={SECTION_LABELS.languages}>
          {profile.languages.map((language) => (
            <p key={language.id}>
              {language.name}
              {language.level && <span className="text-muted-foreground"> · {LANGUAGE_LEVEL_LABELS[language.level]}</span>}
            </p>
          ))}
        </SideBlock>
      );
    default:
      return null;
  }
}

function MainBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-[2.5mm] border-b border-border pb-[1mm] font-heading text-[13pt] font-semibold break-after-avoid">
        {title}
      </h2>
      <div className="flex flex-col gap-[3mm]">{children}</div>
    </section>
  );
}

function SideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="eyebrow mb-[2mm] text-[7pt] text-muted-foreground">{title}</h2>
      <div className="flex flex-col gap-[1.5mm]">{children}</div>
    </section>
  );
}

function Entry({
  title,
  details,
  date,
  text,
  skills = [],
}: {
  title: string;
  details?: string;
  date?: string;
  text?: string;
  skills?: string[];
}) {
  return (
    <div className="break-inside-avoid">
      <div className="flex items-baseline justify-between gap-[4mm]">
        <p className="font-semibold">{title}</p>
        {date && <p className="shrink-0 text-[8pt] text-muted-foreground tabular-nums">{date}</p>}
      </div>
      {details && <p className="text-muted-foreground">{details}</p>}
      {text && <p className="mt-[1mm] whitespace-pre-line">{text}</p>}
      {skills.length > 0 && <p className="mt-[1mm] text-[8pt] text-muted-foreground">{skills.join(" · ")}</p>}
    </div>
  );
}
