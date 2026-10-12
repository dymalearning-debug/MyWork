import { isValidHandle } from "@/lib/public-profile/handle";

// "Profil" page of the Settings (docs/settings.md): first and last name (optional) and the
// handle, which makes the address of the public profile. Saved together by "Enregistrer".
export type ProfileSettings = {
  firstName: string;
  lastName: string;
  handle: string;
};

export const NAME_MAX_LENGTH = 100;

export function isProfileSettings(value: unknown): value is ProfileSettings {
  if (!value || typeof value !== "object") return false;
  const { firstName, lastName, handle } = value as Record<string, unknown>;
  return typeof firstName === "string" && typeof lastName === "string" && typeof handle === "string";
}

// What the user typed, cleaned up: names without surrounding spaces (empty: no name),
// handle in lowercase.
export function normalizeProfileSettings(values: ProfileSettings): ProfileSettings {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    handle: values.handle.trim().toLowerCase(),
  };
}

// Same rules as the database (format of the handle, length of the names). The database also
// checks that the handle is free and not a reserved word.
export function areValidProfileSettings(values: ProfileSettings) {
  return (
    values.firstName.length <= NAME_MAX_LENGTH &&
    values.lastName.length <= NAME_MAX_LENGTH &&
    isValidHandle(values.handle)
  );
}

export function hasChanges(saved: ProfileSettings, current: ProfileSettings) {
  return (
    saved.firstName !== current.firstName ||
    saved.lastName !== current.lastName ||
    saved.handle !== current.handle
  );
}

const ADDRESS = "adresse du profil public";

// Detail of the notification after a save, which says what changed:
// "Prénom modifié.", "Adresse du profil public modifiée.", "Prénom, nom et adresse du profil public modifiés."
export function changeSummary(saved: ProfileSettings, next: ProfileSettings) {
  const changes: string[] = [];
  if (next.firstName !== saved.firstName) changes.push("prénom");
  if (next.lastName !== saved.lastName) changes.push("nom");
  if (next.handle !== saved.handle) changes.push(ADDRESS);
  if (changes.length === 0) return "";

  const list =
    changes.length === 1 ? changes[0] : `${changes.slice(0, -1).join(", ")} et ${changes[changes.length - 1]}`;
  const ending = changes.length > 1 ? "modifiés" : changes[0] === ADDRESS ? "modifiée" : "modifié";
  return `${list.charAt(0).toUpperCase()}${list.slice(1)} ${ending}.`;
}

// The name shown at the bottom of the sidebar: first and last name, or the email address
// when there are none.
export function displayName(profile: { firstName: string; lastName: string }, email: string) {
  return `${profile.firstName} ${profile.lastName}`.trim() || email;
}
