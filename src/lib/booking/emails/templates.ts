import { formatDate, formatShortDate, formatTime, formatTimeRange, timeZoneLabel } from "../format";
import { meetingWindow } from "../rules";

// The four emails of the module (docs/booking.md, "E-mails"), prepared but not sent yet. Same
// template as the authentication emails (supabase/templates/, docs/auth.md, "E-mails"): the subject
// above, a white card, the logo, a label, a title in Georgia, details in rows, a red button, the
// link in plain text. Fixed colors: mail clients ignore CSS variables; the red of "Annulé" is
// #a3261f (from `destructive`). Mockups: planches "E-mail — …".

export type BookingEmailTemplate = "guest_confirmation" | "owner_new_booking" | "guest_cancelled" | "owner_cancelled";

// The data saved with each email in the queue (booking_emails.data). Dates in ISO, in UTC; the
// time zone is the recipient's; path is completed with the address of the site when sending.
export type GuestConfirmationData = {
  ownerName: string;
  guestName: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  path: string;
};
export type OwnerNewBookingData = GuestConfirmationData & {
  guestEmail: string;
  guestRole: string | null;
  guestCompany: string | null;
  message: string;
};
export type GuestCancelledData = GuestConfirmationData & { message: string | null };
export type OwnerCancelledData = Omit<GuestConfirmationData, "ownerName"> & { message: string | null };

export type BookingEmailData = {
  guest_confirmation: GuestConfirmationData;
  owner_new_booking: OwnerNewBookingData;
  guest_cancelled: GuestCancelledData;
  owner_cancelled: OwnerCancelledData;
};

export type RenderedEmail = { subject: string; html: string; text: string; withIcs: boolean };

const INK = "#0e0d0c";
const MUTED = "#656360";
const BORDER = "#e2e1df";
const PAPER = "#f6f5f4";
const RED = "#cd171e";
const CANCELLED = "#a3261f";

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

// ——— Pieces of the template ———

const label = (text: string, color = MUTED) =>
  `<p style="margin:0 0 20px;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${escape(text)}</p>`;

const title = (text: string) =>
  `<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:normal;color:${INK};">${escape(text)}</h1>`;

const paragraph = (html: string, { small = false } = {}) =>
  `<p style="margin:0 0 20px;font-size:${small ? 13 : 15}px;line-height:${small ? 20 : 23}px;color:${small ? MUTED : INK};">${html}</p>`;

function rows(items: [string, string][]) {
  const cells = items
    .map(
      ([key, value]) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;line-height:20px;color:${MUTED};">${escape(key)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;line-height:20px;color:${INK};">${escape(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${BORDER};">${cells}</table>`;
}

function quote(heading: string, text: string, { italic = false } = {}) {
  const style = italic
    ? `font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:26px;`
    : "font-size:15px;line-height:23px;";
  return `${label(heading)}<p style="margin:-12px 0 24px;${style}color:${INK};background:${PAPER};padding:14px 16px;white-space:pre-line;">${escape(text)}</p>`;
}

function button(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="background:${RED};"><a href="${escape(href)}" style="display:inline-block;padding:14px 22px;font-size:12px;line-height:16px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:#fcfcfc;">${escape(text)}</a></td></tr></table>`;
}

const fallbackLink = (href: string) =>
  `<p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};word-break:break-all;">Si le bouton ne fonctionne pas : <span style="color:${INK};">${escape(href)}</span></p>`;

function layout(subject: string, body: string, origin: string) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};color:${INK};font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
        <tr>
          <td style="background:#ffffff;border:1px solid ${BORDER};padding:40px 40px 36px;">
            <img src="${escape(origin)}/brand/mywork-logo-1200.png" width="112" alt="MyWork" style="display:block;width:112px;height:auto;border:0;">
            <div style="height:1px;background:${BORDER};margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
            ${body}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">MyWork — L'espace tout-en-un des freelances</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;
}

// ——— The four emails ———

function when(data: { startAt: string; endAt: string; timeZone: string }) {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return {
    start,
    day: formatDate(start, data.timeZone),
    dayWithYear: formatDate(start, data.timeZone, { year: true }),
    shortDay: formatShortDate(start, data.timeZone),
    time: formatTime(start, data.timeZone),
    range: formatTimeRange(start, end, data.timeZone),
    zone: timeZoneLabel(data.timeZone).replace(/^Heure/, "heure"),
    opens: formatTime(meetingWindow(start, end).opensAt, data.timeZone),
  };
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// Confirmation, to the guest, with the .ics file.
function guestConfirmation(data: GuestConfirmationData, origin: string): RenderedEmail {
  const w = when(data);
  const link = `${origin}${data.path}`;
  const subject = `Rendez-vous confirmé avec ${data.ownerName}`;
  const body = [
    label("Rendez-vous confirmé"),
    title(`${w.day} à ${w.time}`),
    paragraph(`Bonjour ${escape(firstName(data.guestName))}, votre rendez-vous en visio avec ${escape(data.ownerName)} est confirmé.`),
    rows([
      ["Date", w.dayWithYear],
      ["Heure", `${w.range}, ${w.zone}`],
      ["Lieu", "Visio dans MyWork"],
    ]),
    button("Rejoindre la visio", link),
    paragraph(`La salle ouvre à ${w.opens}, 15 minutes avant le rendez-vous. Avant, le lien vous dira de revenir plus tard.`, { small: true }),
    paragraph(
      `Le fichier joint ajoute le rendez-vous à votre agenda. Un empêchement ? <a href="${escape(link)}" style="color:${INK};">Annuler le rendez-vous</a>.`,
      { small: true },
    ),
    fallbackLink(link),
  ].join("\n");
  const text = [
    `Rendez-vous confirmé : ${w.day} à ${w.time}`,
    "",
    `Bonjour ${firstName(data.guestName)}, votre rendez-vous en visio avec ${data.ownerName} est confirmé.`,
    `Date : ${w.dayWithYear}`,
    `Heure : ${w.range}, ${w.zone}`,
    "Lieu : Visio dans MyWork",
    "",
    `Rejoindre la visio ou annuler : ${link}`,
    `La salle ouvre à ${w.opens}, 15 minutes avant le rendez-vous.`,
  ].join("\n");
  return { subject, html: layout(subject, body, origin), text, withIcs: true };
}

// New booking, to the owner, with the .ics file.
function ownerNewBooking(data: OwnerNewBookingData, origin: string): RenderedEmail {
  const w = when(data);
  const link = `${origin}${data.path}`;
  const subject = `Nouveau rendez-vous : ${data.guestName}, ${w.shortDay} à ${w.time}`;
  const details: [string, string][] = [
    ["Horaire", `${w.range}, ${w.zone}`],
    ["E-mail", data.guestEmail],
    ...(data.guestRole ? ([["Fonction", data.guestRole]] as [string, string][]) : []),
    ...(data.guestCompany ? ([["Entreprise", data.guestCompany]] as [string, string][]) : []),
  ];
  const body = [
    label("Nouveau rendez-vous"),
    title(`${data.guestName} a réservé ${lowerFirst(w.day)} à ${w.time}`),
    rows(details),
    quote("Objet du rendez-vous", data.message),
    button("Voir dans MyWork", link),
    paragraph(
      `La visio se rejoint depuis « Mes rendez-vous », à partir de ${w.opens}. Le fichier joint ajoute le rendez-vous à votre agenda.`,
      { small: true },
    ),
  ].join("\n");
  const text = [
    `Nouveau rendez-vous : ${data.guestName} a réservé ${lowerFirst(w.day)} à ${w.time}`,
    "",
    ...details.map(([key, value]) => `${key} : ${value}`),
    "",
    "Objet du rendez-vous :",
    data.message,
    "",
    `Voir dans MyWork : ${link}`,
  ].join("\n");
  return { subject, html: layout(subject, body, origin), text, withIcs: true };
}

// Cancelled by the owner, to the guest.
function guestCancelled(data: GuestCancelledData, origin: string): RenderedEmail {
  const w = when(data);
  const link = `${origin}${data.path}`;
  const subject = `Rendez-vous annulé : ${data.ownerName}, ${w.shortDay} à ${w.time}`;
  const body = [
    label("Rendez-vous annulé", CANCELLED),
    title(`Votre rendez-vous du ${lowerFirst(w.day)} est annulé`),
    paragraph(
      `Bonjour ${escape(firstName(data.guestName))}, ${escape(data.ownerName)} a annulé le rendez-vous prévu à ${w.time} (${w.zone}).`,
    ),
    data.message ? quote("Son message", data.message, { italic: true }) : "",
    button("Réserver un autre créneau", link),
    fallbackLink(link),
  ].join("\n");
  const text = [
    `Votre rendez-vous du ${lowerFirst(w.day)} est annulé.`,
    "",
    `Bonjour ${firstName(data.guestName)}, ${data.ownerName} a annulé le rendez-vous prévu à ${w.time} (${w.zone}).`,
    ...(data.message ? ["", "Son message :", data.message] : []),
    "",
    `Réserver un autre créneau : ${link}`,
  ].join("\n");
  return { subject, html: layout(subject, body, origin), text, withIcs: false };
}

// Cancelled by the guest, to the owner.
function ownerCancelled(data: OwnerCancelledData, origin: string): RenderedEmail {
  const w = when(data);
  const link = `${origin}${data.path}`;
  const subject = `Rendez-vous annulé : ${data.guestName}, ${w.shortDay} à ${w.time}`;
  const body = [
    label("Rendez-vous annulé", CANCELLED),
    title(`${data.guestName} a annulé son rendez-vous du ${lowerFirst(w.day)}`),
    paragraph(`Le rendez-vous de ${w.time} est annulé. Le créneau est de nouveau libre sur votre profil.`),
    data.message ? quote("Motif", data.message, { italic: true }) : "",
    button("Voir mes rendez-vous", link),
  ].join("\n");
  const text = [
    `${data.guestName} a annulé son rendez-vous du ${lowerFirst(w.day)}.`,
    "",
    `Le rendez-vous de ${w.time} est annulé. Le créneau est de nouveau libre sur votre profil.`,
    ...(data.message ? ["", "Motif :", data.message] : []),
    "",
    `Voir mes rendez-vous : ${link}`,
  ].join("\n");
  return { subject, html: layout(subject, body, origin), text, withIcs: false };
}

export function renderBookingEmail<T extends BookingEmailTemplate>(
  template: T,
  data: BookingEmailData[T],
  origin: string,
): RenderedEmail {
  switch (template) {
    case "guest_confirmation":
      return guestConfirmation(data as GuestConfirmationData, origin);
    case "owner_new_booking":
      return ownerNewBooking(data as OwnerNewBookingData, origin);
    case "guest_cancelled":
      return guestCancelled(data as GuestCancelledData, origin);
    default:
      return ownerCancelled(data as OwnerCancelledData, origin);
  }
}

// Sample data of the showcase (/design) and of the tests: Inès Robert and Marc Dubois, fictional.
export const SAMPLE_EMAILS: { template: BookingEmailTemplate; label: string; recipient: string; data: BookingEmailData[BookingEmailTemplate] }[] = [
  {
    template: "guest_confirmation",
    label: "Confirmation (invité)",
    recipient: "marc.dubois@exemple.fr",
    data: {
      ownerName: "Inès Robert",
      guestName: "Marc Dubois",
      startAt: "2026-10-20T08:30:00Z",
      endAt: "2026-10-20T09:00:00Z",
      timeZone: "Europe/Paris",
      path: "/ines-robert/booking/k7Qm2xR9aB3dE5fG7hJ9kL1m",
    },
  },
  {
    template: "owner_new_booking",
    label: "Nouvelle réservation (propriétaire)",
    recipient: "ines.robert@exemple.fr",
    data: {
      ownerName: "Inès Robert",
      guestName: "Marc Dubois",
      guestEmail: "marc.dubois@exemple.fr",
      guestRole: "Directeur produit",
      guestCompany: "Alto",
      message: "Audit UX de notre parcours d'inscription : nous perdons beaucoup d'utilisateurs à l'étape du paiement.",
      startAt: "2026-10-20T08:30:00Z",
      endAt: "2026-10-20T09:00:00Z",
      timeZone: "Europe/Paris",
      path: "/app/booking",
    },
  },
  {
    template: "guest_cancelled",
    label: "Annulation à l'invité (par le propriétaire)",
    recipient: "marc.dubois@exemple.fr",
    data: {
      ownerName: "Inès Robert",
      guestName: "Marc Dubois",
      startAt: "2026-10-20T08:30:00Z",
      endAt: "2026-10-20T09:00:00Z",
      timeZone: "Europe/Paris",
      message: "Un imprévu ce matin-là : choisissez un autre créneau, je serai ravie d'en parler.",
      path: "/ines-robert/booking",
    },
  },
  {
    template: "owner_cancelled",
    label: "Annulation au propriétaire (par l'invité)",
    recipient: "ines.robert@exemple.fr",
    data: {
      guestName: "Marc Dubois",
      startAt: "2026-10-20T08:30:00Z",
      endAt: "2026-10-20T09:00:00Z",
      timeZone: "Europe/Paris",
      message: "Notre réunion de direction a été déplacée.",
      path: "/app/booking?filter=cancelled",
    },
  },
];
