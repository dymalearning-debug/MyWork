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

## Questions ouvertes

- Sous-domaine par utilisateur (`<identifiant>.<domaine>`) et domaine personnalisé : plus tard. Le profil public est à `<domaine>/<identifiant>` (décision du 2026-10-12).
- Noms des sous-pages publiques des modules : en anglais comme les autres routes (`/cv`, `/booking`, `/files`), ou en français pour les visiteurs (`/rendez-vous`, `/fichiers`). À trancher avec le premier module qui en a besoin.
- Prix de l'abonnement et taille du quota : plus tard.
