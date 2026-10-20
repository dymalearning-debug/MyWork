import { cn } from "@/lib/utils";

import { LANDING_COLUMN } from "./landing-shell";

// "FAQ" block of the landing page (docs/landing.md), validated mockup "B · Thèmes": ten questions in
// four themes, always unfolded so that every answer is in the page. Each answer stands on its own,
// so an AI can quote it alone. The same list feeds the FAQPage structured data: keep it true to the
// product at every change.

type Question = { q: string; a: string };

const THEMES: { title: string; questions: Question[] }[] = [
  {
    title: "MyWork",
    questions: [
      {
        q: "Qu'est-ce que MyWork ?",
        a: "Une application web pour les freelances. Elle réunit un profil professionnel public, la prise de rendez-vous avec visio, des tableaux de tâches et un espace de fichiers, pour 5 € par mois.",
      },
      {
        q: "Quels outils MyWork remplace-t-il ?",
        a: "Une page de profil ou un site vitrine, Calendly pour la prise de rendez-vous, Zoom pour les visios avec vos clients, Trello pour le suivi des tâches et Google Drive pour le partage de fichiers. MyWork n'est pas un réseau social : il ne remplace ni le réseau ni la messagerie de LinkedIn.",
      },
      {
        q: "Qu'est-ce que le profil public ?",
        a: "Une page à votre nom, hellomywork.com/votre-nom, avec votre profil, vos créneaux de rendez-vous et vos documents publics. Elle est hors ligne par défaut : vous la mettez en ligne quand vous êtes prêt.",
      },
    ],
  },
  {
    title: "Tarif et abonnement",
    questions: [
      {
        q: "Combien coûte MyWork ?",
        a: "5 € par mois, ou 50 € par an (deux mois offerts). Les deux formules donnent accès à tout MyWork, sans option payante.",
      },
      {
        q: "Comment fonctionne l'essai gratuit ?",
        a: "Vous choisissez votre formule et enregistrez votre carte à l'inscription. Rien n'est prélevé pendant 7 jours, un e-mail vous prévient avant le premier prélèvement, et une résiliation pendant l'essai ne coûte rien.",
      },
      {
        q: "Puis-je arrêter quand je veux ?",
        a: "Oui, sans engagement. Votre abonnement s'arrête à la fin de la période déjà payée, au mois ou à l'année. Vous pouvez aussi supprimer votre compte et toutes vos données depuis les Paramètres.",
      },
    ],
  },
  {
    title: "Vos clients",
    questions: [
      {
        q: "Mes clients doivent-ils créer un compte pour réserver ?",
        a: "Non. Ils choisissent un créneau de 30 minutes sur votre profil, laissent leur nom, leur e-mail et un message, et rejoignent la visio depuis leur navigateur, sans rien installer.",
      },
      {
        q: "MyWork se synchronise-t-il avec Google Agenda ou Outlook ?",
        a: "Non. Vos disponibilités se gèrent dans MyWork, et vous bloquez à la main les jours déjà pris. Vos clients reçoivent un fichier pour ajouter le rendez-vous à leur agenda.",
      },
    ],
  },
  {
    title: "Vos données",
    questions: [
      {
        q: "Combien d'espace de stockage ai-je ?",
        a: "10 Go pour tous vos fichiers, avec 50 Mo au maximum par fichier.",
      },
      {
        q: "Où sont hébergées mes données ?",
        a: "Dans l'Union européenne (Irlande), conformément au RGPD. Seul ce que vous rendez public est visible : votre profil en ligne, vos créneaux et vos fichiers publics.",
      },
    ],
  },
];

// Muted tiles in a checkerboard on two columns, every other tile on one column.
const TILE_BACKGROUND = ["bg-muted", "bg-background", "bg-muted md:bg-background", "bg-background md:bg-muted"];

// Contact address for "Une autre question ?". The line stays hidden until there is an inbox
// (docs/landing.md, "FAQ").
const CONTACT_EMAIL: string | null = null;

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: THEMES.flatMap((theme) =>
    theme.questions.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  ),
};

export function Faq({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-border">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD).replace(/</g, "\\u003c") }}
      />
      <div className={`${LANDING_COLUMN} py-[clamp(4rem,9vw,7rem)]`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="eyebrow text-muted-foreground tabular-nums">{eyebrow}</p>
          <h2
            id={`${id}-title`}
            className="font-heading text-[clamp(2.25rem,5vw,3rem)] leading-[1.05] font-medium tracking-[-0.01em]"
          >
            {title}
          </h2>
          <p className="max-w-[54ch] text-base leading-[25px] text-muted-foreground">
            L&apos;essentiel avant de vous lancer, rangé par thème.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {THEMES.map((theme, index) => (
            <div
              key={theme.title}
              className={cn("flex flex-col border border-border p-[clamp(1.25rem,3vw,2rem)]", TILE_BACKGROUND[index])}
            >
              <div className="mb-[18px] flex items-baseline gap-3">
                <span className="font-heading text-[0.9375rem] text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="eyebrow">{theme.title}</p>
              </div>
              {theme.questions.map(({ q, a }) => (
                <div key={q} className="flex flex-col gap-2 border-t border-border py-5">
                  <h3 className="font-heading text-[1.3125rem] leading-[1.2] font-medium">{q}</h3>
                  <p className="text-sm leading-[22px] text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {CONTACT_EMAIL && (
          <p className="mt-7 text-center text-sm leading-[21px] text-muted-foreground">
            Une autre question ?{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
            >
              Écrivez-nous
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
