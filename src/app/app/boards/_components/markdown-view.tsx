"use client";

import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import { ALLOWED_ELEMENTS, safeLinkUrl } from "@/lib/boards/markdown";
import { cn } from "@/lib/utils";

// A description shown with its light formatting (docs/boards.md, "Description"): bold, italic,
// lists and links only; anything else is shown as plain text. A line break is kept as typed.
export function MarkdownView({ value, className }: { value: string; className?: string }) {
  return (
    <div
      className={cn(
        "text-sm leading-6 break-words [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-3 hover:[&_a]:decoration-foreground [&_li]:my-0.5 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_strong]:font-semibold [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&>*:last-child]:mb-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        allowedElements={ALLOWED_ELEMENTS}
        unwrapDisallowed
        urlTransform={safeLinkUrl}
        components={{
          a: ({ href, children }) =>
            href ? (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow" onClick={(event) => event.stopPropagation()}>
                {children}
              </a>
            ) : (
              <>{children}</>
            ),
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}
