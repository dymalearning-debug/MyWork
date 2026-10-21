"use client";

import { CheckIcon, LoaderCircleIcon, PlusIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { StatusDot } from "@/components/status-dot";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { SwitchIndicator } from "@/components/ui/switch";
import { timeZoneLabel } from "@/lib/booking/format";
import { groupLabel, groupOverrides } from "@/lib/booking/overrides";
import {
  BOOKING_PATH,
  BUFFER_OPTIONS,
  DAILY_LIMIT_OPTIONS,
  DURATION_MINUTES,
  HORIZON_OPTIONS,
  NOTICE_OPTIONS,
  rangesError,
  sortRanges,
  WEEKDAY_NAMES,
  type BookingSettings,
  type DayOverride,
  type TimeRange,
  type WeeklyRange,
} from "@/lib/booking/rules";
import { localDay, timeZoneList } from "@/lib/booking/time";
import { useBrowserTimeZone } from "@/lib/booking/use-browser";
import type { BookingSetup } from "@/lib/booking/types";

import { saveAvailability } from "../actions";
import { AddDaysDialog } from "./add-days-dialog";
import { RangesEditor } from "./ranges-editor";

// "Disponibilités" (docs/booking.md, "Espace privé : « Disponibilités »"), mockup
// "Privé — Disponibilités": at the top, the switch "Réservations ouvertes / fermées"; on the left,
// the hours of the week; on the right, the special days and the settings; at the bottom, one
// "Enregistrer" for the whole page, and the same question as in "Mon profil" when leaving with
// changes not saved.

type DayHours = { open: boolean; ranges: TimeRange[] };
type Form = { settings: BookingSettings; days: DayHours[]; overrides: DayOverride[] };

const DEFAULT_DAY: TimeRange[] = [
  { start: 540, end: 720 },
  { start: 840, end: 1080 },
];

function formOf(setup: Pick<BookingSetup, "settings" | "weekly" | "overrides">): Form {
  return {
    settings: setup.settings,
    days: WEEKDAY_NAMES.map((_, i) => {
      const ranges = sortRanges(setup.weekly.filter((r) => r.weekday === i + 1).map(({ start, end }) => ({ start, end })));
      return { open: ranges.length > 0, ranges };
    }),
    overrides: [...setup.overrides].sort((a, b) => a.day.localeCompare(b.day)),
  };
}

// What is saved: only the ranges of the open days.
function payloadOf(form: Form) {
  const weekly: WeeklyRange[] = form.days.flatMap((day, i) =>
    day.open ? sortRanges(day.ranges).map((range) => ({ weekday: i + 1, ...range })) : [],
  );
  const overrides = [...form.overrides]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((o) => ({ day: o.day, ranges: sortRanges(o.ranges) }));
  return { settings: form.settings, weekly, overrides };
}

export function AvailabilityEditor({ setup, serverNow }: { setup: BookingSetup; serverNow: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => formOf(setup));
  const [edited, setForm] = useState(saved);
  // First visit: the time zone of the browser, to save, until one is chosen in the list.
  const browserZone = useBrowserTimeZone(setup.settings.timeZone);
  const [zoneSettled, setZoneSettled] = useState(!setup.isNew);
  const form = zoneSettled ? edited : { ...edited, settings: { ...edited.settings, timeZone: browserZone } };
  const [adding, setAdding] = useState(false);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const allowLeave = useRef(false);
  const zones = useMemo(() => {
    const list = timeZoneList();
    return list.includes(form.settings.timeZone) ? list : [form.settings.timeZone, ...list];
  }, [form.settings.timeZone]);

  const savedPayload = JSON.stringify(payloadOf(saved));
  const dirty = JSON.stringify(payloadOf(form)) !== savedPayload;
  const dayErrors = form.days.map((day) => (day.open ? rangesError(day.ranges) : null));
  const hasErrors = dayErrors.some(Boolean);
  const bookedDays = useMemo(() => new Map(setup.bookedDays.map((d) => [d.day, d.count])), [setup.bookedDays]);

  // Any change settles the time zone shown, so that it is kept.
  const setSettings = (changes: Partial<BookingSettings>) => {
    const zone = form.settings.timeZone;
    setZoneSettled(true);
    setForm((current) => ({ ...current, settings: { ...current.settings, timeZone: zone, ...changes } }));
  };
  const setDay = (index: number, changes: Partial<DayHours>) =>
    setForm((current) => ({ ...current, days: current.days.map((day, i) => (i === index ? { ...day, ...changes } : day)) }));

  function save(then?: string) {
    if (hasErrors) {
      toast.error("Les horaires ne peuvent pas être enregistrés", { description: "Corrigez les plages signalées." });
      return;
    }
    startSaving(async () => {
      const next = form;
      const result = await saveAvailability(payloadOf(next));
      if (!result.ok) {
        toast.error("Les disponibilités n'ont pas pu être enregistrées. Réessayez.");
        return;
      }
      toast.success("Disponibilités enregistrées", {
        description:
          next.settings.isOpen !== saved.settings.isOpen
            ? next.settings.isOpen
              ? "Les réservations sont ouvertes."
              : "Les réservations sont fermées."
            : undefined,
      });
      setSaved(next);
      setForm(next);
      setZoneSettled(true);
      if (then) {
        allowLeave.current = true;
        setLeaving(null);
        router.push(then);
      }
    });
  }

  // Leaving with changes not saved: the browser asks for a reload or a closed tab; the app asks
  // "Enregistrer les modifications ?" for its own links (as in "Mon profil").
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!allowLeave.current) event.preventDefault();
    };
    const onClick = (event: MouseEvent) => {
      if (allowLeave.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      event.preventDefault();
      event.stopPropagation();
      setLeaving(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  const isOpen = form.settings.isOpen;
  const groups = groupOverrides(form.overrides);

  return (
    <div className="flex flex-1 flex-col">
      <form
        noValidate
        aria-label="Disponibilités"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="flex flex-1 flex-col gap-6 pt-6 pb-10"
      >
        <button
          type="button"
          role="switch"
          aria-checked={isOpen}
          onClick={() => setSettings({ isOpen: !isOpen })}
          className="flex max-w-xl items-center gap-3.5 border border-border bg-background px-4 py-3 text-left transition-colors outline-none hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <SwitchIndicator checked={isOpen} />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{isOpen ? "Réservations ouvertes" : "Réservations fermées"}</span>
            <span className="text-[13px] text-muted-foreground">
              {isOpen
                ? "L'onglet « Rendez-vous » est visible sur votre profil public."
                : "Personne ne peut réserver. Les rendez-vous déjà pris restent valables."}
            </span>
          </span>
        </button>

        <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section aria-labelledby="weekly-heading">
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="weekly-heading" className="eyebrow text-muted-foreground">
                Horaires de la semaine
              </h2>
              <span className="text-xs text-muted-foreground">
                Créneaux de {DURATION_MINUTES} min, {timeZoneLabel(form.settings.timeZone).replace(/^Heure/, "heure")}
              </span>
            </div>
            <div className="border-t border-border">
              {form.days.map((day, index) => {
                const name = WEEKDAY_NAMES[index];
                return (
                  <div key={name} className="grid grid-cols-[28px_104px_minmax(0,1fr)] items-start gap-2 border-b border-border py-2.5">
                    <Checkbox
                      aria-label={name}
                      checked={day.open}
                      onCheckedChange={(open) => setDay(index, { open, ranges: open && day.ranges.length === 0 ? DEFAULT_DAY : day.ranges })}
                      className="mt-2"
                    />
                    <span className="pt-1.5 text-sm font-medium">{name}</span>
                    {day.open ? (
                      <div>
                        <RangesEditor
                          label={name}
                          ranges={day.ranges}
                          onChange={(ranges) => setDay(index, { ranges, open: ranges.length > 0 })}
                        />
                        {dayErrors[index] && (
                          <p role="alert" className="mt-1.5 text-[13px] text-destructive">
                            {dayErrors[index]}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="pt-1.5 text-sm text-muted-foreground">Fermé</span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-8">
            <section aria-labelledby="overrides-heading">
              <div className="mb-1 flex items-center justify-between gap-2">
                <h2 id="overrides-heading" className="eyebrow text-muted-foreground">
                  Jours particuliers
                </h2>
                <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
                  <PlusIcon data-icon="inline-start" />
                  Ajouter une date
                </Button>
              </div>
              <div className="border-t border-border">
                {groups.length === 0 && (
                  <p className="border-b border-border py-2.5 text-[13px] text-muted-foreground">
                    Congés, jour pris ailleurs, samedi exceptionnel : ajoutez une date.
                  </p>
                )}
                {groups.map((group) => {
                  const booked = group.days.reduce((sum, day) => sum + (bookedDays.get(day) ?? 0), 0);
                  const label = groupLabel(group.days);
                  return (
                    <div key={group.days[0]} className="flex items-start justify-between gap-3 border-b border-border py-2.5 text-sm">
                      <span className="flex flex-col gap-1">
                        <span>{label}</span>
                        {booked > 0 && (
                          <span className="eyebrow text-warning">
                            {booked} rendez-vous {group.days.length > 1 ? "ces jours-là" : "ce jour-là"} ·{" "}
                            <Link href={BOOKING_PATH} className="underline underline-offset-2">
                              voir
                            </Link>
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground tabular-nums">
                        {group.ranges.length === 0
                          ? "Indisponible"
                          : group.ranges.map((r) => `${minutes(r.start)} – ${minutes(r.end)}`).join(", ")}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Retirer ${label}`}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              overrides: current.overrides.filter((o) => !group.days.includes(o.day)),
                            }))
                          }
                        >
                          <XIcon />
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="settings-heading">
              <h2 id="settings-heading" className="eyebrow mb-1 text-muted-foreground">
                Réglages
              </h2>
              <div className="border-t border-border">
                <SettingRow label="Durée">
                  <span className="text-muted-foreground tabular-nums">{DURATION_MINUTES} min</span>
                </SettingRow>
                <SettingRow label="Pause après un rendez-vous" htmlFor="booking-buffer">
                  <NativeSelect
                    id="booking-buffer"
                    size="sm"
                    value={form.settings.bufferMinutes}
                    onChange={(event) => setSettings({ bufferMinutes: Number(event.target.value) })}
                  >
                    {BUFFER_OPTIONS.map((o) => (
                      <NativeSelectOption key={o.value} value={o.value}>
                        {o.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </SettingRow>
                <SettingRow label="Préavis minimum" htmlFor="booking-notice">
                  <NativeSelect
                    id="booking-notice"
                    size="sm"
                    value={form.settings.noticeMinutes}
                    onChange={(event) => setSettings({ noticeMinutes: Number(event.target.value) })}
                  >
                    {NOTICE_OPTIONS.map((o) => (
                      <NativeSelectOption key={o.value} value={o.value}>
                        {o.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </SettingRow>
                <SettingRow label="Réservable jusqu'à" htmlFor="booking-horizon">
                  <NativeSelect
                    id="booking-horizon"
                    size="sm"
                    value={form.settings.horizonDays}
                    onChange={(event) => setSettings({ horizonDays: Number(event.target.value) })}
                  >
                    {HORIZON_OPTIONS.map((o) => (
                      <NativeSelectOption key={o.value} value={o.value}>
                        {o.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </SettingRow>
                <SettingRow label="Rendez-vous par jour" htmlFor="booking-limit">
                  <NativeSelect
                    id="booking-limit"
                    size="sm"
                    value={form.settings.dailyLimit ?? ""}
                    onChange={(event) => setSettings({ dailyLimit: event.target.value ? Number(event.target.value) : null })}
                  >
                    <NativeSelectOption value="">Pas de limite</NativeSelectOption>
                    {DAILY_LIMIT_OPTIONS.map((n) => (
                      <NativeSelectOption key={n} value={n}>
                        {n} au plus
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </SettingRow>
                <SettingRow label="Fuseau horaire" htmlFor="booking-zone">
                  <NativeSelect
                    id="booking-zone"
                    size="sm"
                    className="max-w-48"
                    value={form.settings.timeZone}
                    onChange={(event) => setSettings({ timeZone: event.target.value })}
                  >
                    {zones.map((zone) => (
                      <NativeSelectOption key={zone} value={zone}>
                        {zone}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </SettingRow>
              </div>
            </section>
          </div>
        </div>
      </form>

      <div className="sticky bottom-0 z-10 -mx-12 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background px-12 py-3.5">
        {dirty ? (
          <p className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <StatusDot tone="warning" />
            Modifications non enregistrées
          </p>
        ) : (
          <p className="mr-auto flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <CheckIcon className="size-4 text-success" />
            Tout est enregistré
          </p>
        )}
        <Button type="button" variant="outline" disabled={!dirty || saving} onClick={() => {
            setForm(saved);
            setZoneSettled(true);
          }}>
          Annuler
        </Button>
        <Button type="button" disabled={!dirty || saving} onClick={() => save()}>
          {saving && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          Enregistrer
        </Button>
      </div>

      <AddDaysDialog
        open={adding}
        onOpenChange={setAdding}
        today={localDay(new Date(serverNow), form.settings.timeZone)}
        onAdd={(days, ranges) =>
          setForm((current) => ({
            ...current,
            overrides: [...current.overrides.filter((o) => !days.includes(o.day)), ...days.map((day) => ({ day, ranges }))].sort(
              (a, b) => a.day.localeCompare(b.day),
            ),
          }))
        }
      />

      <Dialog open={!!leaving} onOpenChange={(open) => !open && !saving && setLeaving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer les modifications ?</DialogTitle>
            <DialogDescription>
              Vous avez modifié vos disponibilités sans les enregistrer. Si vous quittez la page maintenant, ces modifications
              seront perdues.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                const target = leaving;
                allowLeave.current = true;
                setLeaving(null);
                if (target) router.push(target);
              }}
            >
              Ignorer les modifications
            </Button>
            <Button disabled={saving} onClick={() => leaving && save(leaving)}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const minutes = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;

function SettingRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
      {children}
    </div>
  );
}
