# Modules : spécifications fonctionnelles

Chaque module suit le même schéma : un espace **privé** (gestion) et une partie **publique** optionnelle, exposée sur le profil.
**MVP** désigne ce qui est construit à l'étape correspondante de la roadmap (voir [product.md](product.md), section *Roadmap*). **Plus tard** regroupe des idées retenues mais hors périmètre.

## Socle : compte et profil public

- **Authentification** : connexion obligatoire pour accéder à l'application, par Google ou par e-mail et mot de passe (e-mail confirmé), « Rester connecté », mot de passe oublié. En usage personnel, un seul compte suffit. Détail dans [auth.md](auth.md).
- **Profil public** : page accessible via une URL unique (`<domaine>/<identifiant>`), qui regroupe les blocs publics des modules activés, un onglet par module. Hors ligne par défaut, mis en ligne depuis le menu du profil. Squelette (adresses, identifiant, mise en ligne, mise en page, menu du profil) détaillé dans [public-profile.md](public-profile.md).
- **Paramètres** : grande fenêtre ouverte depuis le menu du profil, une section par sujet. Section Profil : prénom, nom, adresse du profil public (l'identifiant), suppression du compte. Détail dans [settings.md](settings.md).
  - *Plus tard* : changement d'e-mail et de mot de passe, abonnement, modules activés, modules visibles sur le profil.
- *Plus tard* : domaine personnalisé, thèmes, statistiques de visites.

## Profil (type LinkedIn)

Anciennement « module CV », renommé le 2026-10-13.

**Objectif** : présenter son parcours de façon professionnelle et complète, et le partager, par URL ou par export (le CV).

Dans l'espace privé, le module Profil est la page **« Mon profil »** (`/app/profile`), où l'on remplit son profil. Sur le profil public, c'est l'onglet **« Profil »** (`/<identifiant>`), le premier que voit un visiteur. Le **tableau de bord** (`/app`, l'accueil) en résumera l'activité. Spécification détaillée : [profile.md](profile.md).

MVP
- Saisie simple et agréable : en-tête (photo, nom, titre, localisation), coordonnées et liens, présentation, offre freelance (disponibilité, prestations, mode de travail, TJM ; masquable par un interrupteur), expériences, formations, certifications, projets, compétences, langues, recommandations (saisies par le propriétaire).
- Tout est facultatif : ce qui est rempli est public, ce qui est vide n'apparaît pas.
- Réorganisation des sections et des éléments (expériences, formations et certifications rangées par date).
- Contenu en français.
- Vue publique façon profil LinkedIn, dans l'onglet « Profil » du profil public.
- Export du CV en **PDF** et en **image (PNG)**.

Plus tard
- **Multilingue** : contenu saisi en plusieurs langues (au moins FR et EN), avec choix de la langue sur le profil public et à l'export. Prévu au MVP, repoussé le 2026-10-13.
- Recommandations demandées par lien au client, qui écrit la sienne.
- Plusieurs modèles de mise en page pour l'export.
- Import (export LinkedIn, format JSON Resume).
- Variantes ciblées du profil et du CV (par mission, par type de poste).

Points d'attention
- L'export doit être fidèle à l'aperçu : le générer à partir du même rendu HTML.
- Métadonnées SEO / Open Graph, pour un bel aperçu quand le lien est partagé.

## Rendez-vous (type Calendly)

**Objectif** : permettre aux clients de réserver un créneau depuis le profil public.

MVP
- Privé : disponibilités hebdomadaires (plages horaires par jour), exceptions (congés, jours bloqués), types de rendez-vous (nom, durée, description), liste des rendez-vous à venir.
- Public : affichage des créneaux libres, réservation (nom, e-mail, message).
- E-mail de confirmation aux deux parties, avec invitation calendrier (`.ics`) et lien d'annulation.

Plus tard
- Temps tampon entre deux rendez-vous, délai minimum de réservation, limite par jour, rappels.
- Replanification par le client.
- Lien de visio automatique (voir module Visio).

Hors périmètre
- Synchronisation avec des agendas externes (Google Calendar, Outlook…). Pour éviter un conflit avec un autre engagement, on bloque le créneau à la main (exceptions).

Points d'attention
- **Fuseaux horaires** : stocker en UTC, afficher dans le fuseau du visiteur.
- Concurrence : empêcher deux réservations sur le même créneau.

## Tableaux (type Trello)

**Objectif** : organiser ses tâches dans des tableaux kanban. Module **uniquement privé** : pas de partie publique (décision du 2026-10-14). Spécification détaillée : [boards.md](boards.md).

MVP (revu le 2026-10-14)
- Plusieurs tableaux dans « Mes tableaux » (`/app/boards`), choisis par une liste déroulante sur le nom du tableau. 5 listes par tableau, 20 cartes par liste.
- Cartes ajoutées d'un trait dans la liste ; leur fenêtre : description en Markdown léger (Entrée enregistre, Maj+Entrée va à la ligne), checklist visible sur la carte, images.
- Glisser-déposer des cartes et des listes.

Plus tard
- Étiquettes, échéances (prévues au MVP, repoussées le 2026-10-14), archivage, historique, recherche et filtres.
- Pièces jointes reliées au Drive.

Écarté (2026-10-14) : tableaux publics ouverts aux visiteurs, commentaires, collaboration à plusieurs.

## Drive (type Google Drive)

**Objectif** : stocker et organiser ses fichiers, et en partager certains publiquement.

MVP
- Dossiers et sous-dossiers. Envoi, renommage, déplacement, suppression (avec corbeille), téléchargement.
- Aperçu des images et des PDF.
- Visibilité par fichier ou dossier, privée ou publique (lien de partage et/ou affichage sur le profil).
- Quota de stockage par utilisateur.

Plus tard
- Recherche, liens de partage avec expiration, historique des versions.

Points d'attention
- Utiliser un stockage objet (type S3) plutôt que le disque du serveur. Les téléchargements passent par des URL signées.
- En SaaS, l'hébergement public de fichiers attire les abus : limites de taille et de type, signalement, possibilité de retrait.

## Abonnement et paiement

**Objectif** : monétiser l'ouverture en SaaS.

- Un seul abonnement mensuel peu cher, qui inclut un quota de stockage.
- L'utilisateur gère lui-même son abonnement : moyen de paiement, factures, résiliation.
- Prestataire : **Stripe** (Checkout pour le paiement, portail client pour la gestion de l'abonnement).

## Visio (type Zoom)

**Objectif** : tenir directement dans l'application le rendez-vous réservé.

- Une salle de visio associée à chaque rendez-vous, ouverte aux deux participants à l'heure prévue.
- Brique retenue : **[LiveKit](https://livekit.io)**, open source (Apache 2.0). Elle fournit des composants React prêts à l'emploi.
  - Démarrage : LiveKit Cloud, offre *Build* gratuite et permanente (environ 5 000 minutes WebRTC par mois en 2026).
  - Montée en charge (SaaS) : offre payante ou auto-hébergement sur nos serveurs (gratuit hors coût d'infrastructure, hébergement UE possible).
  - Tarifs à revérifier au moment de l'étape 7.

## Liens entre modules (plus tard)

Tout centraliser n'a d'intérêt que si les modules communiquent. Quelques exemples : un rendez-vous réservé crée une carte dans un tableau, une carte reçoit des fichiers du Drive en pièces jointes, un projet du profil renvoie vers des fichiers publics.
