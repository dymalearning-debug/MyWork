import Link from "next/link";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

// Template of the authentication pages, direction "Plaquette" (docs/auth.md, "Interface"):
// red square, eyebrow, serif title and a short sentence, then a card with a thin rule.

export function AuthHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <Logo variant="mark" className="size-10" />
      <div className="flex flex-col gap-2">
        <p className="eyebrow text-muted-foreground">{eyebrow}</p>
        <h1 className="font-heading text-4xl leading-tight font-medium sm:text-5xl">{title}</h1>
        {children && <p className="text-sm text-muted-foreground">{children}</p>}
      </div>
    </div>
  );
}

export function AuthCard({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("flex flex-col gap-6 border border-border bg-card p-6 sm:p-8", className)} {...props} />;
}

export function AuthFooter({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-sm text-muted-foreground">{children}</p>;
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:decoration-foreground"
    >
      {children}
    </Link>
  );
}

export function OrSeparator() {
  return (
    <div className="flex items-center gap-4" role="separator" aria-label="ou">
      <span className="h-px flex-1 bg-border" />
      <span className="eyebrow text-muted-foreground" aria-hidden="true">
        ou
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
