import { cn } from "@/lib/utils"

const TONES = {
  success: "bg-success",
  warning: "bg-warning",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
} as const

export function StatusDot({
  tone = "success",
  pulse = false,
  className,
}: {
  tone?: keyof typeof TONES
  pulse?: boolean
  className?: string
}) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2 shrink-0", className)}>
      {pulse && (
        <span
          className={cn("absolute inset-0 animate-ping rounded-full opacity-60", TONES[tone])}
        />
      )}
      <span className={cn("relative size-2 rounded-full", TONES[tone])} />
    </span>
  )
}
