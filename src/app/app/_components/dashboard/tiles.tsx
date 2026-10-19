import Link from "next/link";

import type { Dashboard, Signal } from "@/lib/dashboard/data";
import { formatDelta, formatLastSignal, VISIT_TAB_LABELS, VISIT_TABS, type Reminder } from "@/lib/dashboard/rules";
import { cn } from "@/lib/utils";

// The tiles of the dashboard (docs/dashboard.md, maquette « Mosaïque »): a grid of tiles separated
// by thin rules, big numbers in Newsreader. The grid draws the top and left rules, each tile its
// right and bottom ones.

const TILE = "flex flex-col border-r border-b border-border p-7";

export function VisitorsTile({ days, visitors, previous }: { days: 7 | 30; visitors: number; previous: number }) {
  return (
    <section aria-label={`Visiteurs sur ${days} jours`} className={cn(TILE, "gap-2")}>
      <h2 className="eyebrow text-muted-foreground">Visiteurs · {days} jours</h2>
      <p className="font-heading text-7xl leading-none font-medium tabular-nums">{visitors}</p>
      <p className={cn("text-[13px] tabular-nums", visitors > previous ? "text-success" : "text-muted-foreground")}>
        {formatDelta(visitors, previous, days)}
      </p>
    </section>
  );
}

const dayLabel = (day: string) => {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
};

// Visitors of each of the last 30 days, the last 7 in red.
export function VisitsChart({ daily }: { daily: Dashboard["daily"] }) {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  const total = daily.reduce((sum, d) => sum + d.visitors, 0);
  return (
    <section aria-labelledby="dashboard-chart" className={cn(TILE, "gap-3 md:col-span-2")}>
      <h2 id="dashboard-chart" className="eyebrow text-muted-foreground">
        Visiteurs par jour · 30 jours
      </h2>
      <div
        role="img"
        aria-label={`Visiteurs par jour sur 30 jours : ${total} au total`}
        className="flex h-28 items-end gap-[3px] border-b border-border"
      >
        {daily.map((d, index) => (
          <div
            key={d.day}
            title={`${dayLabel(d.day)} · ${d.visitors} visiteur${d.visitors > 1 ? "s" : ""}`}
            className={cn("min-h-0.5 flex-1", index >= daily.length - 7 ? "bg-primary" : "bg-chart-3")}
            style={{ height: `${(d.visitors / max) * 100}%` }}
          />
        ))}
      </div>
      {daily.length > 0 && (
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{dayLabel(daily[0].day)}</span>
          <span>{dayLabel(daily[daily.length - 1].day)}</span>
        </div>
      )}
    </section>
  );
}

export function TabsTile({ tabs }: { tabs: Dashboard["tabs"] }) {
  const max = Math.max(1, ...VISIT_TABS.map((tab) => tabs[tab]));
  return (
    <section aria-labelledby="dashboard-tabs" className={cn(TILE, "gap-3.5 md:col-span-2")}>
      <h2 id="dashboard-tabs" className="eyebrow text-muted-foreground">
        Par onglet · 30 jours
      </h2>
      <ul className="flex flex-col gap-3.5">
        {VISIT_TABS.map((tab) => (
          <li key={tab} className="grid grid-cols-[120px_minmax(0,1fr)_40px] items-center gap-3 text-sm">
            <span>{VISIT_TAB_LABELS[tab]}</span>
            <span aria-hidden className="h-1.5 bg-muted">
              <span className="block h-full bg-foreground" style={{ width: `${(tabs[tab] / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{tabs[tab]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RemindersTile({ items }: { items: Reminder[] }) {
  return (
    <section aria-labelledby="dashboard-reminders" className={cn(TILE, "gap-3 bg-muted md:col-span-2")}>
      <h2 id="dashboard-reminders" className="eyebrow text-muted-foreground">
        Rappels
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tout est en ordre.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-1 border-b border-border py-2.5 first:pt-0 last:border-b-0 last:pb-0">
              <Link href={item.href} className="flex justify-between gap-4 text-sm outline-none hover:underline focus-visible:underline">
                <span>{item.title}</span>
                {item.value && (
                  <span className={cn("tabular-nums", item.tone === "warning" && "text-warning", item.tone === "destructive" && "text-destructive")}>
                    {item.value}
                  </span>
                )}
              </Link>
              <span className="text-[13px] text-muted-foreground">{item.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// One signal of the last 30 days: how many, and when the last one happened (or, for the
// resources, the most downloaded one).
export function SignalTile({
  label,
  signal,
  detail,
  now,
  timeZone,
}: {
  label: string;
  signal: Signal;
  detail?: string;
  now: Date;
  timeZone: string;
}) {
  const when = signal.lastAt ? formatLastSignal(new Date(signal.lastAt), now, timeZone) : null;
  const last = when ? `Dernier : ${when.charAt(0).toLowerCase()}${when.slice(1)}` : "Aucun pour l'instant";
  return (
    <section aria-label={label} className={cn(TILE, "gap-1.5 px-7 py-6")}>
      <h2 className="eyebrow text-muted-foreground">{label} · 30 j</h2>
      <p className="font-heading text-5xl leading-none font-medium tabular-nums">{signal.count}</p>
      <p className="truncate text-[13px] text-muted-foreground tabular-nums">{detail ?? last}</p>
    </section>
  );
}
