import { cn } from "@/lib/utils"

export function Section({
  id,
  index,
  title,
  description,
  children,
}: {
  id: string
  index: string
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-baseline gap-4 border-b border-border pb-4">
        <span className="eyebrow text-primary">{index}</span>
        <h2 className="font-heading text-4xl font-medium">{title}</h2>
      </div>
      {description && <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>}
      <div className="mt-10 space-y-12">{children}</div>
    </section>
  )
}

/** One row of the showcase: a small label on the left, examples on the right. */
export function Specimen({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4 md:grid-cols-[180px_1fr]">
      <div>
        <p className="eyebrow text-muted-foreground">{label}</p>
        {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("flex min-w-0 flex-wrap items-center gap-3", className)}>{children}</div>
    </div>
  )
}

/** Heading for an application building block (profile, booking, board…). */
export function ModuleHeading({ module, title }: { module: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="eyebrow text-muted-foreground">{module}</p>
      <h3 className="mt-1 font-heading text-2xl font-semibold">{title}</h3>
    </div>
  )
}
