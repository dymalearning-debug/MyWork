"use client";

import { LayoutDashboardIcon, SquareKanbanIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HOME_PATH, PROFILE_PATH } from "@/lib/auth/paths";
import { BOARDS_PATH } from "@/lib/boards/rules";
import { cn } from "@/lib/utils";

// Links of the private space, one per module.
// The dashboard sits at /app itself: it is only active on that exact address. "Mes tableaux" leads to
// the last board seen, which changes: never prefetched.
const LINKS = [
  { href: HOME_PATH, label: "Tableau de bord", icon: LayoutDashboardIcon, exact: true, prefetch: undefined },
  { href: PROFILE_PATH, label: "Mon profil", icon: UserIcon, exact: false, prefetch: undefined },
  { href: BOARDS_PATH, label: "Mes tableaux", icon: SquareKanbanIcon, exact: false, prefetch: false },
];

export function SidebarNav() {
  return <SidebarLinks pathname={usePathname()} />;
}

// The address of a board (/app/boards/<id>) is only known at request time: until then, the links
// are shown without the active one.
export function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5 p-2">
      {LINKS.map(({ href, label, icon: Icon, exact, prefetch }) => {
        const active = !!pathname && (pathname === href || (!exact && pathname.startsWith(`${href}/`)));
        return (
          <Link
            key={href}
            href={href}
            prefetch={prefetch}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
              active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
