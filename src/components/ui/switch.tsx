"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

// Readable switch (decision of 2026-10-12): off, a pale grey track with a grey knob at the left;
// on, a red track (primary) with a white knob at the right. Rounded: with radio buttons and dots,
// the exception to the square corners of the design system.
const TRACK =
  "group/switch relative inline-flex shrink-0 items-center rounded-full border border-input bg-muted px-0.5 transition-colors data-checked:border-primary data-checked:bg-primary data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7"
const THUMB =
  "pointer-events-none block rounded-full bg-muted-foreground transition-transform group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-2.5 group-data-checked/switch:bg-primary-foreground group-data-[size=default]/switch:group-data-checked/switch:translate-x-4 group-data-[size=sm]/switch:group-data-checked/switch:translate-x-3"

function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        TRACK,
        "peer outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb data-slot="switch-thumb" className={THUMB} />
    </SwitchPrimitive.Root>
  )
}

// The same switch, drawn only: for a row that is itself the control, such as a menu item
// (the row carries the role and the checked state, so this one stays hidden from assistive tech).
function SwitchIndicator({
  checked,
  size = "default",
  className,
}: {
  checked: boolean
  size?: "sm" | "default"
  className?: string
}) {
  return (
    <span
      aria-hidden
      data-slot="switch-indicator"
      data-size={size}
      data-checked={checked ? "" : undefined}
      data-unchecked={checked ? undefined : ""}
      className={cn(TRACK, className)}
    >
      <span className={THUMB} />
    </span>
  )
}

export { Switch, SwitchIndicator }
