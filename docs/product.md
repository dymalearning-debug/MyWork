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

## Stack technique

Le porteur du projet n'est pas développeur : le code est écrit par des agents IA. D'où ces critères : technologies très répandues (bien maîtrisées par l'IA), un seul langage typé, aucun serveur à administrer, données consultables sans coder, tests automatiques comme filet de sécurité.

| Besoin | Choix |
|---|---|
| Langage | **TypeScript** (mode strict) |
| Application : pages publiques et espace privé | **Next.js** (React) |
| Interface | **Tailwind CSS** + **shadcn/ui** |
| Base de données, authentification, fichiers | **Supabase**, région Irlande (West EU) : PostgreSQL, Supabase Auth, Supabase Storage. Isolation des données par utilisateur avec la *Row Level Security* (RLS). |
| Hébergement | **Vercel**, fonctions en région Dublin, au plus près de la base de données |
| E-mails transactionnels | **Resend** |
| Paiement (étape 6) | **Stripe** (Checkout et portail client) |
| Visio (étape 7) | **LiveKit** |
| Tests | **Vitest** (tests unitaires et de composants) et **Playwright** (tests de bout en bout dans un vrai navigateur) |
| Code | **GitHub**, tests automatiques à chaque modification |

- Les bibliothèques de détail (glisser-déposer, dates et fuseaux, génération de PDF…) se choisissent au début de chaque module.
- Dès l'étape 1, des tests de bout en bout simulent les parcours utilisateur importants (inscription, réservation…).
- Coûts indicatifs (2026, à revérifier) : 0 € pendant le développement, en restant sur les offres gratuites. En usage réel, environ 20 $/mois pour Vercel Pro (l'offre gratuite est réservée à un usage non commercial) et 25 $/mois pour Supabase Pro (un projet gratuit est mis en pause après 7 jours sans activité), plus le nom de domaine.
- Écartés : no-code (trop limité, dépendance totale), Laravel et Rails (deux langages, moins bien maîtrisés par l'IA), base, authentification et stockage chez trois prestataires distincts (plus de pièces à assembler). Supabase reste du PostgreSQL standard, ce qui permet d'en sortir.

## Roadmap

Chaque étape correspond au périmètre MVP du module (voir [modules.md](modules.md)).

| # | Étape | Statut |
|---|---|---|
| 0 | Choix de la stack technique | Fait |
| 1 | Socle : authentification, compte, squelette du profil public | En cours |
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
- 2026-10-06 : stack technique : TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel, Resend, Stripe, GitHub (voir *Stack technique*).
- 2026-10-06 : données hébergées dans l'UE chez des prestataires américains (Supabase, Vercel), préférés à des hébergeurs 100 % européens pour la simplicité et la maîtrise par l'IA.
- 2026-10-06 : budget nul pendant le développement (offres gratuites uniquement). Environ 45 $/mois accepté une fois l'outil en usage réel.
- 2026-10-06 : tests avec les outils standards d'une application Next.js : Vitest (unitaires) et Playwright (bout en bout).
- 2026-10-07 : le produit s'appelle **MyWork** (remplace le nom provisoire « Linku »).
- 2026-10-07 : projet Supabase **MyWork** (offre gratuite), en Irlande (West EU) plutôt qu'à Paris : données toujours dans l'UE, écart de rapidité négligeable. RLS activée automatiquement sur chaque nouvelle table, et aucune table exposée à l'API par défaut : l'accès est ouvert table par table, dans les migrations.
- 2026-10-08 : identité visuelle inspirée de **Westworld** (saison 1), version « plaquette de luxe » : celle que Delos remettrait aux visiteurs de son parc. Sobre, blanc et noir, à la Hermès, avec une touche technologique. Une première version plus « écran de labo » (fond blanc os, police mono, grille, crochets de cadrage) a été écartée : trop « geek ».
  - Deux thèmes conservés, **clair** (blanc franc) et **sombre** (noir profond), avec un interrupteur. Par défaut, le thème du système.
  - Couleur primaire : un **rouge vif et profond**, pour les boutons principaux et la sélection. Cases à cocher et interrupteurs en encre noire, pour que le rouge reste rare. Le cognac, puis Archivo (titres élargis), ont été écartés : pas assez à son goût, et Archivo trop singulière, on s'en lasserait.
  - Typographie : **Newsreader** (sérif éditoriale, classique et robuste) pour les titres, préférée à Cormorant Garamond, Bodoni Moda et Geist seule. **Geist** pour tout le reste. Étiquettes en petites capitales espacées. Pas de police mono.
  - Effets discrets : angles droits, filets fins et clairs, beaucoup d'espace, halo de « lumière de studio » sur les grandes zones, survols sobres.
  - Page de référence `/design`, accessible en local uniquement (404 en production).
- 2026-10-09 : design system **MyWork** synchronisé sur claude.ai (tokens, typographie, composants de l'application avec aperçus, logos).
- 2026-10-09 : logo : le nom **MyWork** en Newsreader (lettres vectorisées), dont le **M est porté par un carré rouge** (un seul M ; la version « carré + nom complet » a été écartée, le M en double faisait bizarre). Le carré seul sert de favicon et d'icône d'application. Image de partage (1200 × 630) sur fond noir, lumière de studio et fine trame de points ; une première version en blocs de couleur a été écartée (« damier »). Fichiers dans `public/brand/`, composant `Logo` dans l'interface.
- 2026-10-10 : aucune copie locale de la base de données (pas de Supabase en local). Tant que le développement de l'application n'est pas terminé, développement et production utilisent le même projet Supabase en ligne, **MyWork**.
- 2026-10-10 : authentification (détail dans [auth.md](auth.md)) :
  - application entièrement privée, connexion obligatoire ; la page d'entrée est la **connexion** (une landing page viendra plus tard) ;
  - connexion par **Google** ou par **e-mail et mot de passe**, avec **confirmation de l'e-mail** (préférée à une liste d'adresses autorisées) ;
  - case « Rester connecté » à la connexion, mot de passe oublié, déconnexion ;
  - e-mails envoyés aux utilisateurs aux couleurs du design system ;
  - pas encore de page « Mon compte » : elle viendra avec les Paramètres ;
  - navigation de l'espace privé par une **barre latérale** très simple, dans l'esprit de l'application de bureau de Claude : le logo en haut, un lien « Profil » vers une page de profil provisoire (l'accueil après connexion), et en bas le bloc du profil, qui ouvre un menu avec le choix du thème (clair, sombre ou système) et « Se déconnecter ». Avatar : la photo Google, sinon l'initiale de l'e-mail ;
  - aucun test automatique n'envoie d'e-mail (quota de 2 par heure partagé avec l'usage réel) : les envois sont couverts par des tests unitaires, le bout en bout repart de liens générés par l'API d'administration ;
  - `supabase/config.toml` est d'abord aligné sur les réglages en ligne avant tout `config push`, qui envoie le fichier entier ;
  - e-mails par défaut de Supabase (en anglais) tant qu'on n'a pas notre propre service d'envoi : l'offre gratuite refuse les modèles personnalisés. Les modèles MyWork sont prêts et seront activés avec Resend ;
  - la clé secrète Supabase (tests de bout en bout uniquement) est rangée sur Vercel dans l'environnement « Development » seulement (jamais transmise aux déploiements), récupérée par `vercel env pull`, et copiée dans les secrets GitHub. Pas dans l'environnement des sessions cloud tant qu'on n'y lance pas les tests ;
  - fournisseur Google réglé dans le tableau de bord Supabase, pas dans `supabase/config.toml`, pour que son code secret ne passe jamais par le dépôt ;
  - le lien « mot de passe oublié » connecte l'utilisateur dès le clic (fonctionnement de Supabase), avant le choix du nouveau mot de passe : accepté ;
  - maquettes validées : direction **« Plaquette »** (formulaire centré dans une carte à filet fin, barre latérale claire), pour tous les écrans d'authentification, la page de profil et les deux e-mails. Écartées : « Diptyque » (volet noir et volet blanc) et « Catalogue » (grille éditoriale, sections numérotées).

## Questions ouvertes

- Format de l'URL publique (`<domaine>/<username>` ou `<username>.<domaine>`), domaine personnalisé : plus tard.
- Prix de l'abonnement et taille du quota : plus tard.
