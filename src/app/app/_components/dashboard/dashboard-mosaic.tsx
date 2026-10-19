import type { OwnBooking } from "@/lib/booking/types";
import type { Dashboard } from "@/lib/dashboard/data";
import type { Reminder } from "@/lib/dashboard/rules";

import { RemindersTile, SignalTile, TabsTile, VisitorsTile, VisitsChart } from "./tiles";
import { TodayBookings } from "./today-bookings";

// The grid of the dashboard (docs/dashboard.md, maquette « Mosaïque »): today's bookings in a big
// tile at the left, the visitors over 7 and 30 days and their chart at the right, the visits per
// tab and the reminders, then one tile per signal. Also shown in the showcase (/design).
export function DashboardMosaic({
  dashboard,
  reminders,
  bookings,
  next,
  timeZone,
  serverNow,
}: {
  dashboard: Dashboard;
  reminders: Reminder[];
  bookings: OwnBooking[];
  next: OwnBooking | null;
  timeZone: string;
  serverNow: string;
}) {
  const { signals } = dashboard;
  const top = signals.resources.top;
  const now = new Date(serverNow);
  return (
    <div className="grid grid-cols-1 border-t border-l border-border bg-card md:grid-cols-2 xl:grid-cols-4">
      <TodayBookings bookings={bookings} next={next} timeZone={timeZone} serverNow={serverNow} />
      <VisitorsTile days={7} visitors={dashboard.visitors7} previous={dashboard.visitorsPrevious7} />
      <VisitorsTile days={30} visitors={dashboard.visitors30} previous={dashboard.visitorsPrevious30} />
      <VisitsChart daily={dashboard.daily} />
      <TabsTile tabs={dashboard.tabs} />
      <RemindersTile items={reminders} />
      <SignalTile label="Réservations" signal={signals.bookings} now={now} timeZone={timeZone} />
      <SignalTile label="« Me contacter »" signal={signals.contact} now={now} timeZone={timeZone} />
      <SignalTile label="CV téléchargés" signal={signals.cv} now={now} timeZone={timeZone} />
      <SignalTile
        label="Ressources"
        signal={signals.resources}
        detail={top ? `${top.name} · ${top.count}` : undefined}
        now={now}
        timeZone={timeZone}
      />
    </div>
  );
}
