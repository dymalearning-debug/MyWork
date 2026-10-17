import { Suspense } from "react";

import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/user";
import { publicBookingPath } from "@/lib/booking/rules";

import { BookingTabs } from "../_components/booking-tabs";
import { CopyAddressButton } from "../_components/copy-address-button";

// Shell of "Mes rendez-vous" (docs/booking.md, "Espace privé"): the title, "Copier l'adresse de
// réservation", and the two tabs, "Rendez-vous" and "Disponibilités". Mockup "A · Agenda".
export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col px-12 pt-9">
      <div className="flex flex-col gap-4 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-[44px] leading-tight font-medium">Mes rendez-vous</h1>
          <Suspense fallback={null}>
            <OwnAddressButton />
          </Suspense>
        </div>
        <BookingTabs />
      </div>
      {children}
    </div>
  );
}

async function OwnAddressButton() {
  const user = await requireUser();
  const profile = await getOwnProfile(user.id);
  return <CopyAddressButton path={publicBookingPath(profile.handle)} />;
}
