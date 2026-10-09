# AGENTS.md

Point d'entrée pour tout agent (IA ou humain) qui travaille sur ce dépôt. À lire en premier.

## Le projet en une phrase

**MyWork** : une application web tout-en-un pour freelances. Un **profil public** (CV, prise de rendez-vous, board public, fichiers partagés) s'appuie sur un **espace privé** qui remplace plusieurs outils payants (LinkedIn, Calendly, Trello, Google Drive).

## Carte de la documentation

| Fichier | Contenu | Quand le lire |
|---|---|---|
| [docs/product.md](docs/product.md) | Vision, cible, modèle économique, principes transverses, stack technique, roadmap, décisions, questions ouvertes | Toujours, avant toute tâche |
| [docs/modules.md](docs/modules.md) | Spécification fonctionnelle de chaque module (périmètre MVP / plus tard) | Avant de travailler sur un module |

## État actuel

- Phase : étape 1 (socle) en cours. Application Next.js créée, avec une page d'accueil provisoire. Projet Supabase créé et relié (CLI). Design system validé, présenté sur la page `/design` ; à appliquer aux écrans au fur et à mesure. Restent à faire : branchement de Supabase dans l'application, authentification, compte, profil public, tests (Vitest, Playwright).
- Stack technique : **TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel**. Détail et justification dans `docs/product.md`, section *Stack technique*.

## Code

- Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (style `base-nova`, composants Base UI). Gestionnaire de paquets : **npm**. Prérequis : Node.js LTS (24).
- Code dans `src/` : pages dans `src/app/`, composants shadcn/ui dans `src/components/ui/` (ajout : `npx shadcn@latest add <composant>`, puis adapter au design system).
- Design system : couleurs des deux thèmes (rouge en `primary`), polices et utilitaires (`bg-spotlight`, `eyebrow`) dans `src/app/globals.css`. Page de référence http://localhost:3000/design (`src/app/design/`), en local uniquement. Toute nouvelle brique d'interface y est ajoutée. Copie synchronisée sur claude.ai (design system **MyWork**, https://claude.ai/artifact/T7MhWyh31URAnNAjyGd61b) : tokens, typographie, composants (dont `Logo`), logos et guide de marque, à resynchroniser quand `globals.css`, un composant ou le logo change.
- Si un changement de style dans `globals.css` n'apparaît pas (cache du compilateur CSS, qui survit au redémarrage) : arrêter `npm run dev`, supprimer le dossier `.next/dev`, relancer.
- Commandes : `npm run dev` (serveur local sur http://localhost:3000), `npm run build`, `npm run lint`.
- CLI Supabase : installé dans le projet (dépendance de dev), à lancer avec `npx supabase <commande>`. Configuration dans `supabase/`, dossier relié au projet Supabase **MyWork** (référence `ulufanywmrporutivwgc`). Côté application : clients Supabase dans `src/lib/supabase/` (`client.ts` navigateur, `server.ts` serveur), réglages dans `.env.local` (modèle : `.env.example`, jamais commité).

## Règles de travail

- Langue : documentation et échanges en français ; code et identifiants en anglais.
- Le porteur du projet n'est pas développeur : expliquer les choix en langage simple, et couvrir les parcours importants par des tests automatiques plutôt que de compter sur une relecture du code.
- Documentation concise : enrichir les fichiers existants plutôt que d'en créer de nouveaux.
- Toute décision validée avec le porteur du projet est ajoutée à `docs/product.md` (section *Décisions*), et la roadmap est tenue à jour.
- Respecter le périmètre de l'étape en cours : ne pas implémenter ce qui est marqué *Plus tard*.
- Multi-tenant dès le départ : chaque donnée appartient à un utilisateur, même tant que l'application n'en a qu'un seul.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
