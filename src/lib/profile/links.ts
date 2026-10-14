// Links of the profile (docs/profile.md, "Coordonnées"): http or https only, "https://" added when
// it is missing. The icon is recognized from the address, otherwise a globe.

// Known sites: the icon key (src/components/site-icon.tsx) and the name shown without a label.
const SITES: { key: string; name: string; domains: string[] }[] = [
  { key: "linkedin", name: "LinkedIn", domains: ["linkedin.com", "lnkd.in"] },
  { key: "github", name: "GitHub", domains: ["github.com"] },
  { key: "gitlab", name: "GitLab", domains: ["gitlab.com"] },
  { key: "malt", name: "Malt", domains: ["malt.fr", "malt.com", "malt.es", "malt.de", "malt.be", "malt.nl", "malt.ch"] },
  { key: "x", name: "X", domains: ["x.com", "twitter.com"] },
  { key: "instagram", name: "Instagram", domains: ["instagram.com"] },
  { key: "behance", name: "Behance", domains: ["behance.net"] },
  { key: "dribbble", name: "Dribbble", domains: ["dribbble.com"] },
  { key: "youtube", name: "YouTube", domains: ["youtube.com", "youtu.be"] },
  { key: "vimeo", name: "Vimeo", domains: ["vimeo.com"] },
  { key: "figma", name: "Figma", domains: ["figma.com"] },
  { key: "medium", name: "Medium", domains: ["medium.com"] },
  { key: "substack", name: "Substack", domains: ["substack.com"] },
  { key: "bluesky", name: "Bluesky", domains: ["bsky.app"] },
  { key: "mastodon", name: "Mastodon", domains: ["mastodon.social"] },
  { key: "threads", name: "Threads", domains: ["threads.net", "threads.com"] },
  { key: "facebook", name: "Facebook", domains: ["facebook.com", "fb.com"] },
  { key: "tiktok", name: "TikTok", domains: ["tiktok.com"] },
  { key: "stackoverflow", name: "Stack Overflow", domains: ["stackoverflow.com"] },
];

export type SiteKey = string;

// "linkedin.com/in/ines" gives "https://linkedin.com/in/ines". Spaces around are removed.
// Empty stays empty; another scheme (ftp:, javascript:…) is left as is, and refused by isValidUrl.
export function normalizeUrl(input: string) {
  const value = input.trim();
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^[^:/]+:\d+/.test(value)) {
    return /^https?:/i.test(value) ? value.replace(/^https?/i, (scheme) => scheme.toLowerCase()) : value;
  }
  return `https://${value.replace(/^\/+/, "")}`;
}

export function isValidUrl(value: string) {
  if (!/^https?:\/\/[^\s]+$/.test(value) || value.length > 500) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

// The site of an address: its icon key ("globe" when unknown) and its name ("Malt", or the
// address of the site itself: "ines-robert.fr").
export function siteOf(url: string): { key: SiteKey; name: string } {
  const hostname = hostnameOf(url);
  const site = SITES.find(({ domains }) =>
    domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`)),
  );
  return site ? { key: site.key, name: site.name } : { key: "globe", name: hostname || url };
}

// What a link shows: its label, or the name of the site.
export function linkText(link: { url: string; label: string }) {
  return link.label.trim() || siteOf(link.url).name;
}

// The address without "https://" nor a final "/", for the forms: "linkedin.com/in/ines".
export function shortUrl(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}
