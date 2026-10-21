import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { getOwnProfile } from "@/lib/account/profile";
import { HOME_PATH } from "@/lib/auth/paths";
import { requireUser } from "@/lib/auth/user";
import { requireSubscriber } from "@/lib/billing/data";
import { unpaidText } from "@/lib/billing/rules";
import { hasUnseenBookings } from "@/lib/booking/data";

import { PaymentBanner } from "../_components/billing/payment-banner";
import { SidebarLinks, SidebarNav } from "../_components/sidebar-nav";
import { UserMenu } from "../_components/user-menu";

// Shell of the private space: a very simple sidebar, not collapsible (docs/auth.md, "Interface").
// Only with a subscription that opens it (docs/billing.md, "Accès selon l'état de l'abonnement"):
// otherwise "Choisissez votre formule" (/app/subscribe, outside this shell). After a refused payment,
// a banner at the top, while Stripe tries again.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-1">
      <aside className="sticky top-0 flex h-svh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="px-5 pt-6 pb-5">
          <Link href={HOME_PATH} aria-label="MyWork, tableau de bord" className="inline-flex">
            <Logo className="h-6" />
          </Link>
        </div>
        <Suspense fallback={<SidebarLinks pathname={null} />}>
          <CurrentSidebarNav />
        </Suspense>
        <div className="border-t border-sidebar-border p-3">
          {/* The session is read at request time: the rest of the shell does not wait for it. */}
          <Suspense fallback={<UserMenuSkeleton />}>
            <CurrentUserMenu />
          </Suspense>
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-spotlight">
        <Suspense fallback={null}>
          <SubscriptionGate />
        </Suspense>
        {children}
      </main>
    </div>
  );
}

// The links, with the red dot of "Mes rendez-vous" while bookings are not seen yet.
async function CurrentSidebarNav() {
  await requireUser();
  const bookingDot = await hasUnseenBookings().catch((error: unknown) => {
    console.error(error);
    return false;
  });
  return <SidebarNav bookingDot={bookingDot} />;
}

async function SubscriptionGate() {
  const { subscription, state } = await requireSubscriber();
  if (state !== "past_due" || !subscription) return null;
  return <PaymentBanner text={unpaidText(subscription)} />;
}

async function CurrentUserMenu() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);
  return <UserMenu email={user.email} avatarUrl={profile.photoUrl} profile={profile} subscribed />;
}

function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <Skeleton className="size-6" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}
