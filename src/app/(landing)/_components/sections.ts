// Blocks of the landing page, in order (docs/landing.md, "Contenu de la page").
// The id is the anchor of the block in the address (/#tarif): in French, since visitors see it.
// `nav` puts the block in the header links.

export type LandingSection = {
  id: string;
  label: string;
  title: string;
  nav?: boolean;
};

export const LANDING_SECTIONS: LandingSection[] = [
  { id: "fonctionnalites", label: "Fonctionnalités", title: "Quatre outils, un seul espace", nav: true },
  { id: "outils-remplaces", label: "Outils remplacés", title: "Moins d'outils à gérer, plus de temps pour vos clients" },
  { id: "tarif", label: "Tarif", title: "Un seul abonnement, tout compris", nav: true },
  { id: "faq", label: "FAQ", title: "Questions fréquentes", nav: true },
];
