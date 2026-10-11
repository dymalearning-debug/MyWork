import { redirect } from "next/navigation";

import { HOME_PATH } from "@/lib/auth/paths";

// No landing page yet: the address of the site leads to the private space
// (or to the login page, through the proxy, for a signed-out visitor).
export default function Home() {
  redirect(HOME_PATH);
}
