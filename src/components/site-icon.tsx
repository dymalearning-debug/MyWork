import { GlobeIcon } from "lucide-react";
import {
  siBehance,
  siBluesky,
  siDribbble,
  siFacebook,
  siFigma,
  siGithub,
  siGitlab,
  siInstagram,
  siMalt,
  siMastodon,
  siMedium,
  siStackoverflow,
  siSubstack,
  siThreads,
  siTiktok,
  siVimeo,
  siX,
  siYoutube,
} from "simple-icons";

import { siteOf } from "@/lib/profile/links";
import { cn } from "@/lib/utils";

// Icon of a link of the profile, recognized from its address (src/lib/profile/links.ts). Brand
// logos from Simple Icons, in the color of the text; LinkedIn, no longer in Simple Icons, is drawn
// here. A globe for any other site.

// LinkedIn "in" logo, 24 × 24.
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";

const PATHS: Record<string, string> = {
  linkedin: LINKEDIN_PATH,
  github: siGithub.path,
  gitlab: siGitlab.path,
  malt: siMalt.path,
  x: siX.path,
  instagram: siInstagram.path,
  behance: siBehance.path,
  dribbble: siDribbble.path,
  youtube: siYoutube.path,
  vimeo: siVimeo.path,
  figma: siFigma.path,
  medium: siMedium.path,
  substack: siSubstack.path,
  bluesky: siBluesky.path,
  mastodon: siMastodon.path,
  threads: siThreads.path,
  facebook: siFacebook.path,
  tiktok: siTiktok.path,
  stackoverflow: siStackoverflow.path,
};

export function SiteIcon({ url, className }: { url: string; className?: string }) {
  const path = PATHS[siteOf(url).key];
  if (!path) return <GlobeIcon aria-hidden className={cn("size-4 shrink-0", className)} />;
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className={cn("size-4 shrink-0", className)}>
      <path d={path} />
    </svg>
  );
}
