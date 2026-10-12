import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { HOME_PATH } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/user";
import { getOwnPublicProfile } from "@/lib/public-profile/own";

import { SidebarNav } from "./_components/sidebar-nav";
import { UserMenu } from "./_components/user-menu";

// Shell of the private space: a very simple sidebar, not collapsible (docs/auth.md, "Interface").
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="sticky top-0 flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 pt-6 pb-5">
          <Link href={HOME_PATH} aria-label="MyWork, page de profil" className="inline-flex">
            <Logo className="h-6" />
          </Link>
        </div>
        <SidebarNav />
        <div className="border-t border-sidebar-border p-3">
          {/* The session is read at request time: the rest of the shell does not wait for it. */}
          <Suspense fallback={<UserMenuSkeleton />}>
            <CurrentUserMenu />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-spotlight">{children}</main>
    </div>
  );
}

async function CurrentUserMenu() {
  const user = await requireUser();
  const publicProfile = await getOwnPublicProfile(user.id);
  return <UserMenu email={user.email} avatarUrl={user.avatarUrl} publicProfile={publicProfile} />;
}

function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="size-6" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}
