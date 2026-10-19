# Produit : vision et cadrage

## Vision

Centraliser dans un seul outil, personnel et personnalisable, les services qu'un freelance paie séparément : profil professionnel en ligne (type LinkedIn), prise de rendez-vous, gestion de tâches, stockage de fichiers. De nouveaux modules pourront s'ajouter au fil du temps.

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
| Visio (avancée à l'étape 4) | **LiveKit** |
| Tests | **Vitest** (tests unitaires et de composants) et **Playwright** (tests de bout en bout dans un vrai navigateur) |
| Code | **GitHub**, tests automatiques à chaque modification |

- Les bibliothèques de détail (glisser-déposer, dates et fuseaux, génération de PDF…) se choisissent au début de chaque module, et s'ajoutent à l'*Inventaire technique* ci-dessous.
- Dès l'étape 1, des tests de bout en bout simulent les parcours utilisateur importants (inscription, réservation…).
- Coûts indicatifs (2026, à revérifier) : 0 € pendant le développement, en restant sur les offres gratuites. En usage réel, environ 20 $/mois pour Vercel Pro (l'offre gratuite est réservée à un usage non commercial) et 25 $/mois pour Supabase Pro (un projet gratuit est mis en pause après 7 jours sans activité), plus le nom de domaine.
- Écartés : no-code (trop limité, dépendance totale), Laravel et Rails (deux langages, moins bien maîtrisés par l'IA), base, authentification et stockage chez trois prestataires distincts (plus de pièces à assembler). Supabase reste du PostgreSQL standard, ce qui permet d'en sortir.

### Inventaire technique

Vue d'ensemble de tout ce qu'utilise l'application, au-delà des grands choix ci-dessus. **Tenue à jour à chaque choix technique** (service, bibliothèque, compartiment de fichiers, réglage). *Prévu* : décidé dans une fiche, pas encore installé.

**Services en ligne**

| Service | Usage | Où le voir | Depuis |
|---|---|---|---|
| Supabase, projet **MyWork** (`ulufanywmrporutivwgc`), Irlande, offre gratuite | Base PostgreSQL, comptes, fichiers | Tableau de bord Supabase | Étape 1 |
| Supabase Auth, fournisseur **Google** | Connexion Google (réglé dans le tableau de bord, pas dans le dépôt) | Supabase, *Authentication* ; Google Cloud | Étape 1 |
| Supabase Storage, compartiment **`profile-images`** | Photo du profil, images des projets. Public par adresse, un dossier par utilisateur, 5 Mo, JPG/PNG/WebP | Supabase, *Storage* | Étape 2 |
| Supabase Storage, compartiment **`board-images`** | Images des cartes. **Privé** (affichage par adresses temporaires, une heure), un dossier par utilisateur, 5 Mo, JPG/PNG/WebP/GIF ([boards.md](boards.md)) | Supabase, *Storage* | Étape 3 |
| **Vercel**, équipe `mywork-8619`, projet `linku` | Hébergement, production à chaque push sur `main`, aperçu par pull request. Fonctions à Washington (`iad1`) aujourd'hui, Dublin prévu | Tableau de bord Vercel | Étape 1 |
| Nom de domaine **`hellomywork.com`**, acheté chez Vercel (11,25 $/an, échéance le 2027-10-18) | Adresse de la production, reliée au projet `linku`. `www.hellomywork.com` y redirige ; `linku-nu.vercel.app` reste valide | Vercel, *Domains* | 2026-10-18 |
| **GitHub**, dépôt `dymalearning-debug/MyWork` | Code, tests automatiques à chaque modification | GitHub, *Actions* | Étape 1 |
| Supabase Storage, compartiment **`drive-files`** | Fichiers du Drive et leurs vignettes. **Privé** (téléchargement par adresses temporaires ; visiteurs : fichiers publics d'un profil en ligne seulement), un dossier par utilisateur, 50 Mo, tous types sauf exécutables ([drive.md](drive.md)) | Supabase, *Storage* | Étape 5 |
| **Resend**, compte du porteur du projet (connexion Google), offre gratuite (3 000 e-mails par mois, 100 par jour) | Envoi de tous les e-mails, depuis `MyWork <noreply@hellomywork.com>` : ceux de la connexion (Supabase, par SMTP) et ceux des rendez-vous (l'application, par l'API). Domaine `hellomywork.com` vérifié, région **Irlande** (`eu-west-1`), suivi des ouvertures et des clics désactivé. Enregistrements DNS (DKIM `resend._domainkey`, `send` et `rsend`, DMARC `_dmarc`) ajoutés chez Vercel. Clé `RESEND_API_KEY` (envoi seulement, ce domaine seulement) rangée dans Vercel ; code secret d'envoi des rendez-vous `BOOKING_EMAILS_SECRET` aussi ([booking.md](booking.md), *E-mails*) | resend.com, *Emails* (chaque envoi et son état) | 2026-10-18 |
| **LiveKit Cloud**, projet **MyWork** (`p_55iutdslog4`), région UE (Francfort), offre gratuite *Build* | Visio des rendez-vous ([booking.md](booking.md)). Compte créé le 2026-10-16 ; adresse `wss://mywork-2u2z4y18.livekit.cloud`. Clés rangées dans Vercel (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`), récupérées dans `.env.local` | cloud.livekit.io | Étape 4 |

**Bibliothèques** (`package.json`)

| Bibliothèque | Rôle | Depuis |
|---|---|---|
| Next.js 16, React 19, TypeScript | Application | Étape 1 |
| Tailwind CSS v4, shadcn/ui (Base UI), `cn`, `class-variance-authority`, `tw-animate-css` | Interface et design system | Étape 1 |
| `lucide-react` | Icônes | Étape 1 |
| `next-themes` | Thème clair, sombre ou système | Étape 1 |
| `sonner` | Notifications en bas à droite | Étape 1 |
| `@supabase/supabase-js`, `@supabase/ssr` | Accès à Supabase depuis l'application | Étape 1 |
| `supabase` (CLI, développement) | Migrations et réglages de la base | Étape 1 |
| Vitest, Playwright (`@playwright/test`) | Tests unitaires et de bout en bout | Étape 1 |
| dnd-kit (`@dnd-kit/*`) | Glisser-déposer (sections et listes du profil ; tableaux, listes, cartes et checklist) | Étape 2 |
| `react-easy-crop` | Recadrage de la photo | Étape 2 |
| `playwright-core`, `@sparticuz/chromium` | Navigateur sans écran sur Vercel, pour l'export du CV (PDF, PNG) | Étape 2 |
| `simple-icons` | Logos des liens du profil (LinkedIn dessiné à part) | Étape 2 |
| `@fontsource/newsreader` | Police de l'image de partage | Étape 2 |
| `react-markdown`, `remark-gfm`, `remark-breaks` | Affichage de la description des cartes en Markdown limité ([boards.md](boards.md)) : `remark-gfm` fait des adresses des liens, `remark-breaks` garde les retours à la ligne | Étape 3 |
| `tus-js-client` | Envoi reprenable des fichiers du Drive, directement du navigateur vers Supabase, avec progression ([drive.md](drive.md)) | Étape 5 |
| `date-fns`, `@date-fns/tz` | Dates et fuseaux horaires des rendez-vous : horaires du propriétaire convertis jour par jour, changements d'heure compris ([booking.md](booking.md)) | Étape 4 |
| `livekit-server-sdk`, `livekit-client`, `@livekit/components-react` | Visio : jetons d'accès côté serveur, salle dans le navigateur ([booking.md](booking.md)) | Étape 4 |
| `resend` | Envoi des e-mails des rendez-vous par l'API de Resend ([booking.md](booking.md)) | 2026-10-18 |
| Extensions PostgreSQL `btree_gist` et `pg_cron` (Supabase) | `btree_gist` : contrainte qui interdit deux rendez-vous qui se chevauchent ; `pg_cron` : tâches de la base chaque nuit (rendez-vous effacés un an après leur date, empreintes IP après un jour ; pour le tableau de bord, sels des visites de la veille, visites et signaux après 90 jours) | Étape 4 |

## Roadmap

Chaque étape correspond au périmètre MVP du module (voir [modules.md](modules.md)).

| # | Étape | Statut |
|---|---|---|
| 0 | Choix de la stack technique | Fait |
| 1 | Socle : authentification, compte, squelette du profil public | En cours |
| 2 | Module **Profil** (CV en ligne) et export | Fait (2026-10-14) |
| 3 | Module **Tableaux** (type Trello) | Développé (2026-10-14), décisions à valider |
| 4 | Module **Rendez-vous** (type Calendly), avec la visio | Développé (2026-10-16), quelques choix à valider |
| 5 | Module **Drive** (type Google Drive) | Développé (2026-10-15), quelques choix à valider |
| 6 | **Abonnement et paiement**, ouverture SaaS | À faire |
| 7 | Module **Visio** (type Zoom) : montée en charge (la visio des rendez-vous arrive à l'étape 4) | À faire |

## Décisions

Journal des choix validés (date : décision).

- 2026-10-06 : application web, pensée d'abord pour ordinateur.
- 2026-10-06 : ordre des modules : CV → Rendez-vous → Boards → Drive → Paiement → Visio. Tableaux avancés avant les Rendez-vous le 2026-10-14.
- 2026-10-06 : usage personnel d'abord, SaaS ensuite, avec un abonnement unique peu cher et un quota de stockage.
- 2026-10-06 : le MVP Rendez-vous se limite à la réservation. La visio vient après le paiement.
- 2026-10-06 : le socle (authentification, compte, profil public) est l'étape 1, juste après le choix de la stack.
- 2026-10-06 : CV multilingue dès le MVP.
- 2026-10-06 : Rendez-vous sans aucune synchronisation avec des agendas externes. Les créneaux se gèrent uniquement dans l'application.
- 2026-10-06 : Visio via une brique existante, **LiveKit** (référence open source, gratuite en auto-hébergement, offre cloud gratuite pour démarrer).
- 2026-10-06 : stack technique : TypeScript, Next.js, Tailwind CSS + shadcn/ui, Supabase, Vercel, Resend, Stripe, GitHub (voir *Stack technique*).
- 2026-10-06 : données hébergées dans l'UE chez des prestataires américains (Supabase, Vercel), préférés à des hébergeurs 100 % européens pour la simplicité et la maîtrise par l'IA.
- 2026-10-06 : budget nul pendant le développement (offres gratuites uniquement). Environ 45 $/mois accepté une fois l'outil en usage réel.
- 2026-10-18 : nom de domaine **`hellomywork.com`**, acheté chez Vercel par le porteur du projet (`mywork.com` et les « mywork » des autres extensions sont pris ; Vercel ne vend pas les `.fr`). Il devient l'adresse de la production ; l'ancienne adresse `linku-nu.vercel.app` reste valide.
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
- 2026-10-12 : squelette du profil public, préparé avant les modules pour qu'ils y branchent leur partie publique (détail dans [public-profile.md](public-profile.md)) :
  - adresses : profil public à `<domaine>/<identifiant>`, pages publiques des modules sous `/<identifiant>/…`, espace privé déplacé sous `/app/…`. L'adresse dit si l'on est en public ou en privé, et les noms des modules ne peuvent pas entrer en conflit avec un identifiant. Sous-domaine ou domaine personnel plus tard, sur les mêmes pages ;
  - la page publique **ignore la connexion** : elle lit les données comme un visiteur anonyme, même pour son propriétaire. Un nouvel onglet suffit donc pour voir son profil comme un visiteur. Une fenêtre de navigation privée, qu'un site ne peut pas ouvrir lui-même, est inutile ;
  - mise en page publique **distincte** de l'espace privé (pas de barre latérale), pensée d'abord pour le mobile. Préférée à la coque de l'espace privé avec un simple changement de titre ;
  - identifiant public généré à la création du compte, au format `prenom-nom` à partir du nom Google, sinon du début de l'e-mail ; `-2`, `-3`… en cas de doublon. Préféré au prénom seul (trop de doublons une fois en SaaS). Modifiable plus tard dans les Paramètres ;
  - interrupteur en ligne / hors ligne, **hors ligne par défaut**. Hors ligne, les visiteurs tombent sur une 404 ; le propriétaire voit un aperçu avec un bandeau « Hors ligne : vous seul voyez cette page ». En ligne, vue stricte, sans bandeau ;
  - maquettes validées ([Maquettes profil public](https://claude.ai/artifact/XmfpRWfmpH1FqnzEgksuEc)) :
    - page publique en **« Onglets »** : un en-tête (photo, titre, nom, bouton de l'action principale) et un onglet par module, chacun avec sa sous-page. Écartées : « Colonne » (une seule page qui défile) et « Sommaire » (une couverture et une tuile par module) ;
    - bandeau « Hors ligne » : une bande à l'encre en haut de la page ;
    - barre latérale inchangée : ni adresse, ni état, ni lien au-dessus du bloc du profil. Ces éléments (adresse et état affichés, boutons ou liens « ouvrir » et « copier ») ont été essayés puis retirés, jugés trop chargés ;
    - menu du profil réorganisé en sous-menus, pour rester compact : **Mon profil public** (interrupteur « Profil en ligne » / « Profil hors ligne », « Copier l'adresse », « Ouvrir mon profil public ») et **Thème** (Clair, Sombre, Système). Une ligne par entrée, sans valeur affichée ; dans les sous-menus, icônes à droite ;
    - interrupteur redessiné, plus lisible : **rouge** (`primary`) quand il est activé, gris sinon. L'interrupteur actuel, à l'encre, a été jugé peu clair ; le vert (`success`) a été écarté : un profil en ligne n'est pas un succès, le rouge rappelle la couleur principale.
  - précisions avant le développement :
    - l'identifiant est fabriqué **dans la base de données**, avec la liste des mots réservés (une table). Préféré à une fabrication par l'application après l'inscription, qui laisserait un moment des comptes sans identifiant. Ses règles sont donc testées de bout en bout sur la base en ligne, et non par des tests unitaires ;
    - cas limites de l'identifiant : nom trop court ou sans lettres latines, on passe à l'e-mail, sinon `profil` ; plus de 30 caractères, coupé entre deux mots ; partie de l'e-mail après un « + » ignorée ;
    - l'interrupteur est **arrondi** (pilule et rond qui glisse), comme dans la maquette : exception à la règle des angles droits, pour tous les interrupteurs de l'application ;
    - logo du pied de page de la page publique sans lien, tant qu'il n'y a pas de landing page ;
    - toutes les pages introuvables de l'application prennent le gabarit de la 404 du profil public (texte plus général hors des profils), à la place de la page par défaut de Next.js ;
    - titre de l'onglet provisoire : `<identifiant> · MyWork`, et `Page introuvable · MyWork` pour la 404.
- 2026-10-12 : Paramètres (détail dans [settings.md](settings.md)) :
  - une entrée « Paramètres » dans le menu du profil, entre « Mon profil public » et « Thème », qui ouvre une grande fenêtre de dialogue, comme dans l'application de bureau de Claude : les sections à gauche (pour l'instant « Profil » seule ; plus tard abonnement, réglages des modules), la page à droite ;
  - page Profil compacte, sans catégories ni textes d'aide : prénom, nom, adresse e-mail, puis, après un filet, « Adresse de mon profil public » (le mot « identifiant » a été jugé incompréhensible), avec une icône « ? » et son infobulle ; « Supprimer le compte » tout en bas, à gauche ;
  - un seul bouton « Enregistrer » pour toute la fenêtre, et « Annuler » qui ferme sans enregistrer. L'enregistrement automatique en quittant un champ a été envisagé puis écarté. Fermer avec des modifications non enregistrées (croix, Échap, clic à côté) pose la question « Enregistrer les modifications ? » ;
  - adresse e-mail affichée mais **non modifiable** pour l'instant : sa confirmation par e-mail attend Resend ;
  - prénom et nom facultatifs, pré-remplis depuis Google, vides pour un compte e-mail. Le bas de la barre latérale affiche le nom, sinon l'e-mail ;
  - adresse du profil public : vérifiée pendant la frappe, un seul message pour « prise » et « réservée », la règle de format seulement en cas d'erreur. **Pas de redirection** depuis l'ancienne adresse : elle casse, c'est accepté (on ne la change qu'une fois, au début) ;
  - suppression du compte après une confirmation qui avertit que toutes les données liées au compte seront supprimées ; puis déconnexion. Bouton en variante `destructive` (texte rouge sur fond rosé), le rouge plein restant à « Enregistrer » ;
  - **notifications en bas à droite** pour chaque action sur le compte (enregistrement, mise en ligne, suppression, plus tard abonnement…), qui disent ce qui a été fait ;
  - pas de raccourci clavier pour l'instant ;
  - suppression du compte par une fonction de la base, pour que la clé secrète Supabase reste réservée aux tests.
- 2026-10-13 : structure de l'espace privé, en préparation du module CV :
  - la barre latérale a deux liens : **« Tableau de bord »** puis **« Mon profil »** (et non plus « Profil ») ;
  - le **tableau de bord** (`/app`) devient l'accueil de l'espace privé : on y arrive après la connexion, ou en ouvrant MyWork. Il donnera une vue d'ensemble rapide de ce qui s'est passé dans les modules et sur le profil ; pour l'instant, un emplacement réservé (« Futures informations sur mon espace. ») ;
  - **« Mon profil »** (`/app/profile`) sera le CV du freelance : le module CV s'y construira. Pour l'instant, la même page provisoire, titrée « Mon profil ».
- 2026-10-13 : le module CV est renommé **module Profil**. Il se remplit dans « Mon profil » (`/app/profile`) et s'affiche dans l'onglet « Profil » du profil public (`/<identifiant>`), le premier que voit un visiteur : pas d'onglet « CV » à part. Le document exporté (PDF, PNG) reste un CV.
- 2026-10-13 : contenu du module Profil (détail dans [profile.md](profile.md)) :
  - rubriques inspirées de LinkedIn, et de Malt pour l'offre freelance : en-tête (photo, nom, titre, localisation, disponibilité), coordonnées et liens, À propos et compétences phares, offre freelance, expériences, formation, certifications, projets, compétences, langues, recommandations ;
  - **contenu en français seulement** : le multilingue, prévu au MVP (décision du 2026-10-06), est repoussé à plus tard ;
  - tout est facultatif : ce qui est rempli est public, ce qui est vide n'apparaît pas. Pas de réglage de visibilité champ par champ : le téléphone, s'il est rempli, est public ;
  - un interrupteur « Je propose mes services en freelance », activé par défaut. Désactivé, l'offre freelance (disponibilité, prestations, mode de travail, TJM) disparaît du formulaire et de la page publique, sans être effacée. Préféré à des champs freelance toujours présents, qu'un non-freelance laisserait vides ;
  - TJM facultatif, affiché s'il est rempli ;
  - e-mail de contact distinct de l'adresse de connexion (pré-rempli avec elle), affiché seulement au clic, contre les robots qui ramassent les adresses ;
  - compétences **sans niveau** (une note qu'on se donne soi-même convainc peu), et 5 compétences phares. La matrice d'attributs (notes sur 20) de la vitrine `/design` est écartée ;
  - expériences, formations et certifications rangées **par date, automatiquement** ; les sections et les autres listes, à la main ;
  - prénom et nom modifiables dans « Mon profil » et dans les Paramètres (les mêmes données) ;
  - recommandations saisies à la main par le propriétaire au MVP. Plus tard, un lien envoyé au client, pour qu'il écrive la sienne ;
  - écartés : bannière, pronoms, adresse postale, date de naissance, pause de carrière, brevets, cours, résultats aux tests, section « Sélection » et tout le côté réseau social. Plus tard : bénévolat, publications, distinctions, logos des entreprises, secteurs d'activité.
- 2026-10-13 : maquettes du module Profil validées telles quelles ([Maquettes module Profil](https://claude.ai/artifact/3zqQNUgNHsyofrPAqpxfoN), détail dans [profile.md](profile.md)) :
  - remplissage : **« Formulaire »**, toutes les sections sur une page, un sommaire à gauche, un seul « Enregistrer » dans une barre en bas. Écartées : « Sur place » (façon LinkedIn, une fenêtre par modification) et « Atelier » (formulaire et aperçu en direct côte à côte) ;
  - affichage : **« Classique »**, deux colonnes : le parcours à gauche ; l'offre freelance, les compétences, les langues et les liens à droite. Écartées : « Fiche » (une colonne façon fiche technique) et « Vitrine » (projets et prestations d'abord) ;
  - restent à dessiner pendant le développement : la page publique sur mobile et la mise en page du CV exporté.
- 2026-10-13 : module Profil développé (détail dans [profile.md](profile.md), *Précisé pendant le développement*). Choix faits en cours de route, à valider par le porteur du projet :
  - page publique sur mobile : une colonne, dans l'ordre des sections choisi ;
  - CV : A4 en deux colonnes, comme la page publique, sans images de projets ni recommandations ; aperçu et téléchargements (PDF, PNG) sous le sommaire de « Mon profil » ;
  - une seule notification à l'enregistrement, qui résume les changements, plutôt qu'une par action (rien n'est enregistré avant « Enregistrer ») ;
  - « Ordre des sections » dans un panneau sous le sommaire, plutôt qu'une fenêtre ;
  - bibliothèques : dnd-kit (glisser-déposer), react-easy-crop (recadrage de la photo), Chromium sans écran (Playwright et @sparticuz/chromium) pour l'export, Simple Icons pour les logos des liens.
- 2026-10-14 : module **Tableaux** (anciennement « Boards »), spécifié à partir des souhaits du porteur du projet (détail dans [boards.md](boards.md)) :
  - il passe en **étape 3**, avant les Rendez-vous ;
  - **uniquement privé** : ni tableaux publics, ni visiteurs, ni commentaires. Une première version de la fiche, le même jour, ouvrait des tableaux publics aux visiteurs ; abandonnée, l'outil sert à s'organiser seul ;
  - plusieurs tableaux ; 5 listes par tableau, 20 cartes par liste ;
  - cartes façon Trello : ajout d'un trait dans la liste, fenêtre avec description (mise en forme légère, Entrée et Maj+Entrée comme dans un chat d'IA), checklist visible sur la carte, images ;
  - maquettes validées ([Maquettes module Tableaux](https://claude.ai/artifact/2ZD8iW5GEuWmk5MhHZv9E8)) : tableau en direction **« Atelier »** (proche de Trello : listes sur fond gris, cartes blanches) avec la navigation de **« Pupitre »** (une seconde colonne qui liste les tableaux) ; fenêtre de carte « Atelier » (contenu à gauche, actions à droite). Écartées : « Registre » (éditoriale, listes numérotées) et le reste de « Pupitre » (cartes compactes, panneau latéral) ;
  - les autres choix (12, dont étiquettes et échéances repoussées, une seule checklist par carte, images privées) ont été pris sans le porteur du projet, à sa demande : liste dans [boards.md](boards.md), *Décisions à valider*.
- 2026-10-14 : module Tableaux développé (détail dans [boards.md](boards.md), *Précisé pendant le développement*). Choix faits en cours de route, à valider par le porteur du projet :
  - enregistrement depuis le navigateur, directement dans les tables, chaque changement affiché aussitôt et annulé avec un message s'il échoue ; plafonds vérifiés par la base ;
  - dernier tableau consulté retenu par appareil (cookie) ;
  - la première image devient la couverture, la suivante la remplace si on la supprime ;
  - bibliothèques : `react-markdown` avec `remark-gfm` (adresses en liens) et `remark-breaks` (retours à la ligne conservés) pour la description ; dnd-kit pour tous les glisser-déposer.
- 2026-10-14 : retours du porteur du projet sur le module Tableaux, après essai : la seconde colonne de navigation est retirée, remplacée par une **liste déroulante sur le nom du tableau** (avec « Nouveau tableau ») ; la barre latérale garde donc sa largeur habituelle. Le compteur de la checklist (« 3 / 5 · 60 % ») est retiré de la fenêtre de la carte, et le bouton « Copier le lien » des actions, jugés inutiles. Puis, au second essai : plus de nombre de cartes dans la liste déroulante ni sur les titres des listes ; plus de « 4 / 5 » sur « Ajouter une liste », qui disparaît à 5 listes, avec une notification à l'ajout de la cinquième ; le pourcentage seul au-dessus de la checklist (« 50 % »). Le reste de l'interface lui convient.
- 2026-10-15 : module **Drive**, spécifié à partir des souhaits du porteur du projet (détail dans [drive.md](drive.md)) :
  - une **mini-reproduction de Google Drive** réduite à sa partie centrale : une seule page, sans colonne de navigation, avec des dossiers pour s'organiser ;
  - affichage en **liste ou en grille**, au choix ; colonnes nom, propriétaire (soi seul pour l'instant), date de modification, taille ;
  - chaque fichier **privé par défaut** ; **public**, n'importe qui le télécharge depuis l'onglet **« Ressources »** du profil public ;
  - tri par nom et par date de modification, filtre par type (dossier, document…), petite barre de recherche, pagination classique ;
  - **indicateur de stockage** par rapport à la capacité de l'offre Supabase, avec une infobulle qui rappelle que la photo du profil et les images des tableaux comptent aussi ;
  - sous-pages publiques des modules **en anglais**, comme les autres routes (`/cv`, `/resources`, plus tard `/booking`) : la question ouverte est tranchée ;
  - les autres choix (15, dont « Mes fichiers » dans la barre latérale, pas de corbeille, visibilité sur les fichiers seulement, 50 Mo par fichier, capacité de 1 Go, sous-pages publiques en anglais) ont été pris sans le porteur du projet, à sa demande, puis validés par lui le même jour : liste dans [drive.md](drive.md), *Décisions validées*.
- 2026-10-15 : maquettes du module Drive validées ([Maquettes module Drive](https://claude.ai/artifact/XN5a5SThzrfYyjdMaN3vdi), détail dans [drive.md](drive.md)) :
  - « Mes fichiers » en direction **« A · Classeur »**, la plus proche de Google Drive (tableau dense, filtres en boutons, stockage en pied de page), sans le trait rouge à gauche des lignes sélectionnées ;
  - onglet « Ressources » en direction **« C · Inspecteur »** ;
  - nouvelle fonction, à l'idée du porteur du projet : une **ressource mise en avant**, affichée en grand en tête de l'onglet « Ressources » plutôt que dans la liste ;
  - écartées : « B · Catalogue » (éditoriale, types en onglets) et le panneau de détails de « C » pour « Mes fichiers ».
- 2026-10-15 : module Drive développé (détail dans [drive.md](drive.md), *Précisé pendant le développement*). Choix faits en cours de route, à valider par le porteur du projet : noms uniques sans tenir compte des majuscules ; changements enregistrés depuis le navigateur puis page relue (pas d'affichage anticipé) ; envois poursuivis d'un dossier à l'autre, 3 à la fois ; la taille réelle d'un fichier relevée par la base à la fin de l'envoi ; téléchargement public par un lien de la page qui fabrique l'adresse temporaire au clic ; dates à l'heure de Paris.
- 2026-10-16 : module **Rendez-vous**, spécifié à partir des souhaits du porteur du projet (détail dans [booking.md](booking.md)) :
  - une partie privée (liste des rendez-vous, disponibilités) et une partie publique (prise de rendez-vous) ;
  - rendez-vous de **30 minutes**, avec une pause entre deux rendez-vous, à la manière de Calendly ;
  - réservation avec **e-mail obligatoire**, fonction facultative (freelance, RH, dirigeant…), **message obligatoire** ;
  - **visio LiveKit intégrée dès cette étape** (elle était prévue à l'étape 7, après le paiement : la décision du 2026-10-06 est revue), salle accessible **environ 15 minutes avant** l'heure prévue ; avant, la page dit de revenir plus tard, pour ne pas consommer de minutes ;
  - **e-mails aux deux parties préparés mais pas envoyés** : Resend et le nom de domaine viendront plus tard ;
  - **préavis minimum** (4 heures par défaut) et **horizon de réservation** (2 mois par défaut) réglables dès le MVP ;
  - les autres choix (13, dont pause de 15 minutes, réservations fermées par défaut, lien secret de l'invité, anti-abus) ont été pris sans le porteur du projet, à sa demande, puis validés par lui le même jour : liste dans [booking.md](booking.md), *Décisions validées*.
- 2026-10-16 : maquettes du module Rendez-vous choisies ([Maquettes module Rendez-vous](https://claude.ai/artifact/Bfm68wvh3ZM7jAvZRjoAio), détail dans [booking.md](booking.md)) :
  - partie publique (le visiteur qui réserve) en direction **« B · Semainier »** : une semaine en colonnes avec une barre de sélection en bas, et la page de l'invité en « billet » avec compte à rebours ;
  - partie privée (« Mes rendez-vous ») en direction **« A · Agenda »** : liste groupée par jour ;
  - écartées : le calendrier du mois à la Calendly (A), l'agenda de la semaine pour « Mes rendez-vous » (B), toute la direction éditoriale « C · Carnet » ; retirées du canevas ;
  - écrans suivants dessinés dans ces styles et validés tels quels : « Disponibilités », prise de rendez-vous sur mobile, écran de préparation et salle de visio, quatre e-mails (dont l'annulation dans les deux sens). Le module est prêt pour le développement.
- 2026-10-18 : **Resend** branché (compte créé par le porteur du projet ; le reste décidé sans lui, à sa demande, à valider) :
  - expéditeur `MyWork <noreply@hellomywork.com>`, sur le domaine principal ; région Irlande ; pas de suivi des ouvertures ni des clics ;
  - Supabase envoie les e-mails de connexion par Resend : modèles MyWork en français activés, liens valables dans n'importe quel navigateur, **30 e-mails par heure** pour tout le site (au lieu de 2), et plus de limite aux seuls membres de l'équipe Supabase ;
  - les e-mails des rendez-vous partent pour de vrai ; ceux restés en attente (rendez-vous de test) sont **abandonnés** ;
  - l'application n'a toujours pas la clé secrète Supabase : elle prend les e-mails dans la file avec un **code secret d'envoi** (`BOOKING_EMAILS_SECRET`, dans Vercel), qui n'ouvre que cette file ;
  - les adresses réservées aux tests (`example.com`, `.test`…) ne reçoivent jamais rien ; un test de bout en bout envoie un vrai e-mail à l'adresse de test de Resend (`delivered@resend.dev`), seulement sur un poste où Resend est configuré (pas sur GitHub).
- 2026-10-15 : retours du porteur du projet sur « Mes fichiers », après essai : plus de nombre d'éléments à côté du titre ; dans un dossier, fil d'Ariane discret (texte courant, pas de titre en Newsreader) ; « Télécharger » ferme l'aperçu ; pied de page aligné sur le bloc du profil de la barre latérale.

- 2026-10-16 : module Rendez-vous développé, avec la visio (détail dans [booking.md](booking.md), *Précisé pendant le développement*). Choix faits en cours de route, à valider par le porteur du projet : code du lien de l'invité gardé en clair (pour « Copier le lien de l'invité ») ; un rendez-vous reste « À venir » jusqu'à la fermeture de sa salle ; point rouge retiré à l'ouverture du détail ; annulation par l'invité jusqu'au début ; compte à rebours en jours au-delà de 24 heures ; salle de visio assemblée avec les briques de LiveKit plutôt que son écran tout fait ; nouveau token `stage` (fond fixe des vidéos).
- 2026-10-18 : **tableau de bord**, cadré avec le porteur du projet (détail dans [dashboard.md](dashboard.md)) : quatre blocs, **visites du profil public** (visiteurs uniques sur 7 et 30 jours, détail par onglet et par provenance, comptés une fois par jour, sans cookie), **rendez-vous d'aujourd'hui et de demain**, **signaux d'intérêt** (rendez-vous réservés, « Me contacter », CV et ressources téléchargés) et **rappels** (profil hors ligne, réservations fermées, profil incomplet, stockage). Écartés : raccourcis, bloc Tableaux et Drive. Les statistiques de visites, notées *Plus tard*, sont avancées.
- 2026-10-19 : maquette du tableau de bord : direction **« Mosaïque »** retenue ([Maquette tableau de bord](https://claude.ai/artifact/2CDdmSAV6Big1aR46qknNK), détail dans [dashboard.md](dashboard.md)), « Rapport » et « Journée » écartées. Retours : rendez-vous **du jour seulement** (plus ceux de demain) ; **provenance des visiteurs retirée**. Le reste est gardé : visiteurs sur 7 et 30 jours, graphique sur 30 jours, détail par onglet, rappels, signaux d'intérêt.
- 2026-10-19 : tableau de bord **développé** (détail dans [dashboard.md](dashboard.md), *Précisé pendant le développement*). Visites comptées dans notre base, sans service externe ni cookie (empreinte avec un sel du jour, effacé la nuit suivante), données gardées 90 jours. Choix faits en cours de route, à valider : visite envoyée par la page affichée, signaux comptés à chaque fois, libellés « Réservations » et « Ressources », jours de Paris pour les visites.

## Questions ouvertes

- Sous-domaine par utilisateur (`<identifiant>.<domaine>`) et domaine personnalisé : plus tard. Le profil public est à `<domaine>/<identifiant>` (décision du 2026-10-12).
- Prix de l'abonnement et taille du quota : plus tard.
