// The pieces of MyWork's emails, sent with Resend: those of the Rendez-vous module
// (src/lib/booking/emails/) and of the subscription (src/lib/billing/emails/). Same template as the
// authentication emails (supabase/templates/, docs/auth.md, "E-mails"): a white card, the logo, a
// label, a title in Georgia, details in rows, a red button, the link in plain text. Fixed colors:
// mail clients ignore CSS variables; the red of "Annulé" is #a3261f (from `destructive`).

export const EMAIL_SENDER = "MyWork <noreply@hellomywork.com>";

export const INK = "#0e0d0c";
export const MUTED = "#656360";
export const BORDER = "#e2e1df";
export const PAPER = "#f6f5f4";
export const RED = "#cd171e";
export const CANCELLED = "#a3261f";

export type RenderedEmail = { subject: string; html: string; text: string };

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  attachments?: { filename: string; content: string; contentType: string }[];
};

export const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

// Addresses reserved for tests and examples (RFC 2606 and 6761): never sent, so that the
// automatic tests do not harm the reputation of the domain.
export function isTestAddress(address: string) {
  const domain = address.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return true;
  return (
    /(^|\.)example\.(com|net|org)$/.test(domain) || /\.(test|example|invalid|localhost)$/.test(domain)
  );
}

export const label = (text: string, color = MUTED) =>
  `<p style="margin:0 0 20px;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${escape(text)}</p>`;

export const title = (text: string) =>
  `<h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:38px;font-weight:normal;color:${INK};">${escape(text)}</h1>`;

export const paragraph = (html: string, { small = false } = {}) =>
  `<p style="margin:0 0 20px;font-size:${small ? 13 : 15}px;line-height:${small ? 20 : 23}px;color:${small ? MUTED : INK};">${html}</p>`;

export function rows(items: [string, string][]) {
  const cells = items
    .map(
      ([key, value]) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;line-height:20px;color:${MUTED};">${escape(key)}</td><td align="right" style="padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;line-height:20px;color:${INK};">${escape(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-top:1px solid ${BORDER};">${cells}</table>`;
}

// A numbered list: "Pour bien démarrer".
export function orderedList(items: string[]) {
  const lines = items.map((html) => `<li style="margin:0 0 6px;">${html}</li>`).join("");
  return `<ol style="margin:0 0 24px;padding-left:20px;font-size:15px;line-height:23px;color:${INK};">${lines}</ol>`;
}

export function quote(heading: string, text: string, { italic = false } = {}) {
  const style = italic
    ? `font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;line-height:26px;`
    : "font-size:15px;line-height:23px;";
  return `${label(heading)}<p style="margin:-12px 0 24px;${style}color:${INK};background:${PAPER};padding:14px 16px;white-space:pre-line;">${escape(text)}</p>`;
}

export function button(text: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;"><tr><td style="background:${RED};"><a href="${escape(href)}" style="display:inline-block;padding:14px 22px;font-size:12px;line-height:16px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:#fcfcfc;">${escape(text)}</a></td></tr></table>`;
}

export const fallbackLink = (href: string) =>
  `<p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};word-break:break-all;">Si le bouton ne fonctionne pas : <span style="color:${INK};">${escape(href)}</span></p>`;

export function layout(subject: string, body: string, origin: string) {
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
