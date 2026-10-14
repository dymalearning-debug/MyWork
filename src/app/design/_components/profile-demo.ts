import type { StoredProfile } from "@/lib/profile/types"

// A fictional profile (Inès Robert, the character of the mockups), to show the real components of
// the Profil module in the showcase.

const experience = {
  location: "Lyon",
  workMode: null,
  end: null,
  isCurrent: false,
  description: "",
}

export const DEMO_PROFILE: StoredProfile = {
  handle: "ines-robert",
  isOnline: true,
  hasContact: false,
  firstName: "Inès",
  lastName: "Robert",
  headline: "Product designer freelance · Design systems",
  location: "Lyon, France",
  photoUrl: null,
  contactEmail: "",
  phone: "",
  about:
    "J'accompagne les équipes produit de l'idée au lancement : recherche utilisateur, prototypes, design systems. Dix ans d'expérience, dont six en freelance.",
  isFreelance: true,
  availability: "available",
  availableFrom: null,
  workModes: ["remote", "hybrid"],
  travelZone: "Lyon et environs, Paris ponctuellement",
  dailyRate: 550,
  sectionOrder: [
    "about",
    "freelance",
    "experiences",
    "projects",
    "educations",
    "certifications",
    "skills",
    "languages",
    "recommendations",
  ],
  links: [
    { id: "l1", url: "https://www.linkedin.com/in/ines-robert", label: "" },
    { id: "l2", url: "https://www.malt.fr/profile/inesrobert", label: "" },
    { id: "l3", url: "https://ines-robert.fr", label: "" },
  ],
  services: [
    { id: "s1", name: "Audit UX", description: "Parcours, entretiens, recommandations priorisées." },
    { id: "s2", name: "Création de design system", description: "Composants, tokens et documentation." },
  ],
  experiences: [
    {
      ...experience,
      id: "e1",
      title: "Lead product designer",
      company: "Banque Rhône-Alpes",
      employmentType: "freelance",
      workMode: "hybrid",
      start: { year: 2024, month: 3 },
      isCurrent: true,
      description: "Refonte de l'application mobile et création du design system « Rivage ».",
      skills: ["Design system", "Figma"],
    },
    {
      ...experience,
      skills: [],
      id: "e2",
      title: "Lead designer",
      company: "Agence Mesa",
      employmentType: "permanent",
      start: { year: 2018, month: null },
      end: { year: 2019, month: null },
      description: "Direction d'une équipe de quatre designers.",
    },
    {
      ...experience,
      skills: [],
      id: "e3",
      title: "UX designer",
      company: "Agence Mesa",
      employmentType: "permanent",
      start: { year: 2016, month: null },
      end: { year: 2018, month: null },
    },
  ],
  educations: [
    {
      id: "d1",
      school: "Strate École de design",
      degree: "Mastère",
      field: "Design interactif",
      start: { year: 2014, month: null },
      end: { year: 2016, month: null },
      isCurrent: false,
      description: "",
    },
  ],
  certifications: [
    {
      id: "c1",
      name: "Expert accessibilité numérique (RGAA)",
      issuer: "Access42",
      credentialId: "",
      issued: { year: 2022, month: 10 },
      expires: null,
      verificationUrl: "",
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Design system Rivage",
      description: "Quarante composants, documentés et partagés entre trois équipes.",
      start: { year: 2024, month: null },
      end: { year: 2025, month: null },
      isCurrent: false,
      url: "",
      experienceId: "e1",
      images: [],
      skills: ["Design system"],
    },
    {
      id: "p2",
      name: "Application Clinéo",
      description: "Prise de rendez-vous médicaux, de la recherche utilisateur à la mise en production.",
      start: { year: 2022, month: null },
      end: { year: 2023, month: null },
      isCurrent: false,
      url: "",
      experienceId: null,
      images: [],
      skills: [],
    },
  ],
  skills: ["Design system", "Prototypage", "Recherche UX", "Accessibilité", "Figma", "UI design"].map(
    (name, index) => ({ id: `k${index}`, name, featured: index < 4 })
  ),
  languages: [
    { id: "g1", name: "Français", level: "native" },
    { id: "g2", name: "Anglais", level: "fluent" },
  ],
  recommendations: [
    {
      id: "r1",
      text: "Inès a structuré notre design system en quelques mois : l'équipe livre deux fois plus vite.",
      author: "Julien Marchand",
      authorRole: "Directeur produit",
      authorCompany: "Banque Rhône-Alpes",
      authorUrl: "",
      date: null,
    },
  ],
}

export const DEMO_CONTACT = { email: "ines.robert@exemple.fr", phone: "+33 6 12 34 56 78" }
