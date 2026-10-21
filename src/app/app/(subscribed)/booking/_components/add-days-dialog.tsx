"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatDay } from "@/lib/booking/format";
import { rangesError, type TimeRange } from "@/lib/booking/rules";
import { addDays, dayOf, isoWeekday, parseDay, type Day } from "@/lib/booking/time";
import { cn } from "@/lib/utils";

import { RangesEditor } from "./ranges-editor";

// "Ajouter une date" (docs/booking.md, "Jours particuliers"): a small calendar where one picks one
// or more days, then "Indisponible toute la journée" or hours of their own.

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export function AddDaysDialog({
  open,
  onOpenChange,
  today,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  today: Day;
  onAdd: (days: Day[], ranges: TimeRange[]) => void;
}) {
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState<Day[]>([]);
  const [mode, setMode] = useState<"off" | "hours">("off");
  const [ranges, setRanges] = useState<TimeRange[]>([{ start: 600, end: 720 }]);
  const error = mode === "hours" ? (ranges.length === 0 ? "Ajoutez au moins une plage." : rangesError(ranges)) : null;

  function reset() {
    setMonth(today.slice(0, 7));
    setSelected([]);
    setMode("off");
    setRanges([{ start: 600, end: 720 }]);
  }

  const { year, month: monthNumber } = parseDay(`${month}-01`);
  const first = dayOf(year, monthNumber, 1);
  const gridStart = addDays(first, 1 - isoWeekday(first));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weeks = [0, 1, 2, 3, 4, 5].map((w) => cells.slice(w * 7, w * 7 + 7)).filter((week) => week.some((d) => d.startsWith(month)));
  const lastMonth = addDays(today, 365).slice(0, 7);
  const shiftMonth = (delta: number) => setMonth(dayOf(year, monthNumber + delta, 1).slice(0, 7));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter des jours particuliers</DialogTitle>
          <DialogDescription>Choisissez un ou plusieurs jours, puis leurs horaires.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Mois précédent"
              disabled={month <= today.slice(0, 7)}
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="text-sm font-medium" aria-live="polite">
              {MONTHS[monthNumber - 1].charAt(0).toUpperCase() + MONTHS[monthNumber - 1].slice(1)} {year}
            </span>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Mois suivant" disabled={month >= lastMonth} onClick={() => shiftMonth(1)}>
              <ChevronRightIcon />
            </Button>
          </div>
          <table className="w-full border-collapse text-center text-sm tabular-nums" role="grid" aria-label="Calendrier">
            <thead>
              <tr>
                {WEEKDAYS.map((name, i) => (
                  <th key={i} scope="col" className="pb-1 text-[11px] font-medium text-muted-foreground">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week[0]}>
                  {week.map((day) => {
                    const inMonth = day.startsWith(month);
                    const past = day < today;
                    const isSelected = selected.includes(day);
                    if (!inMonth) return <td key={day} />;
                    return (
                      <td key={day} className="p-0.5">
                        <button
                          type="button"
                          disabled={past}
                          aria-pressed={isSelected}
                          aria-label={formatDay(day, { year: true })}
                          onClick={() => setSelected((current) => (isSelected ? current.filter((d) => d !== day) : [...current, day].sort()))}
                          className={cn(
                            "h-9 w-full border text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-35",
                            isSelected
                              ? "border-foreground bg-foreground text-background"
                              : "border-transparent hover:border-border",
                            day === today && !isSelected && "border-border",
                          )}
                        >
                          {parseDay(day).date}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {selected.length === 0
              ? "Aucun jour choisi."
              : selected.length === 1
                ? formatDay(selected[0])
                : `${selected.length} jours choisis`}
          </p>

          <RadioGroup value={mode} onValueChange={(value) => setMode(value as "off" | "hours")} className="gap-2.5 border-t border-border pt-3">
            <Label className="font-normal">
              <RadioGroupItem value="off" />
              Indisponible toute la journée
            </Label>
            <Label className="font-normal">
              <RadioGroupItem value="hours" />
              Horaires particuliers
            </Label>
          </RadioGroup>
          {mode === "hours" && (
            <div className="pl-6">
              <RangesEditor label="Jours particuliers" ranges={ranges} onChange={setRanges} />
              {error && (
                <p role="alert" className="mt-1.5 text-[13px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={selected.length === 0 || !!error}
            onClick={() => {
              onAdd(selected, mode === "off" ? [] : [...ranges].sort((a, b) => a.start - b.start));
              onOpenChange(false);
              reset();
            }}
          >
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
