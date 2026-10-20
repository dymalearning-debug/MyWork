import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { VisitTab } from "./rules";

// The dashboard (docs/dashboard.md), read as the signed-in owner, in one call (get_own_dashboard).
// Today's bookings are read by the Rendez-vous module (getOwnBookingsOfDay).

export type Signal = { count: number; lastAt: string | null };

export type Dashboard = {
  visitors7: number;
  visitorsPrevious7: number;
  visitors30: number;
  visitorsPrevious30: number;
  // The last 30 days, the oldest first ("yyyy-MM-dd", days of Paris).
  daily: { day: string; visitors: number }[];
  tabs: Record<VisitTab, number>;
  signals: {
    bookings: Signal;
    contact: Signal;
    cv: Signal;
    resources: Signal & { top: { name: string; count: number } | null };
  };
  isOnline: boolean;
  bookingOpen: boolean;
  storageUsed: number;
  storageCapacity: number;
};

export async function getOwnDashboard(): Promise<Dashboard> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_dashboard");
  if (error) throw new Error(`Dashboard read failed: ${error.message}`);
  const row = data as Dashboard;
  return { ...row, storageUsed: Number(row.storageUsed), storageCapacity: Number(row.storageCapacity) };
}
