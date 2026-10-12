import { OfflineBanner, PublicPage, PublicPageHeading } from "@/components/public-page";
import { getProfileView } from "@/lib/public-profile/data";

// Public profile (docs/public-profile.md): /<handle> and, with the modules, one sub-page per tab.
// The page waits for its answer before sending it, so that "Page introuvable" comes with a real
// 404 status: an offline profile and an unknown handle give exactly the same response.
export const instant = false;

export default async function PublicProfileLayout({ children, params }: LayoutProps<"/[handle]">) {
  const { handle } = await params;
  const view = await getProfileView(handle);

  // Unknown or offline: the page calls notFound(), and not-found.tsx draws the whole page.
  if (!view) return children;

  return (
    <PublicPage
      banner={view.preview ? <OfflineBanner /> : undefined}
      // Until the modules bring the photo, the name, the main action and the tabs.
      header={<PublicPageHeading eyebrow="Espace public" title="Page de profil" />}
    >
      {children}
    </PublicPage>
  );
}
