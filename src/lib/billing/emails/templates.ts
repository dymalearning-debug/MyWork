import {
  button,
  escape,
  fallbackLink,
  label,
  layout,
  orderedList,
  paragraph,
  rows,
  title,
  type RenderedEmail,
} from "@/lib/emails/parts";

import { DATA_RETENTION_DAYS, formatPrice, planSummary, PLANS, TRIAL_DAYS, type PlanId } from "../plans";
import { cardLabel, daysLeft, formatLongDate, formatPlainDate, type Card } from "../rules";

// The emails of the subscription sent by MyWork (docs/billing.md, "E-mails"), in the template of
// MyWork's emails (src/lib/emails/parts.ts). Mockups: planches "E-mail — …" of the subscription.
// Receipts, invoices and refused payments are sent by Stripe. The email before the deletion of the
// data comes with that deletion (docs/billing.md, "Reste à faire").

export type BillingEmailKind = "welcome" | "trial_ending" | "goodbye" | "ended";

// What the emails need, from the subscription and the profile (src/lib/billing/data.ts). Dates in
// ISO; sentAt: when the email leaves (the days left of the trial).
export type BillingEmailData = {
  firstName: string | null;
  handle: string;
  plan: PlanId;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
  card: Pick<Card, "brand" | "last4"> | null;
  bookingsAfterEnd: number;
  cancelledBookings: number;
  sentAt: string;
};

const DAY = 86_400_000;
const date = (value: string | null) => (value ? new Date(value) : null);
const afterRetention = (from: Date) => new Date(from.getTime() + DATA_RETENTION_DAYS * DAY);
const host = (origin: string) => origin.replace(/^https?:\/\//, "");
const cardRow = (card: BillingEmailData["card"]): [string, string][] =>
  card ? [["Carte", cardLabel(card)]] : [];

// At the subscription, with or without a trial (a new subscription after an ended one).
function welcome(data: BillingEmailData, origin: string): RenderedEmail {
  const plan = PLANS[data.plan];
  const trialEnd = date(data.trialEnd);
  const nextCharge = trialEnd ?? date(data.currentPeriodEnd);
  const link = `${origin}/app`;
  const address = `${host(origin)}/${data.handle}`;
  const subject = "Bienvenue dans MyWork";
  const opening = trialEnd
    ? `Votre essai de ${TRIAL_DAYS} jours commence aujourd'hui. Tout MyWork vous est ouvert : profil public, rendez-vous avec visio, tableaux de tâches et 10 Go de fichiers.`
    : "Votre abonnement est actif. Tout MyWork vous est ouvert : profil public, rendez-vous avec visio, tableaux de tâches et 10 Go de fichiers.";
  const details: [string, string][] = [
    ["Formule", planSummary(data.plan)],
    ...(trialEnd ? ([["Fin de l'essai", formatLongDate(trialEnd)]] as [string, string][]) : []),
    ...(nextCharge
      ? ([[trialEnd ? "Premier prélèvement" : "Prochain prélèvement", `${formatPrice(plan.amount)} le ${formatPlainDate(nextCharge)}`]] as [string, string][])
      : []),
    ...cardRow(data.card),
  ];
  const steps = [
    "Complétez votre profil, puis mettez-le en ligne.",
    "Ouvrez vos créneaux de rendez-vous.",
    `Partagez votre adresse : <span style="font-weight:bold;">${escape(address)}</span>`,
  ];
  const cancel = trialEnd
    ? "Vous pouvez résilier à tout moment dans Paramètres › Abonnement. Pendant l'essai, cela ne vous coûte rien."
    : "Vous pouvez résilier à tout moment dans Paramètres › Abonnement.";
  const body = [
    label("Abonnement"),
    title(data.firstName ? `Bienvenue, ${data.firstName}` : "Bienvenue dans MyWork"),
    paragraph(escape(opening)),
    rows(details),
    label("Pour bien démarrer"),
    orderedList(steps),
    button("Ouvrir mon espace", link),
    paragraph(escape(cancel), { small: true }),
    fallbackLink(link),
  ].join("\n");
  const text = [
    data.firstName ? `Bienvenue, ${data.firstName}` : "Bienvenue dans MyWork",
    "",
    opening,
    ...details.map(([key, value]) => `${key} : ${value}`),
    "",
    "Pour bien démarrer :",
    "1. Complétez votre profil, puis mettez-le en ligne.",
    "2. Ouvrez vos créneaux de rendez-vous.",
    `3. Partagez votre adresse : ${address}`,
    "",
    `Ouvrir mon espace : ${link}`,
    cancel,
  ].join("\n");
  return { subject, html: layout(subject, body, origin), text };
}

// 3 days before the end of the trial: promised by the landing page.
function trialEnding(data: BillingEmailData, origin: string): RenderedEmail {
  const plan = PLANS[data.plan];
  const end = date(data.trialEnd) ?? new Date(data.sentAt);
  const days = Math.max(1, daysLeft(end, new Date(data.sentAt)));
  const link = `${origin}/app?settings=billing`;
  const subject = `Votre essai se termine le ${formatPlainDate(end, { year: false })}`;
  const charge = `${formatPrice(plan.amount)} pour ${data.plan === "yearly" ? "un an" : "un mois"}`;
  const opening = `Sans action de votre part, votre abonnement démarre ${formatLongDate(end, { year: false })}. Nous vous prélèverons alors ${charge}.`;
  const details: [string, string][] = [
    ["Formule", plan.name],
    ["Premier prélèvement", formatPrice(plan.amount)],
    ["Date", formatLongDate(end)],
    ...cardRow(data.card),
  ];
  const cancel = `Pour ne rien payer, résiliez avant le ${formatPlainDate(end, { year: false })} dans Paramètres › Abonnement. Vous gardez l'accès jusqu'à la fin de l'essai.`;
  const heading = days === 1 ? "Plus qu'un jour d'essai" : `Plus que ${days} jours d'essai`;
  const body = [
    label("Essai gratuit"),
    title(heading),
    paragraph(escape(opening)),
    rows(details),
    button("Gérer mon abonnement", link),
    paragraph(escape(cancel), { small: true }),
    fallbackLink(link),
  ].join("\n");
  const text = [heading, "", opening, ...details.map(([key, value]) => `${key} : ${value}`), "", `Gérer mon abonnement : ${link}`, cancel].join(
    "\n",
  );
  return { subject, html: layout(subject, body, origin), text };
}

// When the subscriber cancels: the access stays open until the end of the paid period.
function goodbye(data: BillingEmailData, origin: string): RenderedEmail {
  const end = date(data.cancelAt) ?? date(data.currentPeriodEnd) ?? new Date(data.sentAt);
  const inTrial = !!data.trialEnd && new Date(data.trialEnd).getTime() >= end.getTime() - DAY;
  const link = `${origin}/app?settings=billing`;
  const subject = "Votre abonnement est résilié";
  const opening = inTrial
    ? "Votre résiliation est bien enregistrée. Rien ne vous sera prélevé, et votre accès reste ouvert jusqu'à la fin de l'essai."
    : "Votre résiliation est bien enregistrée. Rien ne vous sera plus prélevé, et votre accès reste ouvert jusqu'à la fin de la période payée.";
  const details: [string, string][] = [
    ["Fin de l'accès", formatLongDate(end)],
    ["Profil public", "hors ligne à cette date"],
    ...(data.bookingsAfterEnd > 0
      ? ([["Rendez-vous à venir", `${data.bookingsAfterEnd}, annulé${data.bookingsAfterEnd > 1 ? "s" : ""} à cette date`]] as [string, string][])
      : []),
    ["Vos données", `gardées jusqu'au ${formatPlainDate(afterRetention(end))}`],
  ];
  const back = `Vous changez d'avis ? Reprenez votre abonnement d'un clic, jusqu'au ${formatPlainDate(end)}.`;
  const heading = data.firstName ? `Au revoir, ${data.firstName}` : "Au revoir";
  const body = [
    label("Résiliation"),
    title(heading),
    paragraph(escape(opening)),
    rows(details),
    paragraph(escape(back)),
    button("Reprendre mon abonnement", link),
    fallbackLink(link),
  ].join("\n");
  const text = [heading, "", opening, ...details.map(([key, value]) => `${key} : ${value}`), "", back, `Reprendre mon abonnement : ${link}`].join(
    "\n",
  );
  return { subject, html: layout(subject, body, origin), text };
}

// The day the access closes.
function ended(data: BillingEmailData, origin: string): RenderedEmail {
  const until = afterRetention(new Date(data.sentAt));
  const link = `${origin}/app/subscribe`;
  const subject = "Votre espace MyWork est en pause";
  const opening = "Votre abonnement s'est terminé aujourd'hui. Votre profil public est hors ligne et vos réservations sont fermées.";
  const bookings =
    data.cancelledBookings > 0
      ? data.cancelledBookings === 1
        ? "Votre rendez-vous à venir a été annulé, et votre invité prévenu par e-mail."
        : `Vos ${data.cancelledBookings} rendez-vous à venir ont été annulés, et vos invités prévenus par e-mail.`
      : null;
  const kept = `Vos données sont gardées jusqu'au ${formatLongDate(until)} : réabonnez-vous d'ici là pour tout retrouver, comme avant.`;
  const body = [
    label("Abonnement terminé"),
    title("Votre espace est en pause"),
    paragraph(escape(opening)),
    bookings ? paragraph(escape(bookings)) : "",
    paragraph(escape(kept)),
    button("Me réabonner", link),
    fallbackLink(link),
  ].join("\n");
  const text = ["Votre espace est en pause", "", opening, ...(bookings ? [bookings] : []), kept, "", `Me réabonner : ${link}`].join("\n");
  return { subject, html: layout(subject, body, origin), text };
}

export function renderBillingEmail(kind: BillingEmailKind, data: BillingEmailData, origin: string): RenderedEmail {
  switch (kind) {
    case "welcome":
      return welcome(data, origin);
    case "trial_ending":
      return trialEnding(data, origin);
    case "goodbye":
      return goodbye(data, origin);
    default:
      return ended(data, origin);
  }
}

// Sample data of the showcase (/design) and of the tests: Jeanne Martin, fictional, yearly plan,
// signed up on Wednesday 21 October 2026.
const SAMPLE: BillingEmailData = {
  firstName: "Jeanne",
  handle: "jeanne-martin",
  plan: "yearly",
  trialEnd: "2026-10-28T10:00:00Z",
  currentPeriodEnd: "2026-10-28T10:00:00Z",
  cancelAt: null,
  card: { brand: "visa", last4: "4242" },
  bookingsAfterEnd: 0,
  cancelledBookings: 0,
  sentAt: "2026-10-21T10:00:00Z",
};

export const SAMPLE_BILLING_EMAILS: { kind: BillingEmailKind; label: string; data: BillingEmailData }[] = [
  { kind: "welcome", label: "Bienvenue", data: SAMPLE },
  { kind: "trial_ending", label: "Fin de l'essai (3 jours avant)", data: { ...SAMPLE, sentAt: "2026-10-25T10:00:00Z" } },
  {
    kind: "goodbye",
    label: "Au revoir (résiliation)",
    data: {
      ...SAMPLE,
      trialEnd: null,
      currentPeriodEnd: "2027-10-28T10:00:00Z",
      cancelAt: "2027-10-28T10:00:00Z",
      bookingsAfterEnd: 3,
      sentAt: "2027-03-02T10:00:00Z",
    },
  },
  {
    kind: "ended",
    label: "Abonnement terminé",
    data: { ...SAMPLE, trialEnd: null, cancelledBookings: 3, sentAt: "2027-10-28T10:00:00Z" },
  },
];
