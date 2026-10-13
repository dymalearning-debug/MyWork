import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tableau de bord · MyWork" };

// Home of the private space, reached after login: an overview of the modules and of the profile.
// A placeholder for now: its content comes with the modules.
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2 px-8 py-14 sm:px-16">
      <p className="eyebrow text-muted-foreground">Espace privé</p>
      <h1 className="font-heading text-5xl font-medium">Tableau de bord</h1>
      <p className="text-sm text-muted-foreground">Futures informations sur mon espace.</p>
    </div>
  );
}
