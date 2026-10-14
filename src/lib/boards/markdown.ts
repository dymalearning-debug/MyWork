// Description of a card (docs/boards.md, "Description"): light Markdown. Bold, italic, bulleted and
// numbered lists, links (addresses become links by themselves). Nothing else is shown: headings,
// tables, images, quotes or code are shown as their plain text.

export const ALLOWED_ELEMENTS = ["p", "br", "strong", "em", "ul", "ol", "li", "a"];

// Only web and mail addresses become links.
export function safeLinkUrl(url: string) {
  return /^(https?:|mailto:)/i.test(url.trim()) ? url : "";
}

// ——— Keyboard, as in an AI chat ———

export type DescriptionKey = "save" | "newline" | "cancel" | "bold" | "italic" | null;

export function descriptionKeyAction(event: {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  isComposing?: boolean;
}): DescriptionKey {
  // A character being composed (accents with a dead key, Asian input methods): not ours.
  if (event.isComposing) return null;
  const modifier = event.ctrlKey || event.metaKey;
  if (event.key === "Enter" && !modifier && !event.altKey) return event.shiftKey ? "newline" : "save";
  if (event.key === "Escape") return "cancel";
  if (modifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "b") return "bold";
  if (modifier && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "i") return "italic";
  return null;
}

// ——— Editing helpers: the text, and the selection after the change ———

export type TextEdit = { value: string; selectionStart: number; selectionEnd: number };

// Bold (**) or italic (*) around the selection; removed when it is already there. Without a
// selection, the two markers with the cursor between them.
export function toggleWrap(value: string, start: number, end: number, marker: "**" | "*"): TextEdit {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const length = marker.length;
  // "**" around an italic selection is bold, not italic: look at the exact marker only.
  const wrapped =
    before.endsWith(marker) &&
    after.startsWith(marker) &&
    !(marker === "*" && before.endsWith("**") && after.startsWith("**") && !before.endsWith("***"));
  if (wrapped) {
    return {
      value: before.slice(0, -length) + selected + after.slice(length),
      selectionStart: start - length,
      selectionEnd: end - length,
    };
  }
  return {
    value: before + marker + selected + marker + after,
    selectionStart: start + length,
    selectionEnd: end + length,
  };
}

const LIST_ITEM = /^(\s*)(?:([-*+])|(\d{1,9})([.)]))\s+/;

function lineBounds(value: string, start: number, end: number) {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", end);
  return { lineStart, lineEnd: nextBreak === -1 ? value.length : nextBreak };
}

// Shift+Enter: a new line. In a list, the new line carries on the list (same bullet, next number);
// on an empty item, the bullet is removed and the list ends.
export function newLine(value: string, start: number, end: number): TextEdit {
  const { lineStart } = lineBounds(value, start, start);
  const lineEnd = value.indexOf("\n", start) === -1 ? value.length : value.indexOf("\n", start);
  const line = value.slice(lineStart, lineEnd);
  const match = line.match(LIST_ITEM);
  if (match && start >= lineStart + match[0].length) {
    const content = line.slice(match[0].length);
    if (content.trim() === "" && start === end) {
      // Empty item: leave the list.
      return {
        value: value.slice(0, lineStart) + value.slice(lineStart + match[0].length),
        selectionStart: lineStart,
        selectionEnd: lineStart,
      };
    }
    const [, indent, bullet, number, delimiter] = match;
    const prefix = `${indent}${bullet ?? `${Number(number) + 1}${delimiter}`} `;
    const inserted = `\n${prefix}`;
    const cursor = start + inserted.length;
    return { value: value.slice(0, start) + inserted + value.slice(end), selectionStart: cursor, selectionEnd: cursor };
  }
  const cursor = start + 1;
  return { value: `${value.slice(0, start)}\n${value.slice(end)}`, selectionStart: cursor, selectionEnd: cursor };
}

// The "Liste à puces" button: a bullet on each line of the selection, or none when they all have
// one.
export function toggleBullets(value: string, start: number, end: number): TextEdit {
  const { lineStart, lineEnd } = lineBounds(value, start, end);
  const lines = value.slice(lineStart, lineEnd).split("\n");
  const allBulleted = lines.every((line) => /^\s*[-*+]\s+/.test(line));
  const changed = lines.map((line) => (allBulleted ? line.replace(/^(\s*)[-*+]\s+/, "$1") : `- ${line}`));
  const block = changed.join("\n");
  const firstShift = changed[0].length - lines[0].length;
  return {
    value: value.slice(0, lineStart) + block + value.slice(lineEnd),
    selectionStart: Math.max(lineStart, start + firstShift),
    selectionEnd: end + (block.length - (lineEnd - lineStart)),
  };
}

// The "Lien" button: [selection](https://), with the address selected, ready to be pasted over.
export function insertLink(value: string, start: number, end: number): TextEdit {
  const text = value.slice(start, end) || "lien";
  const inserted = `[${text}](https://)`;
  const urlStart = start + text.length + 3;
  return {
    value: value.slice(0, start) + inserted + value.slice(end),
    selectionStart: urlStart,
    selectionEnd: urlStart + "https://".length,
  };
}
