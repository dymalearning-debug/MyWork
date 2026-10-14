import { OfflineBanner, PublicPage } from "@/components/public-page";
import { getProfileView } from "@/lib/public-profile/data";

import { ProfileHeader } from "../_components/profile-header";

// Public profile (docs/public-profile.md): /<handle> and, with the modules, one sub-page per tab.
// The whole page depends on the profile (shown, previewed or not found): navigations to it wait for
// the answer instead of showing a loading state. An offline profile and an unknown handle give
// exactly the same response.
export const instant = false;

export default async function PublicProfileLayout({ children, params }: LayoutProps<"/[handle]">) {
  const { handle } = await params;
  const view = await getProfileView(handle);

  // Unknown or offline: the page calls notFound(), and not-found.tsx draws the whole page.
  if (!view) return children;

  return (
    <PublicPage banner={view.preview ? <OfflineBanner /> : undefined} header={<ProfileHeader profile={view.profile} />}>
      {children}
    </PublicPage>
  );
}
