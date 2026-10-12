import { NotFoundPage } from "@/components/public-page";

// Unknown handle or offline profile (for anyone but its owner): the same page for both.
// The layout leaves the whole page to this component.
export default function ProfileNotFound() {
  return <NotFoundPage kind="profile" />;
}
