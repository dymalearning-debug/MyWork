"use client";

import { useEffect } from "react";

import type { VisitTab } from "@/lib/dashboard/rules";

import { recordProfileVisit } from "../actions";

// Counts the visit of a tab of the public profile for the owner's dashboard (docs/dashboard.md),
// once the page is shown in a browser. Draws nothing; a visitor is counted once a day per tab.
export function VisitTracker({ handle, tab }: { handle: string; tab: VisitTab }) {
  useEffect(() => {
    void recordProfileVisit(handle, tab).catch(() => {});
  }, [handle, tab]);
  return null;
}
