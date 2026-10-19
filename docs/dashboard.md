# Tableau de bord

Spécification du tableau de bord (`/app`), l'accueil de l'espace privé : on y arrive après la connexion (voir [product.md](product.md), décision du 2026-10-13).
Statut : cadré à partir du 2026-10-18, **développé** le 2026-10-19 (voir *Précisé pendant le développement*). Deux idées viennent du porteur du projet (les visites du profil, les rendez-vous du jour) ; parmi les propositions, il a gardé les signaux d'intérêt et les rappels, et écarté les raccourcis et le bloc Tableaux et Drive (2026-10-18). Les choix marqués *(proposé)* dans les blocs gardés sont validés. Maquette **« Mosaïque »** choisie le 2026-10-19, avec deux retours : rendez-vous du jour seulement, provenance des visiteurs retirée (voir *Maquettes*), validée le même jour. Ce document se complète à mesure que l'application évolue : chaque nouveau module peut y ajouter son bloc.

## Maquettes

[Maquette tableau de bord](https://claude.ai/artifact/2CDdmSAV6Big1aR46qknNK) sur claude.ai (réglage « Tweaks » : thème clair ou sombre). Personnage fictif : Inès Robert.

- Retenue le 2026-10-19 : direction **« Mosaïque »**, une grille de tuiles séparées par des filets fins, de grands chiffres en Newsreader, comme une page de catalogue. De haut en bas :
  1. **Rendez-vous du jour** (grande tuile à gauche, sur deux rangées) : leur nombre, puis chaque rendez-vous ; « Rejoindre » sur celui qui commence bientôt, « Dans 4 h 42 » sur les suivants ;
  2. à droite, **visiteurs sur 7 jours** et **sur 30 jours** (deux tuiles), puis le **graphique** des visiteurs par jour sur 30 jours, les 7 derniers jours en rouge ;
  3. **par onglet sur 30 jours** (Profil, Rendez-vous, Ressources, avec des barres) et **rappels** (profil complet, stockage) ;
  4. une tuile par **signal d'intérêt** : rendez-vous réservés, « Me contacter », CV téléchargés, ressources, chacune avec son nombre sur 30 jours et la dernière occurrence.
- Écartées le 2026-10-19, retirées du canevas : « A · Rapport » (rappels en ligne, grand bloc Visites, rendez-vous et signaux côte à côte) et « B · Journée » (prochain rendez-vous en grand, agenda, colonne de droite).

## En bref

- Une **vue d'ensemble rapide** : ce qui s'est passé depuis la dernière visite, et ce qui arrive aujourd'hui.
- Des **blocs** (widgets), un par sujet, chacun avec un lien vers le module concerné.
- Rien ne se modifie depuis le tableau de bord : il montre et renvoie vers le bon endroit.
- Chaque bloc a un **état vide** utile (une phrase et un lien pour commencer), pour un compte tout neuf.

## Les blocs

### 1. Visites du profil public (idée du porteur du projet)

But : savoir si des recruteurs ou des clients potentiels sont venus voir le profil.

- **Visiteurs uniques** sur le profil public : sur 7 jours et sur 30 jours, avec l'écart par rapport à la période précédente (« +3 par rapport aux 7 jours d'avant »).
- Un **graphique** jour par jour sur 30 jours, les 7 derniers jours en rouge.
- Détail **par onglet sur 30 jours** : Profil, Rendez-vous, Ressources.
- La **provenance** des visiteurs (LinkedIn, Google, accès direct…), proposée puis validée le 2026-10-18, est **retirée** le 2026-10-19 : jugée peu importante.
- Ce qui n'est **pas possible** : savoir *qui* est venu. Un visiteur reste anonyme ; seule une action (rendez-vous, contact, téléchargement, voir le bloc 3) dit qu'il s'est intéressé.
- Ne sont **pas comptés** : le propriétaire lui-même (connecté), les robots (moteurs de recherche, aperçus de lien de LinkedIn ou de Slack), l'aperçu d'un profil hors ligne.
- Visiteur « unique » : compté **une fois par jour** (validé le 2026-10-18). Méthode **sans cookie**, à la manière de Plausible : une empreinte du jour (adresse IP + navigateur + un sel qui change chaque jour), jamais l'adresse elle-même, comme l'anti-abus des rendez-vous ([booking.md](booking.md)). Pas de bandeau de cookies à afficher aux visiteurs, et rien qui permette de suivre quelqu'un d'un jour à l'autre (RGPD).
- Tout reste **dans notre base** (Supabase) *(proposé)* ; un service externe (Plausible, Vercel Analytics) a été envisagé : payant ou limité, et pensé pour un seul site, pas pour un compteur par utilisateur une fois en SaaS.
- Avance une idée notée *Plus tard* dans [modules.md](modules.md) et [public-profile.md](public-profile.md) (« statistiques de visites »).

### 2. Rendez-vous du jour (idée du porteur du projet)

But : voir d'un coup d'œil sa journée.

- Les rendez-vous **d'aujourd'hui seulement** : ceux de demain ont été retirés le 2026-10-19. Leur nombre en grand, puis la liste par heure.
- Pour chaque rendez-vous : l'heure, le nom de l'invité, sa fonction et son entreprise, le **point rouge** s'il n'a pas encore été consulté. Un clic mène à « Mes rendez-vous ».
- Le bouton **« Rejoindre »** sur un rendez-vous dont la salle est ouverte (15 minutes avant, comme ailleurs) ; sur les suivants, le temps restant (« Dans 4 h 42 »).
- Rien aujourd'hui : « Aucun rendez-vous aujourd'hui », et la date du prochain s'il y en a un.
- Réservations fermées : voir les rappels (bloc 4).

### 3. Signaux d'intérêt *(proposé)*

But : compléter les visites par ce que les visiteurs ont **fait**, plus parlant qu'un simple passage. Sur 30 jours, avec les derniers en tête :

- **rendez-vous réservés** ;
- **« Me contacter »** ouvert (l'e-mail ou le téléphone affiché) ;
- **CV téléchargé** depuis la page publique ;
- **ressources téléchargées** (fichiers publics du Drive), avec la plus téléchargée.

Ces actions sont anonymes elles aussi, sauf la réservation (l'invité laisse son nom).

### 4. À faire pour son profil *(proposé)*

Une courte liste de rappels, qui disparaissent une fois réglés :

- profil **hors ligne** : « Votre profil n'est visible par personne », avec l'interrupteur ;
- **réservations fermées** (lien vers « Disponibilités ») ;
- **profil incomplet** : un pourcentage et ce qui manque (les trois premiers éléments), idée notée *Plus tard* dans [profile.md](profile.md). Dix éléments, 10 % chacun : photo, titre, localisation, présentation, coordonnées (e-mail ou téléphone), liens, expériences, formation, compétences, langues ;
- **stockage** au-delà de 80 % ([drive.md](drive.md), *Indicateur de stockage*).

### Écartés (2026-10-18)

- **Raccourcis** (adresse du profil à copier ou ouvrir, mot d'accueil) : déjà dans le menu du profil.
- **Tableaux et Drive** (cartes en cours, derniers fichiers) : le tableau de bord se concentre sur le profil public et les rendez-vous.
- (2026-10-19) **Provenance des visiteurs** et **rendez-vous de demain**.

## Données

- **`profile_visits`** : une ligne par visiteur, onglet (`profile`, `booking`, `resources`) et jour (jour de Paris) ; le visiteur est une empreinte SHA-256 de l'adresse IP et du navigateur, avec le sel du jour. Effacées au bout de 90 jours.
- **`profile_visit_salts`** : le sel aléatoire de chaque jour, créé à la première visite du jour et **effacé la nuit suivante** : les empreintes ne peuvent plus être rapprochées de personne.
- **`profile_events`** : les signaux « Me contacter » (`contact`), CV (`cv`) et ressource (`resource`, avec le nom du fichier à ce moment). Effacés au bout de 90 jours. Les réservations sont lues dans `bookings`.
- Aucune de ces tables n'est ouverte à l'API : on y écrit par `record_profile_visit` et `record_profile_event` (ouvertes aux visiteurs), on lit tout le tableau de bord par `get_own_dashboard` (le propriétaire connecté). Ces fonctions ignorent le propriétaire lui-même et un profil hors ligne.
- Tâches de la nuit (`pg_cron`) : sels de la veille, visites et signaux de plus de 90 jours.

## Précisé pendant le développement

Choix faits le 2026-10-19 sans le porteur du projet, à valider :

- La visite est envoyée par la page une fois affichée dans le navigateur : les robots qui n'exécutent pas la page ne comptent jamais, les autres sont écartés par leur navigateur déclaré (Googlebot, LinkedInBot, Slackbot…). Le navigateur intégré à l'application LinkedIn compte, lui, comme un vrai visiteur.
- Le propriétaire est reconnu à sa session : connecté sur le même navigateur, ses visites ne comptent pas.
- Jours à l'heure de Paris pour les visites (comme les dates du Drive) ; rendez-vous du jour dans le fuseau du propriétaire (réglé dans « Disponibilités »).
- Un signal est compté à chaque fois (pas une seule fois par jour) : ouvrir trois fois « Me contacter » fait 3. Un robot qui appellerait directement la base pourrait gonfler les chiffres : accepté au MVP, comme la limite de réservations.
- Libellés des tuiles de signaux raccourcis (« Réservations », « Ressources ») pour tenir sur une ligne ; la tuile des ressources donne la plus téléchargée (« Étude de cas.pdf · 6 »).
- Rappels vides : « Tout est en ordre. ». Profil hors ligne : un rappel en tête.
- Tuiles visibles dans la vitrine `/design`, avec des données fictives.
- Le tableau de bord est plus haut que l'écran : le menu du profil et ses sous-menus sont désormais placés par rapport à la fenêtre (comme la barre latérale), pour qu'ils ne bougent ni ne se ferment quand la page défile. Les tests qui trouvaient un texte en double (la page quittée reste cachée dans le document) ne regardent plus que l'élément visible.

## Tests

- Unitaires (`src/lib/dashboard/rules.test.ts`) : robots écartés (et pas le navigateur de LinkedIn), écarts avec la période d'avant, « Il y a 5 h » et « Hier · 18:12 », temps restant, profil complet, rappels.
- Bout en bout (`e2e/dashboard.spec.ts`) :
  - compte neuf : aucun rendez-vous, zéro visiteur, rappels « Profil hors ligne », « Réservations fermées », « Profil complet » ;
  - visites : deux visiteurs (deux adresses), dont un qui revient, comptent 2 ; jamais l'adresse en clair ; ni le propriétaire connecté, ni un profil hors ligne ; le tableau de bord affiche 2 et l'onglet Profil 2 ;
  - signaux : « Me contacter » ouvert par un visiteur compte, pas par le propriétaire ; un fichier qui n'est pas une ressource publique ne compte pas ; les visiteurs ne lisent pas les tables ;
  - rendez-vous : seul celui du jour apparaît, avec son point rouge et « Rejoindre » 5 minutes avant.

## Plus tard

- Choix et ordre des blocs par l'utilisateur.
- Pays ou ville des visiteurs (déduits de l'adresse IP, sans la garder) ; provenance des visiteurs, si le besoin revient.
- Échéances des cartes des tableaux (quand elles existeront).
- Notification ou e-mail récapitulatif de la semaine (« 12 visites, 2 rendez-vous »).
- Liens entre modules ([modules.md](modules.md), *Liens entre modules*).

## Questions pour le porteur du projet

1. ~~Blocs à garder~~ : signaux d'intérêt et rappels gardés, raccourcis et Tableaux-Drive écartés (2026-10-18).
2. ~~Visites~~ : 7 et 30 jours et détail par onglet validés (2026-10-18) ; provenance retirée (2026-10-19).
3. ~~Visiteur compté une fois par jour~~ : validé (2026-10-18).
4. ~~Ordre et disposition~~ : direction « Mosaïque » (2026-10-19). Reste à valider la maquette retouchée.
