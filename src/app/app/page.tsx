import { redirect } from "next/navigation";

import { HOME_PATH } from "@/lib/auth/paths";

// /app alone leads to the home of the private space.
export default function AppHome() {
  redirect(HOME_PATH);
}
