"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Both icons are rendered and toggled with CSS to avoid a hydration mismatch. */}
      <SunIcon data-icon="inline-start" className="dark:hidden" />
      <MoonIcon data-icon="inline-start" className="hidden dark:block" />
      <span className="dark:hidden">Thème clair</span>
      <span className="hidden dark:inline">Thème sombre</span>
    </Button>
  )
}
