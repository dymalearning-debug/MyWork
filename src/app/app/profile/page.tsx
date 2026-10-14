import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/user";
import { normalizeProfileContent, toProfileContent } from "@/lib/profile/content";
import { getOwnProfileContent } from "@/lib/profile/data";

import { ProfileEditor } from "./_components/profile-editor";

export const metadata: Metadata = { title: "Mon profil · MyWork" };

// "Mon profil": the Profil module (docs/profile.md), filled here and shown in the "Profil" tab of
// the public page.
export default function ProfilePage() {
  return (
    // The profile is read at request time: the shell does not wait for it.
    <Suspense fallback={<ProfileSkeleton />}>
      <OwnProfileEditor />
    </Suspense>
  );
}

async function OwnProfileEditor() {
  const user = await requireUser();
  const stored = await getOwnProfileContent();
  // Cleaned like the values typed, so that an untouched form has no changes.
  return <ProfileEditor userId={user.id} handle={stored.handle} initial={normalizeProfileContent(toProfileContent(stored))} />;
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-8 py-14 sm:px-16 lg:pl-[calc(4rem+220px+3rem)]">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-12 w-64" />
      <Skeleton className="mt-8 h-64 max-w-[760px]" />
    </div>
  );
}
