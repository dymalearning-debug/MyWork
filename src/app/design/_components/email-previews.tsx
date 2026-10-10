import { readFile } from "node:fs/promises"
import path from "node:path"

import { ModuleHeading } from "./showcase"

// The two Supabase Auth email templates (supabase/templates/), rendered as a mail client would,
// with sample values in place of Supabase's variables.
const EMAILS = [
  { file: "confirmation.html", subject: "Confirmez votre adresse e-mail", label: "Confirmation de l'inscription" },
  { file: "recovery.html", subject: "Réinitialisez votre mot de passe", label: "Réinitialisation du mot de passe" },
]

async function readTemplate(file: string) {
  "use cache"
  const html = await readFile(path.join(process.cwd(), "supabase", "templates", file), "utf8")
  return html
    .replaceAll("{{ .RedirectTo }}", "http://localhost:3000/auth/confirm")
    .replaceAll("{{ .TokenHash }}", "exemple")
}

export async function EmailPreviews() {
  const templates = await Promise.all(EMAILS.map((email) => readTemplate(email.file)))
  return (
    <div className="grid gap-10 xl:grid-cols-2">
      {EMAILS.map((email, i) => (
        <div key={email.file}>
          <ModuleHeading module={`supabase/templates/${email.file}`} title={email.label} />
          <p className="mb-3 text-sm text-muted-foreground">Objet : {email.subject}</p>
          {/* Emails are always shown on white: mail clients decide on their own dark mode. */}
          <iframe
            title={email.label}
            srcDoc={templates[i]}
            sandbox=""
            className="h-[760px] w-full border border-border bg-white"
          />
        </div>
      ))}
    </div>
  )
}
