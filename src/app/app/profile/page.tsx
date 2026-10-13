import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon profil · MyWork" };

// "Mon profil": the freelancer's CV, future home of the CV module. A placeholder for now.
// It shows no data yet; pages that do will call requireUser() themselves (src/lib/auth/user.ts).
export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-2 px-8 py-14 sm:px-16">
      <p className="eyebrow text-muted-foreground">Espace privé</p>
      <h1 className="font-heading text-5xl font-medium">Mon profil</h1>
      <p className="text-sm text-muted-foreground">Contenu à venir.</p>
    </div>
  );
}
