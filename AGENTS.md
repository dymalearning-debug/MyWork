# AGENTS.md

Point d'entrée pour tout agent (IA ou humain) qui travaille sur ce dépôt. À lire en premier.

## Le projet en une phrase

**MyWork** : une application web tout-en-un pour freelances. Un **profil public** (profil professionnel, prise de rendez-vous, fichiers partagés) s'appuie sur un **espace privé** qui remplace plusieurs outils payants (LinkedIn, Calendly, Trello, Google Drive).

## Carte de la documentation

| Fichier | Contenu | Quand le lire |
|---|---|---|
| [docs/product.md](docs/product.md) | Vision, cible, modèle économique, principes transverses, stack technique, roadmap, décisions, questions ouvertes | Toujours, avant toute tâche |
| [docs/modules.md](docs/modules.md) | Spécification fonctionnelle de chaque module (périmètre MVP / plus tard) | Avant de travailler sur un module |
| [docs/public-profile.md](docs/public-profile.md) | Profil public : adresses, identifiant, mise en ligne, page publique en onglets, menu du profil, maquettes, données, tests | Avant de travailler sur le profil public, la partie publique d'un module ou le menu du profil |
| [docs/auth.md](docs/auth.md) | Authentification : parcours, e-mails, données utilisateur, configuration Google et Supabase, tests | Avant de travailler sur la connexion, l'inscription ou la coque de l'application |
| [docs/profile.md](docs/profile.md) | Module Profil (le CV en ligne, étape 2) : contenu de chaque section, « Mon profil », onglet « Profil » de la page publique, export du CV, données, tests | Avant de travailler sur le module Profil ou la page « Mon profil » |
| [docs/boards.md](docs/boards.md) | Module Tableaux (type Trello, étape 3, uniquement privé) : navigation, tableaux, listes, cartes, description, checklist, images, maquettes, données, tests, décisions à valider | Avant de travailler sur le module Tableaux |
| [docs/drive.md](docs/drive.md) | Module Drive (type Google Drive, étape 5) : page « Mes fichiers », dossiers, liste et grille, tri, filtre, recherche, pagination, visibilité et onglet « Ressources », indicateur de stockage, données, tests, décisions à valider | Avant de travailler sur le module Drive ou l'onglet « Ressources » |
| [docs/booking.md](docs/booking.md) | Module Rendez-vous (type Calendly, étape 4, avec la visio LiveKit) : « Mes rendez-vous », disponibilités et réglages, calcul des créneaux, onglet « Rendez-vous », lien de l'invité, visio, e-mails préparés, anti-abus, RGPD, données, tests, décisions validées | Avant de travailler sur le module Rendez-vous ou la visio |
| [docs/landing.md](docs/landing.md) | Landing page (`/`) : contenu de chaque bloc, FAQ, chiffrage du modèle économique, référencement et IA, pages légales, tests, décisions à valider | Avant de travailler sur la landing page, le prix ou les pages légales |
| [docs/settings.md](docs/settings.md) | Paramètres : fenêtre, page Profil (nom, adresse du profil public), suppression du compte, notifications, données, tests | Avant de travailler sur les Paramètres, le compte ou les notifications |
| [docs/design-system.md](docs/design-system.md) | Identité visuelle : où trouver tokens, composants, vitrine `/design` et logos ; règles d'usage | Avant de créer ou modifier un écran ou un composant |

## État actuel

- Phase : étape 1 (socle) en cours ; étape 2 (module Profil) développée ([docs/profile.md](docs/profile.md)) : « Mon profil », onglet « Profil » de la page publique, « Me contacter », aperçu au partage, export du CV en PDF et PNG.
  - Fait : application Next.js, déployée automatiquement sur Vercel. Projet Supabase relié au CLI (table `profiles`). Design system validé ([docs/design-system.md](docs/design-system.md)). Authentification ([docs/auth.md](docs/auth.md)) : e-mail et mot de passe, Google, coque de l'espace privé (barre latérale, page de profil provisoire). Tests automatiques (Vitest, Playwright) lancés par GitHub à chaque modification.
  - Fait aussi : profil public ([docs/public-profile.md](docs/public-profile.md)) : espace privé déplacé sous `/app`, identifiant public et mise en ligne (fabriqués dans la base), page publique `/<identifiant>` et pages introuvables, menu du profil en sous-menus.
  - Fait aussi : Paramètres ([docs/settings.md](docs/settings.md)) : fenêtre ouverte depuis le menu du profil, prénom et nom, adresse du profil public modifiable, suppression du compte, notifications en bas à droite.
  - Fait aussi : structure de l'espace privé : tableau de bord (`/app`, l'accueil) et « Mon profil » (`/app/profile`, le module Profil).
  - Étape 3 (module Tableaux) spécifiée et développée le 2026-10-14 ([docs/boards.md](docs/boards.md)) : « Mes tableaux » (`/app/boards`), choix du tableau sur son nom, listes et cartes en glisser-déposer, fenêtre de la carte (description en Markdown léger, checklist, images privées). Uniquement privé ; des décisions restent à valider par le porteur du projet.
  - Étape 5 (module Drive) spécifiée et développée le 2026-10-15 ([docs/drive.md](docs/drive.md)) : « Mes fichiers » (`/app/drive`), dossiers, envoi reprenable, liste ou grille, tri, filtre, recherche, pagination, sélection multiple, aperçu, fichiers publics et ressource mise en avant dans l'onglet « Ressources » du profil public (`/<identifiant>/resources`), indicateur de stockage. Quelques choix faits pendant le développement restent à valider.
  - Étape 4 (module Rendez-vous, avec la visio LiveKit) spécifiée et développée le 2026-10-16 ([docs/booking.md](docs/booking.md)) : « Mes rendez-vous » (`/app/booking`, liste, détail, annulation, point rouge) et « Disponibilités » (`/app/booking/availability`), onglet public `/<identifiant>/booking` (semainier, formulaire), page de l'invité `/<identifiant>/booking/<code>` (billet, `.ics`, annulation), visio LiveKit (jeton seulement de 15 min avant à 30 min après), e-mails envoyés par Resend (depuis le 2026-10-18). Quelques choix faits pendant le développement restent à valider.
  - Fait aussi (2026-10-18) : **Resend** branché sur le domaine `hellomywork.com` : e-mails de connexion (Supabase, modèles MyWork) et e-mails des rendez-vous (voir [docs/product.md](docs/product.md), *Inventaire technique*).
  - Landing page spécifiée et décisions validées le 2026-10-19 ([docs/landing.md](docs/landing.md)) : ossature de la page en place à `/`, hero (approche « A · Vitrine »), fonctionnalités (approche « B · Alternance ») et outils remplacés (approche « B · Tableau ») développés le 2026-10-20 ; tarif et FAQ à maquetter et construire (« Un seul lien », « Comment ça marche » et « Qui est derrière » retirés).
  - Reste à faire : contenu du tableau de bord. Changement d'e-mail et de mot de passe (Resend est prêt). Faire tourner les fonctions Vercel à Dublin, comme prévu par la stack : elles tournent aujourd'hui à Washington (`iad1`, constaté le 2026-10-14).
- Stack technique : **TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel**. Détail et justification dans `docs/product.md`, section *Stack technique*.

## Code

- Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (style `base-nova`, composants Base UI). Gestionnaire de paquets : **npm**. Prérequis : Node.js LTS (24).
- Code dans `src/` : pages dans `src/app/`, composants shadcn/ui dans `src/components/ui/` (ajout : `npx shadcn@latest add <composant>`, puis adapter au design system).
- Design system : **lire [docs/design-system.md](docs/design-system.md) avant toute interface**. En bref : tokens dans `src/app/globals.css`, composants dans `src/components/`, vitrine http://localhost:3000/design (en local uniquement), copie sur claude.ai à resynchroniser quand `globals.css`, un composant ou le logo change.
- Si un changement de style dans `globals.css` n'apparaît pas (cache du compilateur CSS, qui survit au redémarrage) : arrêter `npm run dev`, supprimer le dossier `.next/dev`, relancer.
- Next.js 16 garde une page quittée dans le document, cachée (`display: none`, React `<Activity>`) : son état survit, et ses éléments restent trouvables (dans les tests, préférer `getByRole`, qui ignore les éléments cachés). Guide : `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md`.
- En développement, l'indicateur de Next.js (rond « N », en haut à droite) recouvre les boutons placés à cet endroit : les tests de bout en bout les actionnent au clavier.
- Commandes : `npm run dev` (serveur local sur http://localhost:3000), `npm run build`, `npm run lint`.
- CLI Supabase : installé dans le projet (dépendance de dev), à lancer avec `npx supabase <commande>`. Configuration dans `supabase/`, dossier relié au projet Supabase **MyWork** (référence `ulufanywmrporutivwgc`). Côté application : clients Supabase dans `src/lib/supabase/` (`client.ts` navigateur, `server.ts` serveur), réglages dans `.env.local` (modèle : `.env.example`, jamais commité). Schéma de la base versionné par des migrations dans `supabase/migrations/` (`npx supabase db push`) ; réglages d'authentification dans `supabase/config.toml` (`npx supabase config diff`, puis `config push`, qui envoie le fichier entier).
- Clé secrète Supabase (`SUPABASE_SECRET_KEY`) : tests de bout en bout uniquement, jamais dans l'application. Rangée sur Vercel dans l'environnement « Development » seulement (récupérée par `vercel env pull .env.local`) et dans les secrets GitHub.
- Tests : `npm test` (Vitest, unitaires) et `npm run test:e2e` (Playwright, sur la base en ligne ; comptes de test supprimés à la fin).
- **Jamais de base de données locale** (ni `npx supabase start`, ni Docker) : développement et production utilisent le même projet Supabase en ligne, jusqu'à la fin du développement (voir `docs/product.md`, *Décisions*).
- Dépôt GitHub : https://github.com/dymalearning-debug/MyWork (privé).
- Déploiement : Vercel, équipe `mywork-8619`, projet `linku` (ancien nom du produit). Chaque push sur `main` part en production (https://hellomywork.com, nom de domaine acheté chez Vercel ; l'ancienne adresse https://linku-nu.vercel.app reste valide) ; chaque pull request reçoit une URL d'aperçu. Les variables d'environnement sont gérées dans Vercel : `vercel env pull .env.local` régénère le fichier local (CLI Vercel installé sur le poste).

## Règles de travail

- Langue : documentation et échanges en français ; code et identifiants en anglais.
- Le porteur du projet n'est pas développeur : expliquer les choix en langage simple, et couvrir les parcours importants par des tests automatiques plutôt que de compter sur une relecture du code.
- Documentation concise : enrichir les fichiers existants plutôt que d'en créer de nouveaux.
- Toute décision validée avec le porteur du projet est ajoutée à `docs/product.md` (section *Décisions*), et la roadmap est tenue à jour.
- Tout choix technique (service, bibliothèque ajoutée ou retirée, compartiment de fichiers, réglage d'hébergement) est reporté dans `docs/product.md`, *Inventaire technique*, dans le même changement.
- Toute interface suit le design system ([docs/design-system.md](docs/design-system.md)) : aucune couleur, police ou rayon en dur, et chaque écran vérifié en thème clair et sombre.
- Respecter le périmètre de l'étape en cours : ne pas implémenter ce qui est marqué *Plus tard*.
- Multi-tenant dès le départ : chaque donnée appartient à un utilisateur, même tant que l'application n'en a qu'un seul.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
