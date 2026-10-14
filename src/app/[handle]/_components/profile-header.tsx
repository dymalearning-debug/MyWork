import { DownloadIcon, MapPinIcon } from "lucide-react";

import { ProfilePhoto } from "@/components/profile-photo";
import { StatusDot } from "@/components/status-dot";
import { buttonVariants } from "@/components/ui/button";
import { availabilityText, profileDisplayName, profileInitials } from "@/lib/profile/content";
import { WORK_MODE_LABELS } from "@/lib/profile/types";
import { publicProfilePath } from "@/lib/public-profile/handle";
import type { PublicProfile } from "@/lib/public-profile/data";
import { cn } from "@/lib/utils";

import { ContactButton } from "./contact-button";
import { ShareButton } from "./share-button";

// Header of the public page (docs/public-profile.md, "Page publique", and docs/profile.md,
// "En-tête"): the photo, the professional title as a label, the name, the location, the work modes
// and the availability; the buttons; the tabs of the modules.
export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const name = profileDisplayName(profile);
  const availability = availabilityText(profile);
  const workModes = profile.isFreelance ? profile.workModes.map((mode) => WORK_MODE_LABELS[mode]) : [];
  const path = publicProfilePath(profile.handle);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-8 gap-y-6">
        <ProfilePhoto
          url={profile.photoUrl}
          initials={profileInitials(profile)}
          className="size-24 text-3xl sm:size-32 sm:text-[2.75rem]"
        />
        <div className="min-w-0 flex-[1_1_420px]">
          {profile.headline && <p className="eyebrow text-muted-foreground">{profile.headline}</p>}
          <h1 className="mt-2 font-heading text-[clamp(2.5rem,8vw,4.5rem)] leading-none font-medium break-words">
            {name}
          </h1>
          {(profile.location || workModes.length > 0 || availability) && (
            <ul className="eyebrow mt-4 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
              {profile.location && (
                <li className="flex items-center gap-1.5">
                  <MapPinIcon aria-hidden className="size-3.5" />
                  {profile.location}
                </li>
              )}
              {workModes.length > 0 && <li>{workModes.join(" · ")}</li>}
              {availability && (
                <li className={cn("flex items-center gap-2", availability.available ? "text-success" : "text-muted-foreground")}>
                  <StatusDot tone={availability.available ? "success" : "muted"} />
                  {availability.text}
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* With the Rendez-vous module, the red button will become "Prendre rendez-vous". */}
          {profile.hasContact && <ContactButton handle={profile.handle} />}
          <a href={`${path}/cv/pdf`} download className={buttonVariants({ variant: "outline", size: "lg" })}>
            <DownloadIcon data-icon="inline-start" />
            Télécharger le CV
          </a>
          <ShareButton title={name} />
        </div>
      </div>

      <nav aria-label="Onglets du profil" className="-mb-px mt-12 flex gap-8 overflow-x-auto">
        <a
          href={path}
          aria-current="page"
          className="py-3.5 text-sm whitespace-nowrap text-foreground shadow-[inset_0_-2px_0_var(--primary)]"
        >
          Profil
        </a>
      </nav>
    </div>
  );
}
