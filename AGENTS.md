# AGENTS.md

Point d'entrée pour tout agent (IA ou humain) qui travaille sur ce dépôt. À lire en premier.

## Le projet en une phrase

**MyWork** : une application web tout-en-un pour freelances. Un **profil public** (profil professionnel, prise de rendez-vous, board public, fichiers partagés) s'appuie sur un **espace privé** qui remplace plusieurs outils payants (LinkedIn, Calendly, Trello, Google Drive).

## Carte de la documentation

| Fichier | Contenu | Quand le lire |
|---|---|---|
| [docs/product.md](docs/product.md) | Vision, cible, modèle économique, principes transverses, stack technique, roadmap, décisions, questions ouvertes | Toujours, avant toute tâche |
| [docs/modules.md](docs/modules.md) | Spécification fonctionnelle de chaque module (périmètre MVP / plus tard) | Avant de travailler sur un module |
| [docs/public-profile.md](docs/public-profile.md) | Profil public : adresses, identifiant, mise en ligne, page publique en onglets, menu du profil, maquettes, données, tests | Avant de travailler sur le profil public, la partie publique d'un module ou le menu du profil |
| [docs/auth.md](docs/auth.md) | Authentification : parcours, e-mails, données utilisateur, configuration Google et Supabase, tests | Avant de travailler sur la connexion, l'inscription ou la coque de l'application |
| [docs/profile.md](docs/profile.md) | Module Profil (le CV en ligne, étape 2) : contenu de chaque section, « Mon profil », onglet « Profil » de la page publique, export du CV, données, tests | Avant de travailler sur le module Profil ou la page « Mon profil » |
| [docs/settings.md](docs/settings.md) | Paramètres : fenêtre, page Profil (nom, adresse du profil public), suppression du compte, notifications, données, tests | Avant de travailler sur les Paramètres, le compte ou les notifications |
| [docs/design-system.md](docs/design-system.md) | Identité visuelle : où trouver tokens, composants, vitrine `/design` et logos ; règles d'usage | Avant de créer ou modifier un écran ou un composant |

## État actuel

- Phase : étape 1 (socle) en cours ; étape 2 (module Profil) développée ([docs/profile.md](docs/profile.md)) : « Mon profil », onglet « Profil » de la page publique, « Me contacter », aperçu au partage, export du CV en PDF et PNG.
  - Fait : application Next.js, déployée automatiquement sur Vercel. Projet Supabase relié au CLI (table `profiles`). Design system validé ([docs/design-system.md](docs/design-system.md)). Authentification ([docs/auth.md](docs/auth.md)) : e-mail et mot de passe, Google, coque de l'espace privé (barre latérale, page de profil provisoire). Tests automatiques (Vitest, Playwright) lancés par GitHub à chaque modification.
  - Fait aussi : profil public ([docs/public-profile.md](docs/public-profile.md)) : espace privé déplacé sous `/app`, identifiant public et mise en ligne (fabriqués dans la base), page publique `/<identifiant>` et pages introuvables, menu du profil en sous-menus.
  - Fait aussi : Paramètres ([docs/settings.md](docs/settings.md)) : fenêtre ouverte depuis le menu du profil, prénom et nom, adresse du profil public modifiable, suppression du compte, notifications en bas à droite.
  - Fait aussi : structure de l'espace privé : tableau de bord (`/app`, l'accueil) et « Mon profil » (`/app/profile`, le module Profil).
  - Reste à faire : vérifier l'export du CV une fois déployé sur Vercel ; contenu du tableau de bord. Plus tard, avec Resend : changement d'e-mail et de mot de passe. Vérifier que les fonctions Vercel tournent bien à Dublin, comme prévu par la stack.
- Stack technique : **TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel**. Détail et justification dans `docs/product.md`, section *Stack technique*.

## Code

- Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (style `base-nova`, composants Base UI). Gestionnaire de paquets : **npm**. Prérequis : Node.js LTS (24).
- Code dans `src/` : pages dans `src/app/`, composants shadcn/ui dans `src/components/ui/` (ajout : `npx shadcn@latest add <composant>`, puis adapter au design system).
- Design system : **lire [docs/design-system.md](docs/design-system.md) avant toute interface**. En bref : tokens dans `src/app/globals.css`, composants dans `src/components/`, vitrine http://localhost:3000/design (en local uniquement), copie sur claude.ai à resynchroniser quand `globals.css`, un composant ou le logo change.
- Si un changement de style dans `globals.css` n'apparaît pas (cache du compilateur CSS, qui survit au redémarrage) : arrêter `npm run dev`, supprimer le dossier `.next/dev`, relancer.
- Commandes : `npm run dev` (serveur local sur http://localhost:3000), `npm run build`, `npm run lint`.
- CLI Supabase : installé dans le projet (dépendance de dev), à lancer avec `npx supabase <commande>`. Configuration dans `supabase/`, dossier relié au projet Supabase **MyWork** (référence `ulufanywmrporutivwgc`). Côté application : clients Supabase dans `src/lib/supabase/` (`client.ts` navigateur, `server.ts` serveur), réglages dans `.env.local` (modèle : `.env.example`, jamais commité). Schéma de la base versionné par des migrations dans `supabase/migrations/` (`npx supabase db push`) ; réglages d'authentification dans `supabase/config.toml` (`npx supabase config diff`, puis `config push`, qui envoie le fichier entier).
- Clé secrète Supabase (`SUPABASE_SECRET_KEY`) : tests de bout en bout uniquement, jamais dans l'application. Rangée sur Vercel dans l'environnement « Development » seulement (récupérée par `vercel env pull .env.local`) et dans les secrets GitHub.
- Tests : `npm test` (Vitest, unitaires) et `npm run test:e2e` (Playwright, sur la base en ligne ; comptes de test supprimés à la fin).
- **Jamais de base de données locale** (ni `npx supabase start`, ni Docker) : développement et production utilisent le même projet Supabase en ligne, jusqu'à la fin du développement (voir `docs/product.md`, *Décisions*).
- Dépôt GitHub : https://github.com/dymalearning-debug/MyWork (privé).
- Déploiement : Vercel, équipe `mywork-8619`, projet `linku` (ancien nom du produit). Chaque push sur `main` part en production (https://linku-nu.vercel.app) ; chaque pull request reçoit une URL d'aperçu. Les variables d'environnement sont gérées dans Vercel : `vercel env pull .env.local` régénère le fichier local (CLI Vercel installé sur le poste).

## Règles de travail

- Langue : documentation et échanges en français ; code et identifiants en anglais.
- Le porteur du projet n'est pas développeur : expliquer les choix en langage simple, et couvrir les parcours importants par des tests automatiques plutôt que de compter sur une relecture du code.
- Documentation concise : enrichir les fichiers existants plutôt que d'en créer de nouveaux.
- Toute décision validée avec le porteur du projet est ajoutée à `docs/product.md` (section *Décisions*), et la roadmap est tenue à jour.
- Toute interface suit le design system ([docs/design-system.md](docs/design-system.md)) : aucune couleur, police ou rayon en dur, et chaque écran vérifié en thème clair et sombre.
- Respecter le périmètre de l'étape en cours : ne pas implémenter ce qui est marqué *Plus tard*.
- Multi-tenant dès le départ : chaque donnée appartient à un utilisateur, même tant que l'application n'en a qu'un seul.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
