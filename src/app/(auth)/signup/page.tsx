import type { Metadata } from "next";

import { SignupFlow } from "./signup-flow";

export const metadata: Metadata = { title: "Créer un compte · MyWork" };

export default function SignupPage() {
  return <SignupFlow />;
}
