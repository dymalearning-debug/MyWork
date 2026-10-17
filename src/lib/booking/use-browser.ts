import { useSyncExternalStore } from "react";

import { isKnownTimeZone } from "./time";

// What only the browser knows, read without a second render: the visitor's time zone, the address
// of the site. On the server (and at hydration), the given fallback.

const subscribe = () => () => {};

function browserTimeZone() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return zone && isKnownTimeZone(zone) ? zone : null;
}

export function useBrowserTimeZone(fallback: string) {
  return useSyncExternalStore(
    subscribe,
    () => browserTimeZone() ?? fallback,
    () => fallback,
  );
}

export function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
