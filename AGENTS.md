# AGENTS.md

Point d'entrée pour tout agent (IA ou humain) qui travaille sur ce dépôt. À lire en premier.

## Le projet en une phrase

**Linku** (nom provisoire) : une application web tout-en-un pour freelances. Un **profil public** (CV, prise de rendez-vous, board public, fichiers partagés) s'appuie sur un **espace privé** qui remplace plusieurs outils payants (LinkedIn, Calendly, Trello, Google Drive).

## Carte de la documentation

| Fichier | Contenu | Quand le lire |
|---|---|---|
| [docs/product.md](docs/product.md) | Vision, cible, modèle économique, principes transverses, stack technique, roadmap, décisions, questions ouvertes | Toujours, avant toute tâche |
| [docs/modules.md](docs/modules.md) | Spécification fonctionnelle de chaque module (périmètre MVP / plus tard) | Avant de travailler sur un module |

## État actuel

- Phase : stack choisie, aucun code. Prochaine étape : le socle (étape 1 de la roadmap).
- Stack technique : **TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel**. Détail et justification dans `docs/product.md`, section *Stack technique*.

## Règles de travail

- Langue : documentation et échanges en français ; code et identifiants en anglais.
- Le porteur du projet n'est pas développeur : expliquer les choix en langage simple, et couvrir les parcours importants par des tests automatiques plutôt que de compter sur une relecture du code.
- Documentation concise : enrichir les fichiers existants plutôt que d'en créer de nouveaux.
- Toute décision validée avec le porteur du projet est ajoutée à `docs/product.md` (section *Décisions*), et la roadmap est tenue à jour.
- Respecter le périmètre de l'étape en cours : ne pas implémenter ce qui est marqué *Plus tard*.
- Multi-tenant dès le départ : chaque donnée appartient à un utilisateur, même tant que l'application n'en a qu'un seul.
