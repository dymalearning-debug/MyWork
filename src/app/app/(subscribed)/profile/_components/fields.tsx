"use client";

import { XIcon } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { MONTH_NAMES } from "@/lib/profile/dates";
import type { YearMonth } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

// Fields of "Mon profil": a label above, the error below, the counter of the long texts.

export type FieldErrors = Record<string, string | undefined>;

export function Field({
  id,
  label,
  error,
  hint,
  counter,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  counter?: { length: number; max: number };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {(error || hint || counter) && (
        <div className="flex items-start gap-3 text-xs">
          {error ? (
            <p id={`${id}-error`} className="text-destructive">
              {error}
            </p>
          ) : (
            hint && <p className="text-muted-foreground">{hint}</p>
          )}
          {counter && (
            <p
              className={cn(
                "ml-auto shrink-0 text-muted-foreground tabular-nums",
                counter.length > counter.max && "text-destructive",
              )}
            >
              {counter.length.toLocaleString("fr-FR")} / {counter.max.toLocaleString("fr-FR")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// aria-invalid and aria-describedby of a control, from its field's error.
export function errorProps(id: string, error?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}

export function TextField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  maxLength,
  required,
  className,
  ...props
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: React.ReactNode;
  maxLength?: number;
  required?: boolean;
  className?: string;
} & Omit<React.ComponentProps<"input">, "id" | "value" | "onChange" | "className">) {
  return (
    <Field id={id} label={required ? `${label} *` : label} error={error} hint={hint} className={className}>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        {...errorProps(id, error)}
        {...props}
      />
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  error,
  max,
  required,
  rows = 4,
  className,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max: number;
  required?: boolean;
  rows?: number;
  className?: string;
  placeholder?: string;
}) {
  return (
    <Field
      id={id}
      label={required ? `${label} *` : label}
      error={error}
      counter={{ length: value.trim().length, max }}
      className={className}
    >
      <Textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24"
        {...errorProps(id, error)}
      />
    </Field>
  );
}

// "Début", "Fin"…: an optional month and a year. Empty month and year: no date.
export function YearMonthField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  disabled,
  className,
}: {
  id: string;
  label: string;
  value: YearMonth | null;
  onChange: (value: YearMonth | null) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const year = value && Number.isFinite(value.year) ? String(value.year) : "";
  const month = value?.month ?? null;

  function change(nextYear: string, nextMonth: number | null) {
    const digits = nextYear.replace(/\D/g, "").slice(0, 4);
    if (!digits && nextMonth === null) onChange(null);
    else onChange({ year: digits ? Number(digits) : Number.NaN, month: nextMonth });
  }

  return (
    <Field id={id} label={required ? `${label} *` : label} error={error} className={className}>
      <div className="flex gap-2">
        <NativeSelect
          aria-label={`${label} : mois`}
          value={month === null ? "" : String(month)}
          onChange={(event) => change(year, event.target.value ? Number(event.target.value) : null)}
          disabled={disabled}
          className="min-w-0 flex-1"
        >
          <NativeSelectOption value="">Mois</NativeSelectOption>
          {MONTH_NAMES.map((name, index) => (
            <NativeSelectOption key={name} value={index + 1}>
              {name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          id={id}
          aria-label={`${label} : année`}
          inputMode="numeric"
          placeholder="Année"
          value={year}
          onChange={(event) => change(event.target.value, month)}
          disabled={disabled}
          className="w-24 tabular-nums"
          {...errorProps(id, error)}
        />
      </div>
    </Field>
  );
}

// Skills of an experience or a project: chips, and a field that adds one with Enter or a comma.
// Suggestions come from the list of skills; a new one is added to it (docs/profile.md, "Compétences").
export function SkillsField({
  id,
  label,
  value,
  onChange,
  suggestions,
}: {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  function add(raw: string) {
    const name = raw.replace(/\s+/g, " ").trim();
    setDraft("");
    if (!name || value.some((skill) => skill.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"))) return;
    // Same writing as in the list, when the skill is already there.
    const known = suggestions.find((skill) => skill.toLocaleLowerCase("fr") === name.toLocaleLowerCase("fr"));
    onChange([...value, known ?? name]);
  }

  return (
    <Field id={id} label={label} hint="Entrée pour ajouter. Une nouvelle compétence rejoint votre liste.">
      <div className="flex flex-wrap items-center gap-1.5">
        {value.map((skill) => (
          <span key={skill} className="eyebrow inline-flex h-7 items-center gap-1 border border-border pr-1 pl-2.5">
            {skill}
            <button
              type="button"
              aria-label={`Retirer ${skill}`}
              onClick={() => onChange(value.filter((item) => item !== skill))}
              className="inline-flex size-5 items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <Input
          id={id}
          value={draft}
          list={listId}
          placeholder="Ajouter une compétence"
          maxLength={50}
          onChange={(event) => {
            const next = event.target.value;
            if (next.endsWith(",")) add(next.slice(0, -1));
            else setDraft(next);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(draft);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          className="h-7 w-48 min-w-0 flex-1"
        />
        <datalist id={listId}>
          {suggestions
            .filter((skill) => !value.includes(skill))
            .map((skill) => (
              <option key={skill} value={skill} />
            ))}
        </datalist>
      </div>
    </Field>
  );
}
