import { connection } from "next/server"

import { ContactDetails } from "@/app/[handle]/_components/contact-button"
import { CvSheet } from "@/app/[handle]/_components/cv-sheet"
import { ProfileHeader } from "@/app/[handle]/_components/profile-header"
import { ProfileTab } from "@/app/[handle]/_components/profile-sections"

import { DEMO_CONTACT, DEMO_PROFILE } from "./profile-demo"
import { ProfileFormDemo } from "./profile-form-demo"
import { ModuleHeading } from "./showcase"

// The real components of the Profil module, with a fictional profile. Rendered at request time:
// lengths of time and availability depend on today's date.
export async function ProfileBricks() {
  await connection()
  return (
    <>
      <div>
        <ModuleHeading module="Module · Profil" title="Page publique : en-tête et onglet Profil" />
        <div className="border border-border">
          <div className="border-b border-border bg-spotlight px-6 pt-10 md:px-10">
            <ProfileHeader profile={DEMO_PROFILE} />
          </div>
          <div className="px-6 py-10 md:px-10">
            <ProfileTab profile={DEMO_PROFILE} />
          </div>
        </div>
      </div>
      <div>
        <ModuleHeading module="Module · Profil" title="Panneau Me contacter" />
        <div className="flex w-[min(340px,100%)] flex-col gap-3.5 border border-border bg-popover p-5">
          <p className="eyebrow text-muted-foreground">Me contacter</p>
          <ContactDetails contact={DEMO_CONTACT} />
        </div>
      </div>
      <div>
        <ModuleHeading module="Module · Profil" title="Mon profil : champs du formulaire" />
        <ProfileFormDemo />
      </div>
      <div>
        <ModuleHeading module="Module · Profil" title="CV (A4, toujours en thème clair)" />
        <div className="light overflow-x-auto border border-border bg-muted py-8">
          <CvSheet profile={DEMO_PROFILE} contact={DEMO_CONTACT} publicAddress="linku-nu.vercel.app/ines-robert" />
        </div>
      </div>
    </>
  )
}
