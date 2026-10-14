import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MarkdownView } from "@/app/app/boards/_components/markdown-view";

import { descriptionKeyAction, insertLink, newLine, toggleBullets, toggleWrap, type TextEdit } from "./markdown";

type Modifiers = Partial<Record<"shiftKey" | "ctrlKey" | "metaKey" | "altKey" | "isComposing", boolean>>;
const key = (name: string, modifiers: Modifiers = {}) =>
  descriptionKeyAction({ key: name, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...modifiers });

// The text with the cursor drawn as | and the selection as [ ], before and after the change.
function edit(fn: (value: string, start: number, end: number) => TextEdit, marked: string) {
  const hasSelection = marked.includes("[");
  const start = hasSelection ? marked.indexOf("[") : marked.indexOf("|");
  const value = hasSelection ? marked.replace("[", "").replace("]", "") : marked.replace("|", "");
  const end = hasSelection ? marked.indexOf("]") - 1 : start;
  const result = fn(value, start, end);
  const { selectionStart: s, selectionEnd: e } = result;
  return s === e
    ? `${result.value.slice(0, s)}|${result.value.slice(s)}`
    : `${result.value.slice(0, s)}[${result.value.slice(s, e)}]${result.value.slice(e)}`;
}

const render = (value: string) => renderToStaticMarkup(createElement(MarkdownView, { value }));

describe("descriptionKeyAction", () => {
  it("works like an AI chat: Enter saves, Shift+Enter goes to the line, Escape cancels", () => {
    expect(key("Enter")).toBe("save");
    expect(key("Enter", { shiftKey: true })).toBe("newline");
    expect(key("Escape")).toBe("cancel");
  });

  it("puts the selection in bold or italic with Ctrl+B and Ctrl+I (Cmd on a Mac)", () => {
    expect(key("b", { ctrlKey: true })).toBe("bold");
    expect(key("I", { metaKey: true })).toBe("italic");
    expect(key("b")).toBeNull();
  });

  it("leaves the keys of a character being composed alone", () => {
    expect(key("Enter", { isComposing: true })).toBeNull();
  });
});

describe("editing helpers", () => {
  it("puts bold or italic around the selection, and removes it", () => {
    expect(edit((v, s, e) => toggleWrap(v, s, e, "**"), "un [mot] ici")).toBe("un **[mot]** ici");
    expect(edit((v, s, e) => toggleWrap(v, s, e, "**"), "un **[mot]** ici")).toBe("un [mot] ici");
    expect(edit((v, s, e) => toggleWrap(v, s, e, "*"), "un [mot]")).toBe("un *[mot]*");
    expect(edit((v, s, e) => toggleWrap(v, s, e, "*"), "un **[mot]**")).toBe("un ***[mot]***");
    expect(edit((v, s, e) => toggleWrap(v, s, e, "**"), "a|")).toBe("a**|**");
  });

  it("carries on a list on a new line", () => {
    expect(edit(newLine, "- Panier|")).toBe("- Panier\n- |");
    expect(edit(newLine, "  * Panier|")).toBe("  * Panier\n  * |");
    expect(edit(newLine, "1. Panier|")).toBe("1. Panier\n2. |");
    expect(edit(newLine, "Texte|")).toBe("Texte\n|");
  });

  it("ends the list on an empty item", () => {
    expect(edit(newLine, "- Panier\n- |")).toBe("- Panier\n|");
  });

  it("adds or removes bullets on the selected lines", () => {
    expect(edit(toggleBullets, "[un\ndeux]")).toBe("- [un\n- deux]");
    expect(edit(toggleBullets, "[- un\n- deux]")).toBe("[un\ndeux]");
  });

  it("makes a link with the address selected", () => {
    expect(edit(insertLink, "voir [Figma]")).toBe("voir [Figma]([https://])");
  });
});

describe("MarkdownView", () => {
  it("shows bold, italic, lists and links", () => {
    const html = render("**gras** et *italique*\n\n- un\n- deux\n\n1. premier\n\n[site](https://exemple.fr)");
    expect(html).toContain("<strong>gras</strong>");
    expect(html).toContain("<em>italique</em>");
    expect(html).toContain("<ul>");
    expect(html).toContain("<ol>");
    expect(html).toContain('href="https://exemple.fr"');
  });

  it("turns addresses into links and keeps line breaks", () => {
    expect(render("voir www.exemple.fr")).toContain('href="http://www.exemple.fr"');
    expect(render("une\ndeux")).toContain("<br/>");
  });

  it("shows nothing else than the allowed elements: headings, quotes, code, tables, images become text", () => {
    const html = render(
      "# Titre\n\n> citation\n\n`code`\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n![image](https://exemple.fr/i.png)\n\n<script>alert(1)</script>",
    );
    for (const tag of ["<h1", "<blockquote", "<code", "<table", "<img", "<script"]) expect(html).not.toContain(tag);
    expect(html).toContain("Titre");
    expect(html).toContain("citation");
  });

  it("never makes a link to a script", () => {
    expect(render("[clic](javascript:alert(1))")).not.toContain("javascript:");
  });
});
