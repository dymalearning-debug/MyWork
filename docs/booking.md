# Module Rendez-vous

Spécification du module Rendez-vous (type Calendly), étape 4 de la roadmap (voir [product.md](product.md), *Roadmap*), avec la **visio** (LiveKit), avancée de l'étape 7.
Statut : **spécifié** le 2026-10-16, à partir des souhaits du porteur du projet. Les choix marqués *(proposé)* ont été pris sans lui, à sa demande, puis **validés** par lui le même jour (voir *Décisions validées*). Maquettes **validées** le même jour : direction B pour la partie publique, A pour la partie privée (voir *Maquettes*). **Développé** le 2026-10-16 (voir *Précisé pendant le développement*), pas encore commité ni en production ; quelques choix faits en cours de route restent à valider.

## En bref

- **Côté public** : un onglet **« Rendez-vous »** sur le profil public. Le visiteur choisit un jour, puis un créneau de **30 minutes**, et remplit un court formulaire : nom, **e-mail** (obligatoire), fonction (facultatif) et **message** (obligatoire).
- **Côté privé** : une page **« Mes rendez-vous »**, avec la liste des rendez-vous et les **disponibilités** (horaires de la semaine, jours bloqués, quelques réglages).
- Chaque rendez-vous a sa **salle de visio** (LiveKit), ouverte **15 minutes avant** l'heure prévue. Avant, la page dit de revenir plus tard : aucune minute de visio n'est consommée pour rien.
- Les **e-mails** (confirmation à l'invité, avis au propriétaire, annulation) sont **préparés mais pas envoyés** : modèles, contenus et file d'envoi sont prêts, l'envoi sera branché avec Resend et le nom de domaine, plus tard.
- Pas de synchronisation avec un agenda externe (décision du 2026-10-06) : on bloque à la main les jours pris ailleurs.

## Maquettes

**Validées** le 2026-10-16 : [Maquettes module Rendez-vous](https://claude.ai/artifact/Bfm68wvh3ZM7jAvZRjoAio) sur claude.ai. Le canevas ne garde que les écrans retenus, rangés par partie : publique (direction **B · Semainier**), privée (direction **A · Agenda**), visio, e-mails. Réglage « dark » sur chaque planche, sauf les e-mails (toujours en clair). Personnage fictif : Inès Robert.

| Planche | Ce qu'elle montre |
|---|---|
| `Public — Prendre rendez-vous` (cliquable : semaine, créneau, formulaire, confirmation) | Une semaine en colonnes, barre de sélection en bas ; formulaire avec le récapitulatif à gauche ; confirmation avec le lien (voir *Choisir un créneau*, *Le formulaire*, *Confirmation*) |
| `Public — Page de l'invité (mobile)` (réglage « état » : trop tôt, salle ouverte, terminé, annulé) | Le « billet » : grande date, heure, participants, compte à rebours (voir *Page du rendez-vous*) |
| `Privé — Mes rendez-vous` | Liste des rendez-vous groupée par jour (voir *La liste*) |
| `Privé — Disponibilités` (cliquable) | Coque de « Mes rendez-vous », onglet « Disponibilités ». En tête, l'interrupteur « Réservations ouvertes / fermées » avec une phrase qui dit l'effet. À gauche, les horaires de la semaine : une case (encre) par jour, ses plages en listes « 09:00 – 12:00 », une croix par plage, « + » pour en ajouter ; « Fermé » pour un jour décoché. À droite, les jours particuliers (avec l'avertissement « 1 rendez-vous ce jour-là · voir ») et les réglages en listes déroulantes. En bas, une barre « Modifications non enregistrées », « Annuler » et « Enregistrer » (rouge) |
| `Public — Prendre rendez-vous (mobile)` (cliquable) | En-tête compact du profil, onglets ; une rangée des sept jours de la semaine (jour et date, grisés s'ils sont fermés), les créneaux du jour choisi en trois colonnes, la barre de sélection et « Continuer » collées en bas (voir *Choisir un créneau*) |
| `Visio — Écran de préparation` (cliquable) | Aperçu de la caméra en 16:9, boutons micro et caméra posés dessus (rouge quand coupés), niveau du micro ; à droite : date, « Prêt à entrer ? », qui est déjà là, choix du micro, de la caméra et du haut-parleur, « Entrer dans la salle » (rouge) |
| `Visio — Dans la salle` (réglages « état », « discussion », « fermeture ») | Bandeau du haut : l'autre participant, l'heure de fin prévue, le temps écoulé. La vidéo de l'autre en grand, la sienne en vignette en bas à droite ; en attente, « Inès Robert va vous rejoindre ». Discussion écrite en panneau à droite. Bandeau « La salle ferme dans 5 minutes ». Barre du bas : Micro, Caméra, Partager l'écran, Discussion, et « Quitter » (`destructive`) |
| `E-mail — …` (quatre planches) | Confirmation (invité), Nouvelle réservation (propriétaire), Annulation à l'invité (par le propriétaire), Annulation au propriétaire (par l'invité). Même gabarit que les e-mails d'authentification (voir [auth.md](auth.md), *E-mails*) : objet affiché au-dessus, carte blanche, logo, étiquette, titre en Georgia, détails en lignes, bouton rouge, lien en clair. L'annulation existe dans les deux sens. Rouge des étiquettes « Annulé » : `#a3261f`, ajouté aux valeurs fixes des e-mails (d'après `destructive`) |

- Les écrans de visio prennent les tokens de l'application ; les vidéos sont sur un fond encre fixe (`--stage`), dans les deux thèmes.
- Écartées et retirées du canevas le 2026-10-16 : dans « A · Agenda », la prise de rendez-vous en calendrier du mois et la page de l'invité en carte sobre ; dans « B · Semainier », l'agenda de la semaine pour « Mes rendez-vous » ; toute la direction « C · Carnet » (éditoriale, une colonne, étapes numérotées).

## Vocabulaire

- **Propriétaire** : le freelance, titulaire du compte. **Invité** : la personne qui réserve, sans compte MyWork.
- **Disponibilités** : les plages horaires de la semaine où l'on accepte des rendez-vous. **Créneau** : un horaire précis proposé au visiteur (« mardi 21 octobre, 10 h 30 »). **Rendez-vous** : un créneau réservé (« booking » dans le code).
- **Lien du rendez-vous** : l'adresse secrète, propre à chaque rendez-vous, qui permet à l'invité de le retrouver, de rejoindre la visio ou d'annuler, sans compte.

## Ce que fait Calendly, et ce qu'on en garde

Calendly, à la création d'un type de rendez-vous, propose ([aide Calendly](https://help.calendly.com/hc/en-us/articles/1500004754122)) : des horaires par jour de la semaine, des exceptions par date, des créneaux toutes les 30 minutes, une **pause** (« buffer ») avant ou après chaque rendez-vous (aucune par défaut), un **préavis minimum** (on ne réserve pas un créneau qui commence dans moins de 4 heures, par défaut), un **horizon** (60 jours à l'avance), une **limite par jour** facultative, la détection du fuseau horaire du visiteur, et un lien d'annulation dans l'e-mail.

On garde tout cela, avec des valeurs par défaut adaptées et un seul type de rendez-vous (voir *Réglages*). On laisse de côté : plusieurs types de rendez-vous et plusieurs durées, les rendez-vous de groupe, le paiement à la réservation, les questions personnalisées, les invités supplémentaires, la replanification par l'invité, les rappels (plus tard, avec Resend).

## Navigation

- Un cinquième lien dans la barre latérale, **« Mes rendez-vous »**, sous « Mes fichiers », vers `/app/booking` *(proposé : dans la lignée de « Mes tableaux » et « Mes fichiers » ; `booking`, comme l'onglet public `/booking` décidé le 2026-10-15)*.
- La page a deux onglets : **« Rendez-vous »** (`/app/booking`) et **« Disponibilités »** (`/app/booking/availability`).
- Sur le profil public : l'onglet **« Rendez-vous »** (`/<identifiant>/booking`), après « Profil » et avant « Ressources ».

## Espace privé : « Rendez-vous »

### La liste

- Mise en page **« A · Agenda »** (planche `Privé — Mes rendez-vous`, validée le 2026-10-16) : le titre « Mes rendez-vous » (Newsreader) avec, à droite, « Copier l'adresse de réservation » ; les onglets « Rendez-vous » et « Disponibilités » ; puis la liste.
- Trois filtres en boutons accolés, en tête : **« À venir · 4 »** (par défaut, en encre), **« Passés »**, **« Annulés »**.
- Un rendez-vous non consulté porte le même **point rouge** que « Mes rendez-vous » dans la barre latérale, à côté du nom.
- Les rendez-vous **groupés par jour** (« Mardi 21 octobre »), du plus proche au plus lointain pour « À venir », l'inverse pour les autres. « Aujourd'hui » et « Demain » écrits en toutes lettres.
- Une ligne par rendez-vous : l'heure (« 10 h 30 – 11 h 00 »), le nom de l'invité, sa fonction en atténué, le début du message sur une ligne ; à droite, le bouton **« Rejoindre »** et le menu « … ».
- **« Rejoindre »** : rouge et actif à partir de 15 minutes avant le début, jusqu'à 30 minutes après la fin prévue ; avant, grisé, avec l'infobulle « La salle ouvre à 10 h 15 ».
- Un clic sur la ligne ouvre le **détail**, dans une fenêtre : date et heure, nom, e-mail (avec « Copier » et « Écrire »), fonction, message en entier, date de la réservation, le lien de visio de l'invité (« Copier le lien de l'invité », utile tant que les e-mails ne partent pas), et les actions.
- Menu « … » : Voir le détail, Copier le lien de l'invité, **Annuler le rendez-vous** (en `destructive`, après un séparateur). Dans « Passés » et « Annulés » : Supprimer.
- Vide : « Aucun rendez-vous à venir », avec « Partagez votre profil public pour en recevoir » et un bouton « Copier l'adresse de réservation ».
- Pas de pagination au MVP : les « À venir » tiennent sur une page ; « Passés » et « Annulés » chargent 50 rendez-vous de plus à la demande (« Afficher plus ») *(proposé)*.

### Annuler un rendez-vous (propriétaire)

- Une petite fenêtre : « Annuler le rendez-vous avec Marc Dubois, mardi 21 octobre à 10 h 30 ? », un champ facultatif « Message pour l'invité », et le bouton `destructive` « Annuler le rendez-vous ».
- Le rendez-vous passe dans « Annulés », le créneau redevient libre, l'e-mail d'annulation est préparé pour l'invité (voir *E-mails*). Une notification le confirme.
- Le lien du rendez-vous affiche alors « Ce rendez-vous a été annulé », avec le message s'il y en a un, et « Réserver un autre créneau ».

### Supprimer

- Seuls les rendez-vous passés ou annulés se suppriment, définitivement, après confirmation (données de l'invité effacées : voir *RGPD*).

## Espace privé : « Disponibilités »

### Horaires de la semaine

- Une ligne par jour, du lundi au dimanche : une case à cocher (jour ouvert ou fermé), puis une ou plusieurs **plages** (« 9 h 00 – 12 h 00 », « 14 h 00 – 18 h 00 »), chacune avec sa croix, et « + » pour en ajouter une.
- Heures choisies par pas de 30 minutes, dans une liste.
- Par défaut, à la première visite : **lundi au vendredi, 9 h – 12 h et 14 h – 18 h** ; samedi et dimanche fermés *(proposé)*.
- Plages d'un même jour qui se chevauchent : refusées avec un message.

### Jours particuliers (exceptions)

- Une liste de dates, avec « Ajouter une date » : un petit calendrier où l'on choisit **un ou plusieurs jours**, puis « Indisponible toute la journée » ou des horaires propres à ces jours.
- Sert aux congés, aux jours pris par un autre engagement, ou à un samedi exceptionnel.
- Les dates passées disparaissent de la liste.
- Un jour particulier qui contient déjà des rendez-vous : ils ne sont pas annulés d'office ; un avertissement les signale, avec un lien vers eux.

### Réglages

Sous les horaires, quelques réglages, avec leur valeur par défaut :

| Réglage | Valeurs | Par défaut |
|---|---|---|
| **Pause après un rendez-vous** | Aucune, 15 min, 30 min | **15 min** *(proposé)* |
| **Préavis minimum** | 1 h, 2 h, 4 h, 12 h, 24 h, 48 h | **4 h**, comme Calendly |
| **Réservable jusqu'à** | 2 semaines, 1 mois, 2 mois, 3 mois | **2 mois** (60 jours), comme Calendly |
| **Rendez-vous par jour, au plus** | Pas de limite, 1 à 8 | **Pas de limite** |
| **Fuseau horaire** | Liste des fuseaux | **Europe/Paris** (détecté du navigateur à la première visite) |

- Durée **fixe : 30 minutes** (demande du porteur du projet), non réglable au MVP.
- Un seul « Enregistrer » pour toute la page, comme dans les Paramètres, et la même question en quittant la page avec des modifications non enregistrées.
- Changer ses horaires n'annule aucun rendez-vous déjà pris.

### Ouvrir ou fermer les réservations

- En tête de « Disponibilités », un interrupteur **« Réservations ouvertes »** / **« Réservations fermées »**, **fermé par défaut** *(proposé, comme la mise en ligne du profil : rien n'est réservable avant qu'on ait vérifié ses horaires)*.
- Fermées : l'onglet « Rendez-vous » disparaît du profil public, l'adresse `/<identifiant>/booking` mène à la page introuvable, le bouton « Prendre rendez-vous » de l'en-tête aussi disparaît. Les rendez-vous déjà pris restent valables, et leurs liens marchent.
- L'onglet suit aussi l'interrupteur du profil : profil hors ligne, aucune réservation possible (voir [public-profile.md](public-profile.md)).

## Calcul des créneaux

- Les créneaux commencent sur une **grille de 30 minutes** (9 h 00, 9 h 30, 10 h 00…), à l'intérieur des plages du jour, et le rendez-vous doit finir avant la fin de la plage.
- Un créneau est retiré s'il chevauche un rendez-vous existant **ou la pause qui le suit** (et celle qui le précède : le créneau doit lui-même laisser sa pause avant le rendez-vous suivant).
- **Après un rendez-vous, le créneau suivant démarre dès la fin de la pause**, même hors de la grille : avec une pause de 15 minutes, un rendez-vous de 9 h 00 laisse libres 9 h 45, puis 10 h 00, 10 h 30… (réserver 9 h 45 retire à son tour 10 h 00) *(proposé : sans cela, une pause de 15 minutes sur une grille de 30 bloquerait en fait 30 minutes, ce que le porteur du projet ne voulait pas)*.
- Retirés aussi : les créneaux qui commencent avant le **préavis minimum**, ceux au-delà de l'**horizon**, ceux des **jours indisponibles**, et tous ceux d'un jour qui a atteint sa **limite**.
- Les créneaux sont calculés dans le fuseau du propriétaire (ses horaires « 9 h – 18 h » sont à son heure, changements d'heure compris), puis affichés dans celui du visiteur.

## Profil public : onglet « Rendez-vous »

### En-tête du profil

- Réservations ouvertes : le bouton rouge de l'en-tête devient **« Prendre rendez-vous »**, qui mène à l'onglet ; « Me contacter » passe en second, en bouton encre (comme prévu dans [profile.md](profile.md)).

### Choisir un créneau

Mise en page **« B · Semainier »** (planche `Public — Prendre rendez-vous`, validée le 2026-10-16) :

- Une barre en tête : à gauche « Visio · 30 min » et le **fuseau horaire du visiteur**, détecté par son navigateur (« Heure de Paris · changer ») ; à droite, la **semaine affichée** (« Semaine du 19 au 25 octobre ») entre deux flèches, dans la limite de l'horizon. La première semaine qui a un créneau libre s'affiche d'office.
- Dessous, **une colonne par jour**, du lundi au dimanche, dans un cadre à filet : en tête, le jour en étiquette (« LUN. ») et la date en grand (Newsreader) ; dessous, les **créneaux libres** du jour, en boutons empilés (« 09:00 », « 09:45 »…), qui défilent si la colonne déborde. Un jour sans créneau a un fond gris perle et un mot : « Fermé » (hors horaires) ou « Indisponible » (jour particulier, ou plus aucun créneau).
- Un clic sur un créneau le sélectionne (fond encre) ; un seul créneau sélectionné à la fois, même en changeant de semaine.
- En bas, une **barre de sélection** (fond gris perle) : « Choisissez un créneau. » tant que rien n'est choisi, puis « **Lundi 19 octobre** · 10:30 – 11:00 », et à droite le bouton rouge **« Continuer »**, grisé tant qu'aucun créneau n'est choisi.
- Sur l'onglet « Rendez-vous », le bouton de l'en-tête est « Me contacter » (bordure fine) : le rouge reste à « Continuer » *(constaté dans la maquette)*.
- Aucun créneau dans tout l'horizon : « Aucun créneau disponible pour le moment », avec « Me contacter » si un moyen de contact existe.
- Sur mobile (planche `Public — Prendre rendez-vous (mobile)`) : la rangée des sept jours de la semaine, un jour choisi à la fois, ses créneaux en trois colonnes dessous, la barre de sélection et « Continuer » collées en bas de l'écran.

### Le formulaire

Après « Continuer », en deux colonnes (maquette B) : à gauche, le **récapitulatif** du créneau dans un encart gris perle (« Votre créneau », la date en grand, « 10:30 – 11:00 », « Visio · Heure de Paris », « Changer de créneau ») ; à droite, le formulaire :

| Champ | Obligatoire | Détail |
|---|---|---|
| **Nom** | Oui | 100 caractères. Indispensable pour la liste et les e-mails *(proposé : non cité par le porteur du projet, mais Calendly le demande toujours)* |
| **E-mail** | Oui | Format vérifié |
| **Fonction** | Non | 100 caractères, champ libre, exemple affiché : « Recruteuse, dirigeant, freelance… » |
| **Entreprise** | Non | 100 caractères *(proposé)* |
| **Message** | Oui | 1 000 caractères, compteur à l'approche de la limite. Libellé : « Objet du rendez-vous » |

- Sous le formulaire, une phrase de confidentialité : « Vos informations sont transmises à Inès Robert, uniquement pour ce rendez-vous. »
- Bouton rouge **« Confirmer le rendez-vous »**.
- Créneau pris entre-temps par quelqu'un d'autre : « Ce créneau vient d'être réservé. Choisissez-en un autre. », retour au calendrier, saisie conservée.

### Confirmation

- Une page « Rendez-vous confirmé » (maquette B : la date et l'heure en grand à gauche, le lien dans un cadre en pointillés à droite) : le récapitulatif, et, **tant que les e-mails ne partent pas**, l'essentiel pour ne rien perdre :
  - **« Ajouter à mon agenda »** : un fichier `.ics` (Google Agenda, Outlook, Apple Calendrier), avec le lien de visio dedans ;
  - le **lien du rendez-vous**, à copier, avec « Gardez ce lien : il permet de rejoindre la visio et d'annuler. » ;
  - une ligne honnête : « Un e-mail de confirmation vous sera envoyé » n'apparaît **pas** tant que l'envoi n'est pas branché.
- Cette page **est** la page du lien du rendez-vous (voir ci-dessous) : l'invité y est redirigé, son adresse est donc dans l'historique de son navigateur.

## Page du rendez-vous (lien de l'invité)

- Adresse : `/<identifiant>/booking/<code>`, où le code est long et tiré au hasard, impossible à deviner *(proposé)*. Pas de compte, pas de mot de passe : qui a le lien gère le rendez-vous.
- Contenu : avec qui (photo et nom du propriétaire), quand (dans le fuseau du visiteur), « Visio · 30 min », et selon le moment :
  - **plus de 15 minutes avant** : « La salle de visio ouvrira le mardi 21 octobre à 10 h 15, 15 minutes avant le rendez-vous. Revenez à ce moment-là. », avec un compte à rebours quand il reste moins d'une heure ; le bouton « Rejoindre la visio » est grisé ;
  - **de 15 minutes avant à 30 minutes après la fin prévue** : bouton rouge **« Rejoindre la visio »** ;
  - **ensuite** : « Ce rendez-vous est terminé. », et « Réserver un autre créneau » ;
  - **annulé** : « Ce rendez-vous a été annulé », le message du propriétaire s'il y en a un, et « Réserver un autre créneau ».
- Actions tant que le rendez-vous est à venir : « Ajouter à mon agenda » (`.ics`) et **« Annuler le rendez-vous »** (confirmation, champ facultatif « Motif »). Pas de replanification au MVP : annuler, puis réserver un autre créneau *(proposé)*.
- Le lien marche **même si le profil passe hors ligne ou les réservations fermées** : un rendez-vous pris doit pouvoir se tenir.
- `noindex` : jamais référencée.
- Mise en page **« B · Semainier »**, en « billet » (planche `Public — Page de l'invité (mobile)`, validée le 2026-10-16), pensée d'abord pour le mobile :
  - en tête, l'état en étiquette (« Rendez-vous confirmé », « C'est l'heure », « Rendez-vous passé », « Rendez-vous annulé ») et, à droite, une **référence courte** du rendez-vous (« N° K7QM-2XR9 »), distincte du code secret du lien *(proposé : la référence ne doit jamais permettre de retrouver le lien)* ;
  - le **billet**, un cadre à filet en deux parties séparées par un pointillé : en haut, le jour (« Mardi », « 20 » en très grand, « octobre 2026 ») et l'heure (« 10:30 », « jusqu'à 11:00 », « Heure de Paris »), puis les deux participants (photo et nom du propriétaire, « Vous ») reliés par l'icône de la visio ; en bas, l'état de la salle : le **compte à rebours** en grand (« 01:42:10 avant l'ouverture de la salle, à 10:15 ») et le bouton grisé, ou « La salle est ouverte » et le bouton rouge, ou « Terminé », ou « Annulé par Inès Robert » avec son message ; la date et l'heure sont barrées pour un rendez-vous annulé ;
  - sous le billet, tant que le rendez-vous est à venir, deux boutons côte à côte : « Ajouter à l'agenda » et « Annuler » (texte rouge `destructive`) ;
  - en bas, « Créé avec » et le logo MyWork.
  - Le compte à rebours s'affiche dès la confirmation, à la seconde *(constaté dans la maquette, au lieu de « quand il reste moins d'une heure » ci-dessus)*.

## Visio

Brique choisie le 2026-10-06 : **LiveKit** (voir [modules.md](modules.md), *Visio*). Le porteur du projet a demandé de l'intégrer dès ce module (2026-10-16), au lieu de l'étape 7.

### Fonctionnement

- **Une salle par rendez-vous**, créée à la première entrée, réservée à deux personnes : le propriétaire et l'invité.
- **Ouverture** : 15 minutes avant le début. **Fermeture** : 30 minutes après la fin prévue (donc une heure d'échange possible au plus) *(proposé)*. Hors de cette fenêtre, le serveur refuse de délivrer l'accès : même un lien partagé ou une page laissée ouverte ne consomme rien.
- Salle **vide pendant 5 minutes** : LiveKit la ferme ; elle se rouvre si quelqu'un revient dans la fenêtre *(proposé)*.
- Rendez-vous annulé : plus d'accès.

### Accès

- **Propriétaire** : « Rejoindre », depuis « Mes rendez-vous », connecté ; la salle s'ouvre à `/app/booking/<id>/meet`.
- **Invité** : « Rejoindre la visio », depuis la page du rendez-vous ; la salle s'ouvre à `/<identifiant>/booking/<code>/meet`. Son nom, celui saisi à la réservation.
- Avant d'entrer, un **écran de préparation** : aperçu de la caméra, choix du micro et de la caméra, caméra et micro activables ou non, puis « Entrer ». Le navigateur demande l'autorisation d'utiliser la caméra et le micro.

### Dans la salle

- Les composants React de LiveKit (`VideoConference`), habillés au design system : vidéos des deux participants, barre du bas avec **micro**, **caméra**, **partage d'écran**, **discussion écrite** et **« Quitter »** (en `destructive`).
- En haut : le nom de l'autre participant, l'heure de fin prévue ; 5 minutes avant la fermeture de la salle, un bandeau « La salle ferme dans 5 minutes ».
- En attendant l'autre : « Inès Robert va vous rejoindre » (ou « En attente de Marc Dubois »).
- Après « Quitter » : retour à la page du rendez-vous (invité) ou à « Mes rendez-vous » (propriétaire). On peut revenir tant que la salle est ouverte.
- Pas d'enregistrement, pas de flou d'arrière-plan au MVP.
- Fonctionne aussi sur mobile (navigateur), en mode portrait.

### Coût

- LiveKit Cloud, offre gratuite *Build* (environ 5 000 minutes par mois en 2026, à revérifier) : un rendez-vous d'une heure à deux consomme environ 120 minutes-participant, soit une quarantaine de rendez-vous par mois. Largement assez en usage personnel ; à revoir avec le SaaS (offre payante ou auto-hébergement, voir [modules.md](modules.md)).
- La règle des 15 minutes, la fermeture automatique et la salle vide fermée sont là pour tenir dans l'offre gratuite.
- Région des données : Union européenne (Francfort), choisie à la création du projet.

## E-mails (préparés, pas envoyés)

Pas de service d'envoi pour l'instant : Resend et le nom de domaine viendront plus tard (hors périmètre). Le module **prépare tout**, pour que le branchement se résume à une clé et un réglage :

- **Quatre modèles**, aux couleurs du design system (mêmes règles que les e-mails d'authentification, voir [auth.md](auth.md), *E-mails*), versionnés dans le dépôt et visibles dans la vitrine `/design` :

| E-mail | Pour | Objet | Contenu |
|---|---|---|---|
| Confirmation | Invité | « Rendez-vous confirmé avec Inès Robert » | Date, heure (fuseau de l'invité), « Visio · 30 min », bouton « Rejoindre la visio » (actif 15 min avant), lien d'annulation, `.ics` en pièce jointe |
| Nouvelle réservation | Propriétaire | « Nouveau rendez-vous : Marc Dubois, mar. 21 oct. à 10 h 30 » | Date, heure, nom, e-mail, fonction, entreprise, message, bouton « Voir dans MyWork », `.ics` |
| Annulation | L'autre partie | « Rendez-vous annulé : … » | Qui a annulé, le motif ou le message, « Réserver un autre créneau » (pour l'invité) |
| Annulation | Celui qui annule | Pas d'e-mail : la page le confirme *(proposé)* | — |

- **File d'envoi** : chaque e-mail est enregistré dans une table (`booking_emails`) avec son destinataire, son modèle, ses données et son état. Aujourd'hui, l'état reste **« non envoyé »** : un module d'envoi unique, dont la version actuelle **n'envoie rien** (elle écrit seulement une ligne dans les journaux). Avec Resend, on remplace ce module, puis on envoie (ou on abandonne) ce qui attend.
- Ce qui compense l'absence d'e-mails en attendant : la page de confirmation (lien et `.ics`) pour l'invité ; la liste « Mes rendez-vous » pour le propriétaire, avec un **point rouge** sur « Mes rendez-vous » dans la barre latérale tant qu'il y a des réservations non consultées *(proposé)*.
- **Rappels** (24 h et 1 h avant) : plus tard, avec Resend *(proposé)*.

## Protection contre les abus

- Le formulaire public est ouvert à tous : on limite les faux rendez-vous sans gêner les vrais *(proposé)* :
  - un champ piège invisible (« honeypot ») qui écarte les robots simples ;
  - **3 rendez-vous à venir au plus par adresse e-mail** chez un même propriétaire ;
  - **10 réservations par heure au plus** depuis une même adresse IP.
- L'e-mail n'est pas vérifié (pas d'envoi possible) : un faux rendez-vous peut passer. Le propriétaire l'annule ; c'est accepté au MVP. Avec Resend, l'e-mail de confirmation rendra la vérification possible ; un CAPTCHA (Cloudflare Turnstile) viendra avec le SaaS, si besoin.

## RGPD

- Les données des invités (nom, e-mail, fonction, entreprise, message) servent **uniquement** à ce rendez-vous ; la phrase sous le formulaire le dit.
- Elles sont supprimées avec le rendez-vous, et avec le compte du propriétaire.
- **Suppression automatique** des rendez-vous passés ou annulés **un an** après leur date *(proposé)*, par une tâche planifiée de la base.
- L'invité qui veut faire effacer ses données écrit au propriétaire, qui supprime le rendez-vous.

## Données

- **`booking_settings`** : une ligne par utilisateur (`user_id`) : réservations ouvertes (non par défaut), fuseau horaire, pause, préavis, horizon, limite par jour. Créée à la première visite de « Disponibilités ».
- **`booking_availability`** : les plages de la semaine, une ligne par plage : jour de la semaine, heure de début, heure de fin (heures locales du propriétaire).
- **`booking_overrides`** : les jours particuliers : date, et soit « indisponible », soit ses plages.
- **`bookings`** : les rendez-vous : propriétaire, début et fin (**en UTC**), nom, e-mail, fonction, entreprise, message de l'invité, fuseau de l'invité, code secret (enregistré sous forme d'empreinte, pas en clair), état (`confirmed`, `cancelled`), annulé par qui, motif, consulté par le propriétaire (oui ou non), dates de création et d'annulation.
- **`booking_emails`** : la file d'envoi (voir *E-mails*).
- Tout est rattaché au propriétaire et supprimé en cascade avec son compte.
- **RLS** : le propriétaire lit et modifie ses propres données. Les **visiteurs** n'ont aucun accès direct aux tables : ils passent par des **fonctions dédiées** de la base, ouvertes aux visiteurs anonymes :
  - lire les créneaux libres d'un profil en ligne aux réservations ouvertes, sans jamais voir qui a réservé ;
  - réserver (la fonction refait toutes les vérifications : créneau valide, libre, préavis, horizon, limites) ;
  - lire et annuler un rendez-vous à partir de son code.
- **Pas de double réservation** : une contrainte de la base interdit deux rendez-vous confirmés qui se chevauchent pour un même propriétaire (pause comprise). Si deux visiteurs valident le même créneau à la même seconde, un seul passe ; l'autre reçoit « Ce créneau vient d'être réservé ».
- La clé secrète Supabase n'est pas utilisée.

## Technique

Pour les agents qui développeront le module.

- Lire d'abord les guides Next.js 16 concernés dans `node_modules/next/dist/docs/01-app/` : routes dynamiques, formulaires et Server Actions, Route Handlers (pour le `.ics` et le jeton de visio), et les guides de cache (`cacheComponents` est activé). Pages publiques : mêmes règles de cache que l'onglet « Profil » (voir [public-profile.md](public-profile.md), *Technique*) ; les créneaux, eux, ne se mettent jamais en cache.
- **Dates et fuseaux** : tout est stocké en UTC ; les horaires du propriétaire sont des heures locales de son fuseau, converties jour par jour (changements d'heure). Bibliothèque *(proposé)* : `date-fns` avec `@date-fns/tz`. Le calcul des créneaux est une fonction pure de `src/lib/booking/`, couverte par des tests unitaires, et la même règle est vérifiée par la base à la réservation.
- **Visio** *(proposé)* : `livekit-server-sdk` côté serveur (fabrique un jeton d'accès de courte durée, seulement dans la fenêtre d'ouverture, pour la salle `booking-<id>`, 2 participants au plus, fermeture après 5 minutes vide), `livekit-client` et `@livekit/components-react` dans le navigateur. Clés LiveKit (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`) dans Vercel, jamais dans le navigateur ; `.env.example` mis à jour.
- **Compte LiveKit Cloud** : créé le 2026-10-16, offre gratuite. Projet **MyWork**, identifiant `p_55iutdslog4`, adresse `wss://mywork-2u2z4y18.livekit.cloud`, région de données **Union européenne (Francfort)** (impossible à changer ensuite), observabilité des agents désactivée (pas d'agents IA). Une clé d'accès existe déjà (*Settings › API keys*) ; ses trois valeurs sont rangées dans Vercel par le porteur du projet et récupérées dans `.env.local` (`vercel env pull`, 2026-10-16). Modèle dans `.env.example`.
- **E-mails** : modèles en HTML dans `src/lib/booking/emails/` (ou avec la bibliothèque de Resend, React Email, au moment du branchement), un module `send-email.ts` unique dont la version actuelle n'envoie rien. Le `.ics` est fabriqué à la main (format texte simple), sans bibliothèque *(proposé)*.
- **Tâche planifiée** (suppression au bout d'un an) : `pg_cron` dans Supabase *(proposé)*, plutôt qu'une tâche Vercel.
- Code du module : `src/app/app/booking/` (liste, disponibilités, salle du propriétaire), `src/app/[handle]/booking/` (onglet, page du rendez-vous, salle de l'invité), règles partagées dans `src/lib/booking/`. Lien « Mes rendez-vous » dans `src/app/app/_components/sidebar-nav.tsx` ; onglet et bouton « Prendre rendez-vous » dans `profile-header.tsx`.
- Reporter dans `docs/product.md`, *Inventaire technique* : LiveKit Cloud, les bibliothèques retenues, la tâche planifiée.

## Tests

- Bout en bout :
  - régler ses horaires, une exception, les réglages ; ouvrir les réservations : l'onglet et le bouton « Prendre rendez-vous » apparaissent ; fermées ou profil hors ligne : ils disparaissent, l'adresse est introuvable ;
  - réserver en visiteur non connecté : jours marqués, créneaux, formulaire (champs obligatoires, e-mail invalide refusé), page de confirmation avec lien et `.ics` ; le rendez-vous apparaît dans « Mes rendez-vous » avec le point rouge ;
  - le créneau réservé disparaît, pause comprise ; deux réservations simultanées du même créneau : une seule passe ;
  - préavis, horizon, limite par jour, jour indisponible respectés ;
  - fuseau : un visiteur à New York voit les créneaux à son heure ;
  - annulation par le propriétaire et par l'invité : créneau libéré, page du rendez-vous « annulé », e-mail préparé dans la file avec l'état « non envoyé » ;
  - visio : avant l'ouverture, « Revenez plus tard » et aucun jeton délivré ; dans la fenêtre, jeton délivré et salle ouverte (heure simulée) ; après, refus ; rendez-vous annulé, refus ;
  - sécurité : un visiteur ne voit jamais les données d'un autre rendez-vous, un code faux mène à la page introuvable, un utilisateur ne voit pas les rendez-vous d'un autre ; limites anti-abus ;
  - la suppression du compte efface tout.
- Unitaires : calcul des créneaux (grille, pause, créneau qui suit une pause, préavis, horizon, limite, exceptions, changement d'heure de mars et d'octobre), formats des dates et heures, fabrication du `.ics`, rendu des modèles d'e-mails.
- Aucun test ne se connecte à une vraie salle LiveKit : l'accès est vérifié au niveau du jeton.

## Mise en œuvre

1. Maquettes : validées (voir *Maquettes*).
2. Base de données : tables, contraintes, fonctions publiques, tâche planifiée.
3. « Disponibilités », puis le calcul des créneaux et ses tests.
4. Onglet public, réservation, page du rendez-vous, `.ics`.
5. « Mes rendez-vous », annulation, point rouge.
6. E-mails préparés et file d'envoi.
7. Visio (après création du compte LiveKit par le porteur du projet).
8. Tests ; vérification en clair et en sombre, et sur mobile.

Tout est fait (2026-10-16) : migration `supabase/migrations/20261016120000_add_booking_module.sql` appliquée à la base en ligne, 24 tests unitaires (`src/lib/booking/*.test.ts`), 9 parcours de bout en bout (`e2e/booking.spec.ts`).

## Précisé pendant le développement

Choix faits en cours de route, **à valider** par le porteur du projet (marqués ◆), et précisions techniques.

**Où est le code**

- Règles, calcul des créneaux, dates, `.ics`, e-mails : `src/lib/booking/` (`slots.ts` est la fonction pure ; `rules.ts` les valeurs ; `emails/templates.ts` les quatre modèles ; `emails/send-email.ts` le module d'envoi qui n'envoie rien ; `meeting.ts` le jeton LiveKit).
- Espace privé : `src/app/app/booking/` (`(pages)/` pour la liste et « Disponibilités », `[id]/meet/` pour la salle du propriétaire et son jeton). Public : `src/app/[handle]/booking/` (onglet, `[code]/` page de l'invité, `[code]/ics`, `[code]/meet/` et son jeton). La salle elle-même : `src/components/meeting/`.
- Vitrine `/design` : les vrais composants (semainier, billet, liste) et les quatre e-mails, avec des données fictives.

**Données**

- ◆ **Code du lien gardé en clair**, pas en empreinte : le propriétaire doit pouvoir « Copier le lien de l'invité » tant que les e-mails ne partent pas, ce qu'une empreinte empêche. Seuls le propriétaire (RLS) et le détenteur du code atteignent la ligne ; le code fait 24 caractères tirés au hasard (144 bits).
- Le lien contient le code seul ; la **référence courte** (« K7QM-2XR9 ») est tirée au hasard à part.
- Les horaires sont rangés en **minutes depuis minuit** (9 h = 540) ; un jour particulier garde ses plages dans une liste (vide = indisponible).
- Chaque rendez-vous garde la fin de sa pause (`blocked_until`), avec la pause réglée au moment de la réservation : c'est elle que vérifie la contrainte anti-chevauchement (extension `btree_gist`). Changer la pause ensuite ne touche pas les rendez-vous déjà pris.
- Les réservations d'un même propriétaire passent **une à la fois** (verrou dans la base) : la limite par jour tient même si deux visiteurs valident ensemble.
- La limite de 10 réservations par heure repose sur une **empreinte** de l'adresse IP (jamais l'adresse elle-même), effacée au bout d'un jour. Un robot qui appellerait directement la base, sans passer par l'application, pourrait la contourner ; la limite par e-mail et l'annulation par le propriétaire restent. Accepté au MVP.
- Tâches planifiées (`pg_cron`, chaque nuit vers 3 h UTC) : suppression des rendez-vous un an après leur date, et des empreintes IP de plus d'un jour.
- Tout se supprime avec le compte (vérifié par un test).

**Interface**

- ◆ « À venir » garde un rendez-vous jusqu'à la **fermeture de la salle** (30 minutes après la fin), pour que « Rejoindre » reste à portée ; il passe ensuite dans « Passés ».
- ◆ Le **point rouge** d'un rendez-vous disparaît quand on ouvre son détail ; celui de la barre latérale, quand tous les rendez-vous à venir ont été ouverts.
- ◆ L'invité peut annuler **jusqu'au début** du rendez-vous ; le propriétaire, jusqu'à la fin.
- ◆ Compte à rebours au-delà d'un jour : « 3 j 14:42:10 » (la maquette ne montrait que les heures).
- ◆ Sous le billet, tant que le rendez-vous est à venir, le cadre « Lien du rendez-vous » de la confirmation reste affiché : la page de confirmation et celle du lien ne font qu'une.
- ◆ « Réserver un autre créneau » n'apparaît que si les réservations sont ouvertes (sinon, l'adresse mènerait à une page introuvable).
- Dans le semainier, une colonne vide dit « Fermé » si le jour n'a pas d'horaires dans la semaine, « Indisponible » sinon (jour particulier, ou plus de créneau).
- « Disponibilités » : à la première visite, le fuseau du navigateur est proposé (à enregistrer). L'interrupteur « Réservations ouvertes » s'enregistre avec le reste de la page, par « Enregistrer ».
- « Ajouter une date » : un calendrier du mois (un an au plus), plusieurs jours d'un coup ; les jours qui se suivent avec les mêmes horaires s'affichent sur une ligne (« 2 – 6 novembre »).
- Heures écrites « 10:30 », comme dans les maquettes (et non « 10 h 30 »).

**Visio**

- La salle est faite avec les briques de LiveKit (`LiveKitRoom`, `useTracks`, `useTrackToggle`, `useChat`, `VideoTrack`) assemblées à la main selon la maquette, plutôt qu'avec `VideoConference` tout fait, difficile à habiller.
- Le jeton est délivré par une adresse du serveur (`…/meet/token`), seulement dans la fenêtre ; il porte la configuration de la salle (2 personnes, fermée 5 minutes après le départ du dernier) et vaut jusqu'à sa fermeture. Arrivée l'heure de fermeture, la page quitte la salle d'elle-même.
- En haut de la salle, à la demande du porteur du projet (2026-10-17) : un retour vers la plateforme (« Mes rendez-vous » pour le propriétaire, « Mon rendez-vous » pour l'invité), qui quitte la salle (on peut y revenir tant qu'elle est ouverte), et « Copier le lien de l'invité » (« Copier le lien » côté invité).
- ◆ Le minuteur du haut compte le temps passé dans la salle depuis son entrée. La discussion écrite n'est pas conservée après la visio.
- Sur mobile, le partage d'écran est masqué (les navigateurs mobiles ne le permettent pas).
- La présence de l'autre participant n'est pas affichée sur l'écran de préparation (il faudrait se connecter à la salle pour la connaître) : « Vous pouvez entrer et attendre … dans la salle ».

**Repéré en passant (hors module)**

- Un lien habillé en bouton à bordure (`buttonVariants({ variant: "outline" })` sans `cn`) perd sa bordure : c'est le cas de « Télécharger le CV » dans l'en-tête du profil public. Corrigé pour les écrans du module, pas ailleurs.

## Décisions validées

Choix pris le 2026-10-16 sans le porteur du projet, à sa demande, puis validés par lui le même jour, sans changement :

1. **Noms** : « Mes rendez-vous » dans la barre latérale, `/app/booking` et `/<identifiant>/booking` dans les adresses.
2. **Un seul type de rendez-vous**, en visio, de **30 minutes** : les « types de rendez-vous » prévus au MVP dans [modules.md](modules.md) sont retirés.
3. **Pause de 15 minutes** après chaque rendez-vous par défaut (réglable : aucune, 15, 30), et le créneau suivant qui démarre dès la fin de la pause, hors de la grille de 30 minutes.
4. **Réglages à la Calendly**, prévus « plus tard » dans [modules.md](modules.md) et avancés au MVP : préavis de 4 heures, réservable 2 mois à l'avance, limite par jour (aucune par défaut). Préavis et horizon réglables dès le MVP, à la demande du porteur du projet.
5. **Horaires par défaut** : lundi au vendredi, 9 h – 12 h et 14 h – 18 h, heure de Paris.
6. **Réservations fermées par défaut**, avec un interrupteur dans « Disponibilités ».
7. **Formulaire** : nom ajouté (obligatoire), et entreprise (facultatif), en plus de l'e-mail, de la fonction et du message demandés.
8. **Lien secret** par rendez-vous pour l'invité, sans compte : rejoindre, ajouter à l'agenda, annuler. Pas de replanification au MVP.
9. **Visio** : salle ouverte de 15 minutes avant à 30 minutes après la fin prévue, fermée après 5 minutes vide ; écran de préparation ; micro, caméra, partage d'écran, discussion écrite ; pas d'enregistrement.
10. **E-mails** : quatre modèles et une file d'envoi qui n'envoie rien ; pas d'e-mail à celui qui annule ; rappels plus tard. En attendant : lien et `.ics` sur la page de confirmation, point rouge dans la barre latérale.
11. **Anti-abus** : champ piège, 3 rendez-vous à venir par e-mail, 10 réservations par heure et par adresse IP ; pas de CAPTCHA au MVP.
12. **RGPD** : rendez-vous passés ou annulés supprimés automatiquement au bout d'un an.
13. **Bibliothèques** : `date-fns` et `@date-fns/tz` ; `livekit-server-sdk`, `livekit-client`, `@livekit/components-react` ; `.ics` sans bibliothèque ; `pg_cron`.

## Hors périmètre (plus tard)

- Envoi réel des e-mails (Resend), nom de domaine, rappels avant le rendez-vous.
- Plusieurs types de rendez-vous, autres durées, rendez-vous en personne ou par téléphone.
- Replanification par l'invité ou par le propriétaire.
- Synchronisation avec un agenda externe : écartée (décision du 2026-10-06).
- Enregistrement de la visio, flou d'arrière-plan, plus de deux participants.
- Questions personnalisées, paiement à la réservation.
- Lien avec les autres modules : un rendez-vous qui crée une carte dans un tableau (voir [modules.md](modules.md), *Liens entre modules*).
- Résumé des prochains rendez-vous dans le tableau de bord.
- CAPTCHA, si les faux rendez-vous deviennent un problème.
