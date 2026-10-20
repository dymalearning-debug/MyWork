import { EyeOffIcon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";

// Layout of the public pages (docs/public-profile.md, "Page publique"): distinct from the private
// space, mobile first, in a column of 1080 px at most. A header under the studio light, the content,
// then the "Créé avec MyWork" footer. Also used by the "Page introuvable" pages.

const COLUMN = "mx-auto w-full max-w-[1080px] px-[clamp(1.25rem,5vw,3rem)]";

export function PublicPage({
  banner,
  header,
  children,
}: {
  banner?: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      {banner}
      <header className="border-b border-border bg-spotlight">
        <div className={`${COLUMN} pt-[clamp(2.5rem,7vw,5rem)]`}>{header}</div>
      </header>
      <main className={`${COLUMN} flex-1 pt-12 pb-16`}>{children}</main>
      <footer className="border-t border-border">
        <div className={`${COLUMN} flex items-center gap-2 pt-6 pb-8 text-xs text-muted-foreground`}>
          {/* Each shared profile leads its visitors to the landing page (docs/landing.md). */}
          <Link href="/" className="inline-flex items-center gap-2 transition-colors hover:text-foreground">
            <span>Créé avec</span>
            <Logo className="h-4 text-foreground" />
          </Link>
        </div>
      </footer>
    </div>
  );
}

// Label and title of the header: until the modules bring the photo, the name and the tabs.
export function PublicPageHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col gap-2.5 pb-12">
      <p className="eyebrow text-muted-foreground">{eyebrow}</p>
      <h1 className="font-heading text-[clamp(2.5rem,8vw,4.5rem)] leading-none font-medium">{title}</h1>
    </div>
  );
}

// Shown to the owner only, on their offline profile: an ink band at the top of the page.
export function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-foreground px-5 py-2.5 text-center text-background"
    >
      <span className="inline-flex items-center gap-2">
        <EyeOffIcon aria-hidden className="size-3.5" />
        <span className="eyebrow">Hors ligne</span>
      </span>
      <span className="text-[0.8125rem] leading-5">Vous seul voyez cette page.</span>
    </div>
  );
}

// "Page introuvable": the same page for an unknown handle and an offline profile, and, with a more
// general sentence, for any other unknown address.
export function NotFoundPage({ kind }: { kind: "profile" | "page" }) {
  const target = kind === "profile" ? "aucun profil public" : "aucune page";
  return (
    <PublicPage header={<PublicPageHeading eyebrow="Erreur 404" title="Page introuvable" />}>
      <p className="max-w-[480px] text-sm leading-[22px] text-muted-foreground">
        Cette adresse ne correspond à {target}. Vérifiez le lien, ou demandez-le à la personne qui vous
        l&apos;a envoyé.
      </p>
    </PublicPage>
  );
}

export const NOT_FOUND_TITLE = "Page introuvable · MyWork";
