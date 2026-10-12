import type { Metadata } from "next";

import { NOT_FOUND_TITLE, NotFoundPage } from "@/components/public-page";

export const metadata: Metadata = { title: NOT_FOUND_TITLE };

// Any unknown address: the template of the public profile's 404, instead of Next.js' default page.
export default function NotFound() {
  return <NotFoundPage kind="page" />;
}
