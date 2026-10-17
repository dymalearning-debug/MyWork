"use client";

import { ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, GlobeIcon, LoaderCircleIcon, VideoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { dayParts, formatDay, formatTimeRange, formatTime, shortWeekLabel, timeZoneLabel, weekLabel } from "@/lib/booking/format";
import {
  COMPANY_MAX,
  DURATION_MINUTES,
  EMAIL_MAX,
  guestFormErrors,
  MESSAGE_COUNTER_FROM,
  MESSAGE_MAX,
  NAME_MAX,
  ROLE_MAX,
  type DayOverride,
  type GuestForm,
  type GuestFormErrors,
  type WeeklyRange,
} from "@/lib/booking/rules";
import { isOpenWeekday } from "@/lib/booking/slots";
import { addDays, localDay, timeZoneList, weekStart, type Day } from "@/lib/booking/time";
import { useBrowserTimeZone } from "@/lib/booking/use-browser";
import { cn } from "@/lib/utils";

import { ContactButton } from "../../_components/contact-button";
import { bookSlot } from "../actions";

// Taking a booking (docs/booking.md, "Choisir un créneau", "Le formulaire"), mockups
// "Public — Prendre rendez-vous" and "(mobile)", direction "B · Semainier": a week in columns, one
// slot selected at a time, a selection bar with "Continuer"; then the form, with the summary of the
// slot on the left. The slots are shown in the visitor's time zone, detected by their browser.

const EMPTY_FORM: GuestForm = { name: "", email: "", role: "", company: "", message: "" };

const MESSAGES: Record<string, string> = {
  taken: "Ce créneau vient d'être réservé. Choisissez-en un autre.",
  closed: "Les réservations sont fermées pour le moment.",
  limit_email: "Vous avez déjà 3 rendez-vous à venir avec cette adresse e-mail.",
  limit_ip: "Trop de réservations depuis cette connexion. Réessayez dans une heure.",
  invalid: "Certaines informations ont été refusées. Vérifiez le formulaire.",
  failed: "Le rendez-vous n'a pas pu être confirmé. Réessayez.",
};

export function BookingFlow({
  handle,
  ownerName,
  hasContact,
  slots,
  serverNow,
  ownerTimeZone,
  horizonDays,
  weekly,
  overrides,
}: {
  handle: string;
  ownerName: string;
  hasContact: boolean;
  slots: string[];
  serverNow: string;
  ownerTimeZone: string;
  horizonDays: number;
  weekly: WeeklyRange[];
  overrides: DayOverride[];
}) {
  const router = useRouter();
  // The visitor's time zone, detected by their browser, or the one they chose.
  const browserZone = useBrowserTimeZone(ownerTimeZone);
  const [chosenZone, setChosenZone] = useState<string | null>(null);
  const timeZone = chosenZone ?? browserZone;
  const [changingZone, setChangingZone] = useState(false);
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [selected, setSelected] = useState<string | null>(null);
  const [week, setWeek] = useState<Day | null>(null);
  const [mobileDay, setMobileDay] = useState<Day | null>(null);
  const [form, setForm] = useState<GuestForm>(EMPTY_FORM);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<GuestFormErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const now = new Date(serverNow);
  const today = localDay(now, timeZone);
  const lastDay = localDay(now.getTime() + horizonDays * 24 * 3600_000, timeZone);
  const firstWeek = weekStart(today);
  const lastWeek = weekStart(lastDay);

  // The slots of each day, in the visitor's time zone.
  const byDay = useMemo(() => {
    const map = new Map<Day, string[]>();
    for (const slot of slots) {
      const day = localDay(new Date(slot), timeZone);
      map.set(day, [...(map.get(day) ?? []), slot]);
    }
    return map;
  }, [slots, timeZone]);

  // The first week with a free slot shows at once.
  const firstSlotWeek = slots.length > 0 ? weekStart(localDay(new Date(slots[0]), timeZone)) : firstWeek;
  const shownWeek = week ?? firstSlotWeek;
  const days = Array.from({ length: 7 }, (_, i) => addDays(shownWeek, i));
  const activeDay = mobileDay && days.includes(mobileDay) ? mobileDay : (days.find((day) => byDay.has(day)) ?? days[0]);

  const selectedStart = selected ? new Date(selected) : null;
  const selectedRange = selectedStart
    ? formatTimeRange(selectedStart, new Date(selectedStart.getTime() + DURATION_MINUTES * 60_000), timeZone)
    : "";
  const selectedDay = selectedStart ? formatDay(localDay(selectedStart, timeZone)) : "";

  const zoneLabel = timeZoneLabel(timeZone);
  const zones = useMemo(() => {
    const list = timeZoneList();
    return list.includes(timeZone) ? list : [timeZone, ...list];
  }, [timeZone]);

  // "Fermé" outside the hours of the week, "Indisponible" for a special day or a full day.
  const emptyLabel = (day: Day) =>
    overrides.some((o) => o.day === day) || isOpenWeekday({ weekly }, day) ? "Indisponible" : "Fermé";

  const goToWeek = (delta: number) => {
    setWeek(addDays(shownWeek, delta * 7));
    setMobileDay(null);
  };

  function confirm() {
    const formErrors = guestFormErrors(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0 || !selected) return;
    setNotice(null);
    startTransition(async () => {
      const result = await bookSlot(handle, { ...form, slotStart: selected, timeZone, website });
      if (result.status === "ok") {
        router.push(result.path);
        return;
      }
      setNotice(MESSAGES[result.status] ?? MESSAGES.failed);
      if (result.status === "taken") {
        // Back to the calendar, the form kept, the slots read again.
        setSelected(null);
        setStep("pick");
        router.refresh();
      }
    });
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 border border-dashed border-border px-6 py-16 text-center">
        <p className="font-heading text-2xl font-semibold">Aucun créneau disponible pour le moment</p>
        {hasContact && (
          <>
            <p className="text-sm text-muted-foreground">Écrivez directement à {ownerName}.</p>
            <ContactButton handle={handle} variant="outline" />
          </>
        )}
      </div>
    );
  }

  if (step === "form" && selectedStart) {
    const field = (key: keyof GuestForm) => ({
      id: `guest-${key}`,
      value: form[key],
      "aria-invalid": errors[key] ? true : undefined,
      "aria-describedby": errors[key] ? `guest-${key}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: event.target.value })),
    });
    return (
      <div className="grid items-start gap-10 md:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col gap-2.5 border border-border bg-muted p-6">
          <p className="eyebrow text-muted-foreground">Votre créneau</p>
          <p className="font-heading text-[30px] leading-tight font-medium">{selectedDay}</p>
          <p className="tabular-nums">{selectedRange}</p>
          <p className="text-[13px] text-muted-foreground">Visio · {zoneLabel}</p>
          <Button variant="link" className="mt-1 self-start px-0" onClick={() => setStep("pick")}>
            <ArrowLeftIcon data-icon="inline-start" />
            Changer de créneau
          </Button>
        </div>

        <form
          noValidate
          aria-label="Vos informations"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
        >
          {notice && (
            <p role="alert" className="border-l-2 border-destructive bg-muted px-4 py-3 text-sm">
              {notice}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" error={errors.name} htmlFor="guest-name">
              <Input {...field("name")} autoComplete="name" maxLength={NAME_MAX} />
            </Field>
            <Field label="E-mail" error={errors.email} htmlFor="guest-email">
              <Input {...field("email")} type="email" autoComplete="email" maxLength={EMAIL_MAX} />
            </Field>
            <Field label="Fonction" optional error={errors.role} htmlFor="guest-role">
              <Input {...field("role")} placeholder="Recruteuse, dirigeant, freelance…" autoComplete="organization-title" maxLength={ROLE_MAX} />
            </Field>
            <Field label="Entreprise" optional error={errors.company} htmlFor="guest-company">
              <Input {...field("company")} autoComplete="organization" maxLength={COMPANY_MAX} />
            </Field>
          </div>
          <Field
            label="Objet du rendez-vous"
            error={errors.message}
            htmlFor="guest-message"
            counter={form.message.length >= MESSAGE_COUNTER_FROM ? `${form.message.length} / ${MESSAGE_MAX}` : undefined}
          >
            <Textarea {...field("message")} placeholder="Quelques mots sur votre projet ou votre besoin." maxLength={MESSAGE_MAX} className="min-h-28" />
          </Field>
          {/* Trap field, invisible to people: robots fill it. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="guest-website">Site web</label>
            <input id="guest-website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
          </div>
          <p className="text-[13px] text-muted-foreground">Vos informations sont transmises à {ownerName}, uniquement pour ce rendez-vous.</p>
          <div>
            <Button type="submit" size="lg" disabled={pending}>
              {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
              Confirmer le rendez-vous
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const slotButton = (slot: string, className: string) => {
    const isSelected = slot === selected;
    const start = new Date(slot);
    return (
      <button
        key={slot}
        type="button"
        aria-pressed={isSelected}
        aria-label={`${formatDay(localDay(start, timeZone))}, ${formatTime(start, timeZone)}`}
        onClick={() => {
          setSelected(slot);
          setNotice(null);
        }}
        className={cn(
          "border text-[13px] font-medium tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isSelected ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground",
          className,
        )}
      >
        {formatTime(start, timeZone)}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <p role="alert" className="border-l-2 border-destructive bg-muted px-4 py-3 text-sm">
          {notice}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-2">
            <VideoIcon aria-hidden className="size-4" />
            Visio · <span className="tabular-nums">{DURATION_MINUTES} min</span>
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground">
            <GlobeIcon aria-hidden className="size-4" />
            {changingZone ? (
              <NativeSelect
                size="sm"
                aria-label="Fuseau horaire"
                value={timeZone}
                onChange={(event) => {
                  setChosenZone(event.target.value);
                  setChangingZone(false);
                }}
                className="max-w-56"
              >
                {zones.map((zone) => (
                  <NativeSelectOption key={zone} value={zone}>
                    {timeZoneLabel(zone)} ({zone})
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            ) : (
              <>
                {zoneLabel} ·{" "}
                <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={() => setChangingZone(true)}>
                  changer
                </button>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Semaine précédente" disabled={shownWeek <= firstWeek} onClick={() => goToWeek(-1)}>
            <ChevronLeftIcon />
          </Button>
          <span className="min-w-[200px] text-center text-sm font-medium tabular-nums" aria-live="polite">
            <span className="hidden sm:inline">{weekLabel(shownWeek)}</span>
            <span className="sm:hidden">{shortWeekLabel(shownWeek)}</span>
          </span>
          <Button variant="ghost" size="icon" aria-label="Semaine suivante" disabled={shownWeek >= lastWeek} onClick={() => goToWeek(1)}>
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      {/* Computer: one column per day. */}
      <div className="hidden grid-cols-7 border border-border sm:grid" role="group" aria-label="Créneaux de la semaine">
        {days.map((day, index) => {
          const daySlots = byDay.get(day) ?? [];
          const parts = dayParts(day);
          return (
            <div
              key={day}
              className={cn("flex min-h-[340px] flex-col", index < 6 && "border-r border-border", daySlots.length === 0 && "bg-muted")}
            >
              <div className="flex flex-col gap-0.5 border-b border-border px-3 pt-3.5 pb-3">
                <span className="eyebrow text-muted-foreground">{parts.shortWeekday}</span>
                <span className="font-heading text-[30px] leading-none font-medium tabular-nums">{parts.date}</span>
              </div>
              <div className="flex max-h-[420px] flex-col gap-1.5 overflow-y-auto p-2.5">
                {daySlots.map((slot) => slotButton(slot, "h-9 shrink-0"))}
                {daySlots.length === 0 && <span className="px-0.5 py-1.5 text-[13px] text-muted-foreground">{emptyLabel(day)}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: the seven days in a row, the slots of the chosen day in three columns. */}
      <div className="flex flex-col gap-3.5 sm:hidden">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const parts = dayParts(day);
            const closed = !byDay.has(day);
            const active = day === activeDay;
            return (
              <button
                key={day}
                type="button"
                disabled={closed}
                aria-pressed={active}
                aria-label={`${formatDay(day)}${closed ? ", aucun créneau" : ""}`}
                onClick={() => setMobileDay(day)}
                className={cn(
                  "flex h-[60px] flex-col items-center justify-center gap-1 border outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  active ? "border-foreground bg-foreground text-background" : closed ? "border-border bg-muted text-muted-foreground opacity-60" : "border-border",
                )}
              >
                <span className="text-[10px] tracking-[0.12em] uppercase">{parts.shortWeekday}</span>
                <span className="font-heading text-[22px] leading-none tabular-nums">{parts.date}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[15px] font-medium">{formatDay(activeDay)}</span>
          <span className="text-[13px] text-muted-foreground tabular-nums">
            {(byDay.get(activeDay) ?? []).length > 0 ? `${(byDay.get(activeDay) ?? []).length} créneaux` : emptyLabel(activeDay)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">{(byDay.get(activeDay) ?? []).map((slot) => slotButton(slot, "h-11 text-sm"))}</div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-[clamp(1.25rem,5vw,3rem)] flex items-center justify-between gap-3 border-t border-border bg-muted px-[clamp(1.25rem,5vw,3rem)] py-3 sm:static sm:mx-0 sm:border sm:py-3 sm:pr-3 sm:pl-5">
        {selectedStart ? (
          <span className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-1.5 sm:text-[15px]" aria-live="polite">
            <strong className="font-medium">{selectedDay}</strong>
            <span className="text-muted-foreground tabular-nums">
              <span className="hidden sm:inline">· </span>
              {selectedRange}
            </span>
          </span>
        ) : (
          <span className="text-sm text-muted-foreground sm:text-[15px]">Choisissez un créneau.</span>
        )}
        <Button
          size="lg"
          disabled={!selectedStart}
          onClick={() => {
            setStep("form");
            setNotice(null);
          }}
        >
          Continuer
          <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  optional = false,
  error,
  htmlFor,
  counter,
  children,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  htmlFor: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
          {optional && <span className="font-normal text-muted-foreground"> · facultatif</span>}
        </label>
        {counter && <span className="text-xs text-muted-foreground tabular-nums">{counter}</span>}
      </div>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-[13px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
