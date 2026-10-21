import { TZDate } from "@date-fns/tz";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { PROFILE_PATH } from "@/lib/auth/paths";
import { requireSubscriber } from "@/lib/billing/data";
import { formatPrice } from "@/lib/billing/plans";
import { BILLING_SETTINGS_PATH, billingReminders, formatPlainDate, nextCharge } from "@/lib/billing/rules";
import { getOwnBookingsBetween, getOwnTimeZone } from "@/lib/booking/data";
import { formatDay } from "@/lib/booking/format";
import { AVAILABILITY_PATH } from "@/lib/booking/rules";
import { addDays, localDay, parseDay, type Day } from "@/lib/booking/time";
import { getOwnDashboard } from "@/lib/dashboard/data";
import { reminders } from "@/lib/dashboard/rules";
import { DRIVE_PATH } from "@/lib/drive/rules";
import { getOwnProfileContent } from "@/lib/profile/data";

import { WelcomeToast } from "../_components/billing/welcome-toast";
import { DashboardMosaic } from "../_components/dashboard/dashboard-mosaic";

export const metadata: Metadata = { title: "Tableau de bord · MyWork" };

// Home of the private space, reached after login (docs/dashboard.md): today's bookings, the visits
// of the public profile, the reminders and the signals of interest, in a grid of tiles
// (maquette « Mosaïque »). The reminders of the subscription come first (docs/billing.md).
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 px-8 py-14 sm:px-16">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

// Midnight of a day in a time zone.
const startOfDay = (day: Day, timeZone: string) => {
  const { year, month, date } = parseDay(day);
  return new Date(new TZDate(year, month - 1, date, 0, 0, timeZone).getTime());
};

async function DashboardContent() {
  const billing = await requireSubscriber();
  const timeZone = await getOwnTimeZone();
  const now = new Date();
  const today = localDay(now, timeZone);
  const tomorrow = startOfDay(addDays(today, 1), timeZone);

  const [dashboard, profile, bookings, next] = await Promise.all([
    getOwnDashboard(),
    getOwnProfileContent(),
    getOwnBookingsBetween(startOfDay(today, timeZone), tomorrow),
    getOwnBookingsBetween(tomorrow, new Date(tomorrow.getTime() + 366 * 86_400_000), 1),
  ]);
  const { subscription, state } = billing;
  const charge = subscription ? nextCharge(subscription, state) : null;
  return (
    <>
      <Header today={today} />
      {charge && (
        <WelcomeToast
          description={
            state === "trialing"
              ? `Votre essai court jusqu'au ${formatPlainDate(charge.at, { year: false })}. Premier prélèvement ce jour-là : ${formatPrice(charge.amount)}.`
              : `Votre abonnement est actif. Prochain prélèvement le ${formatPlainDate(charge.at)} : ${formatPrice(charge.amount)}.`
          }
        />
      )}
      <DashboardMosaic
        dashboard={dashboard}
        reminders={[
          ...billingReminders(subscription, state, now, BILLING_SETTINGS_PATH),
          ...reminders(
            {
              isOnline: dashboard.isOnline,
              bookingOpen: dashboard.bookingOpen,
              profile,
              storageUsed: dashboard.storageUsed,
              storageCapacity: dashboard.storageCapacity,
            },
            { profile: PROFILE_PATH, availability: AVAILABILITY_PATH, drive: DRIVE_PATH },
          ),
        ]}
        bookings={bookings}
        next={next[0] ?? null}
        timeZone={timeZone}
        serverNow={now.toISOString()}
      />
    </>
  );
}

function Header({ today }: { today?: Day }) {
  return (
    <header className="flex flex-col gap-2">
      <p className="eyebrow text-muted-foreground">Espace privé{today && ` · ${formatDay(today)}`}</p>
      <h1 className="font-heading text-5xl font-medium">Tableau de bord</h1>
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Header />
      <div className="grid grid-cols-1 gap-px md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-80 md:col-span-2 xl:row-span-2 xl:h-auto" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
    </>
  );
}
