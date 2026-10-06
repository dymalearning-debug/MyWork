# Produit : vision et cadrage

## Vision

Centraliser dans un seul outil, personnel et personnalisable, les services qu'un freelance paie séparément : CV en ligne, prise de rendez-vous, gestion de tâches, stockage de fichiers. De nouveaux modules pourront s'ajouter au fil du temps.

Chaque module comporte :
- un **espace privé** (back-office) où l'utilisateur gère ses données ;
- une **partie publique** optionnelle, affichée sur son **profil public**, une URL unique à partager avec recruteurs et clients.

Le profil public est le fil conducteur du produit : c'est lui qui relie les modules entre eux.

## Cible et modèle économique

1. **Usage personnel** : au départ, le porteur du projet (freelance) est le seul utilisateur.
2. **SaaS** : ensuite, ouverture à d'autres utilisateurs (freelances, indépendants, toute personne qui veut s'organiser). Création de compte libre, **un seul abonnement, peu cher**, avec un quota de stockage pour couvrir les coûts et éviter les abus.

## Plateforme

- **Application web**, pensée d'abord pour un écran d'ordinateur.
- Les **pages publiques** doivent être responsive dès le départ, car recruteurs et clients les ouvriront souvent sur mobile.
- Tablette et mobile, avec une interface dédiée : plus tard, éventuellement.

## Principes transverses

- **Multi-tenant dès le départ** : toute donnée est rattachée à un utilisateur, même en usage personnel. Cela évite une refonte coûteuse au passage en SaaS.
- **Modèle de visibilité commun** à tous les modules : `private` / `public` (visible sur le profil), voire `unlisted` (accessible par lien seulement, à confirmer).
- **Modules activables** : chaque utilisateur choisit les modules actifs et ceux qui apparaissent sur son profil public.
- **Monolithe modulaire** : une seule application, avec des modules bien isolés dans le code (pas de microservices).
- **RGPD** : hébergement dans l'UE, export et suppression du compte, prise en compte des données de tiers (par exemple les clients qui réservent un rendez-vous).

## Roadmap

Chaque étape correspond au périmètre MVP du module (voir [modules.md](modules.md)).

| # | Étape | Statut |
|---|---|---|
| 0 | Choix de la stack technique | À faire |
| 1 | Socle : authentification, compte, squelette du profil public | À faire |
| 2 | Module **CV** et export | À faire |
| 3 | Module **Rendez-vous** (type Calendly) | À faire |
| 4 | Module **Boards** (type Trello) | À faire |
| 5 | Module **Drive** (type Google Drive) | À faire |
| 6 | **Abonnement et paiement**, ouverture SaaS | À faire |
| 7 | Module **Visio** (type Zoom), relié aux rendez-vous | À faire |

## Décisions

Journal des choix validés (date : décision).

- 2026-10-06 : application web, pensée d'abord pour ordinateur.
- 2026-10-06 : ordre des modules : CV → Rendez-vous → Boards → Drive → Paiement → Visio.
- 2026-10-06 : usage personnel d'abord, SaaS ensuite, avec un abonnement unique peu cher et un quota de stockage.
- 2026-10-06 : le MVP Rendez-vous se limite à la réservation. La visio vient après le paiement.
- 2026-10-06 : le socle (authentification, compte, profil public) est l'étape 1, juste après le choix de la stack.
- 2026-10-06 : CV multilingue dès le MVP.
- 2026-10-06 : Rendez-vous sans aucune synchronisation avec des agendas externes. Les créneaux se gèrent uniquement dans l'application.
- 2026-10-06 : Visio via une brique existante, **LiveKit** (référence open source, gratuite en auto-hébergement, offre cloud gratuite pour démarrer).

## Questions ouvertes

- Nom définitif du produit : « Linku » est provisoire et changera probablement.
- Format de l'URL publique (`linku.app/<username>` ou `<username>.linku.app`), domaine personnalisé : plus tard.
- Prix de l'abonnement et taille du quota : plus tard.
- Stack technique : prochaine discussion.
