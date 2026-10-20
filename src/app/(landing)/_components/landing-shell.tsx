import Link from "next/link";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

import { HeaderActions } from "./header-actions";
import { LANDING_SECTIONS } from "./sections";

// Frame of the landing page (docs/landing.md): a header that stays at the top while scrolling,
// the blocks, then the footer. Wider column than the public profiles.

export const LANDING_COLUMN = "mx-auto w-full max-w-[1200px] px-[clamp(1.25rem,5vw,3rem)]";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className={`${LANDING_COLUMN} flex h-16 items-center gap-8`}>
        <Link href="/" aria-label="MyWork, haut de la page" className="inline-flex shrink-0">
          <Logo className="h-6" />
        </Link>
        <nav aria-label="Sections de la page" className="flex items-center gap-6 max-md:hidden">
          {LANDING_SECTIONS.filter((section) => section.nav).map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div
        className={`${LANDING_COLUMN} flex flex-wrap items-center gap-x-6 gap-y-4 pt-8 pb-10 text-xs text-muted-foreground`}
      >
        <Logo className="h-5 text-foreground" />
        <span className="tabular-nums">© 2026 MyWork</span>
        {/* Legal pages, contact and YouTube channel come with their own blocks (docs/landing.md). */}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
