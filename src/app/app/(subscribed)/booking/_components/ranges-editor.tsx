"use client";

import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { DAY_MINUTES, END_TIMES, GRID_MINUTES, minutesToTime, START_TIMES, type TimeRange } from "@/lib/booking/rules";

// The ranges of a day ("09:00 – 12:00"), each with its cross, and "+" to add one. Hours chosen
// every 30 minutes, in a list.
export function RangesEditor({
  label,
  ranges,
  onChange,
}: {
  label: string;
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
}) {
  const update = (index: number, changes: Partial<TimeRange>) =>
    onChange(ranges.map((range, i) => (i === index ? { ...range, ...changes } : range)));

  // A new range starts an hour after the last one, for two hours (or what is left of the day).
  function add() {
    const last = ranges.reduce((max, range) => Math.max(max, range.end), 0);
    const start = ranges.length === 0 ? 540 : Math.min(last + 60, DAY_MINUTES - GRID_MINUTES);
    onChange([...ranges, { start, end: Math.min(start + 120, DAY_MINUTES) }]);
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
      {ranges.map((range, index) => (
        <span key={index} className="inline-flex items-center gap-1.5">
          <NativeSelect
            size="sm"
            aria-label={`${label}, début de la plage ${index + 1}`}
            value={range.start}
            onChange={(event) => update(index, { start: Number(event.target.value) })}
            className="tabular-nums"
          >
            {START_TIMES.map((minutes) => (
              <NativeSelectOption key={minutes} value={minutes}>
                {minutesToTime(minutes)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <span className="text-muted-foreground">–</span>
          <NativeSelect
            size="sm"
            aria-label={`${label}, fin de la plage ${index + 1}`}
            value={range.end}
            onChange={(event) => update(index, { end: Number(event.target.value) })}
            className="tabular-nums"
          >
            {END_TIMES.map((minutes) => (
              <NativeSelectOption key={minutes} value={minutes}>
                {minutesToTime(minutes)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${label}, retirer la plage ${index + 1}`}
            onClick={() => onChange(ranges.filter((_, i) => i !== index))}
          >
            <XIcon />
          </Button>
        </span>
      ))}
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`${label}, ajouter une plage`} onClick={add}>
        <PlusIcon />
      </Button>
    </div>
  );
}
