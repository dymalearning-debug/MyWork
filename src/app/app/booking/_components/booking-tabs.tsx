"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AVAILABILITY_PATH, BOOKING_PATH } from "@/lib/booking/rules";
import { cn } from "@/lib/utils";

// The two tabs of "Mes rendez-vous": the active one in ink with a red line under it, like the
// tabs of the public profile.
const TABS = [
  { href: BOOKING_PATH, label: "Rendez-vous" },
  { href: AVAILABILITY_PATH, label: "Disponibilités" },
];

export function BookingTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Mes rendez-vous" className="-mb-px flex gap-7">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "py-2.5 text-sm transition-colors",
              active ? "text-foreground shadow-[inset_0_-2px_0_var(--primary)]" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
