import { cn } from "@/lib/utils";

// Photo of a profile (docs/profile.md, "En-tête"): square, or the initials on an ink square without
// a photo. Sized by its className (size and text size of the initials).
export function ProfilePhoto({
  url,
  initials,
  className,
}: {
  url: string | null;
  initials: string;
  className?: string;
}) {
  if (url) {
    return (
      // A plain image: the photo comes from the storage or from Google, sized by the page.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className={cn("shrink-0 bg-muted object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-foreground font-heading font-medium text-background select-none",
        className,
      )}
    >
      {initials}
    </span>
  );
}
