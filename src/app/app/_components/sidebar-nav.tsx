"use client";

import { LayoutDashboardIcon, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { HOME_PATH, PROFILE_PATH } from "@/lib/auth/paths";
import { cn } from "@/lib/utils";

// Links of the private space. Module links will be added with the modules.
// The dashboard sits at /app itself: it is only active on that exact address.
const LINKS = [
  { href: HOME_PATH, label: "Tableau de bord", icon: LayoutDashboardIcon, exact: true },
  { href: PROFILE_PATH, label: "Mon profil", icon: UserIcon, exact: false },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-0.5 p-2">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = pathname === href || (!exact && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
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
