// Public profile handle (docs/public-profile.md, "Identifiant public"): lowercase letters without
// accents, digits and dashes, 3 to 30 characters. The handle is built by the database, which
// enforces the same format; this check spares it a query for addresses that can never be a profile.
const HANDLE_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidHandle(value: string) {
  return value.length >= 3 && value.length <= 30 && HANDLE_PATTERN.test(value);
}

export function publicProfilePath(handle: string) {
  return `/${handle}`;
}
