// The two plans (docs/billing.md): 5 € a month or 50 € a year, after a 7-day trial. The prices
// themselves live in Stripe, found by their fixed names (lookup keys); the amounts here are those
// MyWork shows, the same as the landing page.

export const PLAN_IDS = ["monthly", "yearly"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  lookupKey: string;
  name: string;
  // In cents.
  amount: number;
  // "par mois", "par an".
  per: string;
  // "/mois", after the big price.
  period: string;
  text: string;
};

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    lookupKey: "mywork_monthly",
    name: "Mensuelle",
    amount: 500,
    per: "par mois",
    period: "/mois",
    text: "Payé chaque mois. Sans engagement.",
  },
  yearly: {
    id: "yearly",
    lookupKey: "mywork_yearly",
    name: "Annuelle",
    amount: 5000,
    per: "par an",
    period: "/an",
    text: "Payé en une fois, soit 4,17 € par mois.",
  },
};

// The yearly plan, when the visitor comes without choosing: the one the landing page puts forward.
export const DEFAULT_PLAN: PlanId = "yearly";

export const TRIAL_DAYS = 7;
// The trial reminders (email, dashboard) start 3 days before its end.
export const TRIAL_REMINDER_DAYS = 3;
// After the end of a subscription, the data are kept 90 days.
export const DATA_RETENTION_DAYS = 90;

export const isPlanId = (value: unknown): value is PlanId => PLAN_IDS.includes(value as PlanId);

// The plan of an address (/signup?plan=monthly), or null.
export const parsePlan = (value: unknown): PlanId | null => (isPlanId(value) ? value : null);

export const otherPlan = (plan: PlanId): PlanId => (plan === "yearly" ? "monthly" : "yearly");

// "5 €", "4,17 €".
export function formatPrice(cents: number) {
  const euros = cents / 100;
  return `${Number.isInteger(euros) ? euros : euros.toFixed(2).replace(".", ",")} €`;
}

// "5,00 €", in the list of invoices.
export const formatAmount = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

// "Annuelle · 50 € par an".
export const planSummary = (plan: PlanId) => `${PLANS[plan].name} · ${formatPrice(PLANS[plan].amount)} ${PLANS[plan].per}`;
