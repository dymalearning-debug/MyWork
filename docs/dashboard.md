# Tableau de bord

Spécification du tableau de bord (`/app`), l'accueil de l'espace privé : on y arrive après la connexion (voir [product.md](product.md), décision du 2026-10-13).
Statut : **en cadrage** depuis le 2026-10-18. Deux idées viennent du porteur du projet (les visites du profil, les rendez-vous du jour) ; les autres sont des propositions *(proposé)*, à garder ou à écarter. Pas encore de maquettes. Ce document se complète à mesure que l'application évolue : chaque nouveau module peut y ajouter son bloc.

## En bref

- Une **vue d'ensemble rapide** : ce qui s'est passé depuis la dernière visite, et ce qui arrive aujourd'hui.
- Des **blocs** (widgets), un par sujet, chacun avec un lien vers le module concerné.
- Rien ne se modifie depuis le tableau de bord : il montre et renvoie vers le bon endroit.
- Chaque bloc a un **état vide** utile (une phrase et un lien pour commencer), pour un compte tout neuf.

## Les blocs

### 1. Visites du profil public (idée du porteur du projet)

But : savoir si des recruteurs ou des clients potentiels sont venus voir le profil.

- **Visiteurs uniques** sur le profil public : sur 7 jours et sur 30 jours, avec l'écart par rapport à la période précédente (« +3 par rapport aux 7 jours d'avant »).
- Une **petite courbe** jour par jour sur 30 jours *(proposé)*.
- Détail par onglet : Profil, Rendez-vous, Ressources *(proposé)*.
- **D'où viennent les visiteurs** : LinkedIn, Google, Malt, accès direct (lien copié, e-mail)… *(proposé)*. C'est souvent l'indice le plus parlant : une visite venue de LinkedIn suit en général un message ou une candidature.
- Ce qui n'est **pas possible** : savoir *qui* est venu. Un visiteur reste anonyme ; seule une action (rendez-vous, contact, téléchargement, voir le bloc 3) dit qu'il s'est intéressé.
- Ne sont **pas comptés** : le propriétaire lui-même (connecté), les robots (moteurs de recherche, aperçus de lien de LinkedIn ou de Slack), l'aperçu d'un profil hors ligne.
- Visiteur « unique » : compté une fois par jour *(proposé)*. Méthode **sans cookie**, à la manière de Plausible : une empreinte du jour (adresse IP + navigateur + un sel qui change chaque jour), jamais l'adresse elle-même, comme l'anti-abus des rendez-vous ([booking.md](booking.md)). Pas de bandeau de cookies à afficher aux visiteurs, et rien qui permette de suivre quelqu'un d'un jour à l'autre (RGPD).
- Tout reste **dans notre base** (Supabase) *(proposé)* ; un service externe (Plausible, Vercel Analytics) a été envisagé : payant ou limité, et pensé pour un seul site, pas pour un compteur par utilisateur une fois en SaaS.
- Avance d'une idée notée *Plus tard* dans [modules.md](modules.md) et [public-profile.md](public-profile.md) (« statistiques de visites »).

### 2. Rendez-vous d'aujourd'hui et de demain (idée du porteur du projet)

But : voir d'un coup d'œil sa journée.

- Deux groupes, **« Aujourd'hui »** et **« Demain »**, comme la liste groupée par jour de « Mes rendez-vous » ([booking.md](booking.md)).
- Pour chaque rendez-vous : l'heure, le nom de l'invité, sa fonction et son entreprise, le **point rouge** s'il n'a pas encore été consulté. Un clic ouvre son détail dans « Mes rendez-vous ».
- Le prochain rendez-vous mis en avant, avec un compte à rebours et le bouton **« Rejoindre la visio »**, actif 15 minutes avant, comme ailleurs *(proposé)*.
- Rien aujourd'hui ni demain : « Aucun rendez-vous aujourd'hui ni demain », et la date du prochain s'il y en a un.
- Réservations fermées : un rappel, avec un lien vers « Disponibilités » *(proposé)*.

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
- **réservations fermées** ou aucune disponibilité réglée ;
- **profil incomplet** : un pourcentage et les sections manquantes (photo, titre, À propos…), idée notée *Plus tard* dans [profile.md](profile.md) ;
- **stockage** au-delà de 80 % ([drive.md](drive.md), *Indicateur de stockage*).

### 5. Raccourcis *(proposé)*

- L'adresse du profil public, avec **« Copier l'adresse »** et **« Ouvrir mon profil public »** (déjà dans le menu du profil, mais c'est l'action la plus fréquente avant d'envoyer une candidature).
- Un mot d'accueil avec le prénom et la date du jour.

### 6. Tableaux et Drive *(proposé, plus léger)*

- **Tableaux** : le dernier tableau consulté, avec ses cartes en cours (la liste du milieu) et l'avancement de leur checklist. Limité tant qu'il n'y a pas d'échéances ([boards.md](boards.md), *Plus tard*).
- **Drive** : les derniers fichiers ajoutés et l'indicateur de stockage.

## Plus tard

- Choix et ordre des blocs par l'utilisateur.
- Pays ou ville des visiteurs (déduits de l'adresse IP, sans la garder).
- Échéances des cartes des tableaux (quand elles existeront).
- Notification ou e-mail récapitulatif de la semaine (« 12 visites, 2 rendez-vous »).
- Liens entre modules ([modules.md](modules.md), *Liens entre modules*).

## Questions pour le porteur du projet

1. Quels blocs garder parmi les propositions (3 à 6) ?
2. Visites : périodes (7 et 30 jours ?) et détail par onglet et par provenance : utiles, ou trop ?
3. Un visiteur compté une fois par jour : d'accord ?
4. Ordre des blocs à l'écran : à décider avec les maquettes.
