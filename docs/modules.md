# Modules : spécifications fonctionnelles

Chaque module suit le même schéma : un espace **privé** (gestion) et une partie **publique** optionnelle, exposée sur le profil.
**MVP** désigne ce qui est construit à l'étape correspondante de la roadmap (voir [product.md](product.md), section *Roadmap*). **Plus tard** regroupe des idées retenues mais hors périmètre.

## Socle : compte et profil public

- **Authentification** : connexion obligatoire pour accéder à l'application, par Google ou par e-mail et mot de passe (e-mail confirmé), « Rester connecté », mot de passe oublié. En usage personnel, un seul compte suffit. Détail dans [auth.md](auth.md).
- **Profil public** : page accessible via une URL unique, qui regroupe les blocs publics des modules activés. Son squelette est détaillé ci-dessous.
- **Paramètres** : modification de l'identifiant (donc de l'URL), modules activés, modules visibles sur le profil.
- *Plus tard* : domaine personnalisé, thèmes, statistiques de visites.

### Profil public : le squelette

Statut : **spécifié, maquettes validées** (2026-10-12), à développer. Le squelette prépare la partie publique de tous les modules : l'adresse, la mise en page, l'accès sans connexion, la mise en ligne. Le contenu arrivera avec les modules.

Maquettes : [Maquettes profil public](https://claude.ai/artifact/XmfpRWfmpH1FqnzEgksuEc) sur claude.ai, direction **« Onglets »**. Trois planches : `Page publique — ordinateur`, `Page publique — mobile` (réglages *thème*, *état* : en ligne, hors ligne ou introuvable, et *contenu* : squelette ou avec modules) et `Espace privé — menu du profil` (interactive). Inès Robert est un personnage fictif ; les cadres en pointillés marquent l'emplacement des futurs modules.

**Adresses**

| Adresse | Rôle |
|---|---|
| `/<identifiant>` | Profil public, accessible sans connexion |
| `/<identifiant>/…` | Pages publiques d'un module, s'il en a besoin (réservation, board, dossier partagé…) |
| `/app/…` | Espace privé, connexion obligatoire. La page de profil privée `/profile` devient `/app/profile`. |
| `/login`, `/signup`… | Authentification, inchangée |
| `/` | La landing page, plus tard. D'ici là, elle renvoie vers l'espace privé (ou vers la connexion). |

- L'adresse suffit à savoir où l'on est : `/app` est privé, le reste est public.
- Plus tard, un sous-domaine (`<identifiant>.<domaine>`) ou un domaine personnel pourra renvoyer vers ces mêmes pages, sans les refaire.
- Noms des sous-pages des modules (en anglais comme les autres routes, ou en français pour les visiteurs) : question ouverte, voir [product.md](product.md).

**Identifiant public**

- Généré à la création du compte : à partir du nom Google, au format `prenom-nom` (« Inès Robert » → `ines-robert`), sinon à partir du début de l'adresse e-mail (`ines.robert@exemple.fr` → `ines-robert`).
- Format : lettres minuscules sans accents, chiffres et tirets, de 3 à 30 caractères. Unique.
- S'il est déjà pris ou réservé, on ajoute `-2`, `-3`… (`ines-robert-2`).
- Mots réservés : les adresses de l'application (`app`, `login`, `auth`, `design`…) et quelques noms génériques (`admin`, `api`, `help`, `settings`…).
- Les comptes existants reçoivent le leur lors de la mise en place.
- Modifiable plus tard, dans les Paramètres.

**En ligne ou hors ligne**

- Un interrupteur, dans le sous-menu **Mon profil public** du menu du profil (voir *Menu du profil*) : « Profil en ligne » ou « Profil hors ligne ». **Hors ligne par défaut**, pour qu'aucun profil vide ou inachevé ne soit visible.
- Hors ligne, les visiteurs tombent sur une page introuvable (404), exactement comme pour un identifiant qui n'existe pas : rien ne révèle que le compte existe.
- Hors ligne, le propriétaire connecté voit quand même sa page, avec en haut une bande à l'encre (fond `foreground`, texte `background`) : une icône d'œil barré, « Hors ligne », puis « Vous seul voyez cette page. ». Il peut ainsi préparer son profil avant de le publier.
- En ligne, la vue est stricte : identique pour tous, propriétaire compris, sans bandeau.
- L'interrupteur s'ajoute à la visibilité de chaque élément (privé ou public, voir [product.md](product.md), *Principes transverses*) : un élément public n'est visible que si le profil est en ligne.

**Menu du profil** (voir et partager son profil)

- La barre latérale n'affiche rien de plus : ni adresse, ni état. Tout passe par le menu, ouvert par le bloc du profil en bas de la barre latérale.
- Menu, une ligne par entrée, sans valeur affichée, une flèche à droite des entrées qui ouvrent un sous-menu :
  - l'adresse e-mail, en petit ;
  - **Mon profil public ›** ;
  - **Thème ›** ;
  - **Se déconnecter**.
- Les sous-menus s'ouvrent à droite, au survol ou au clic. Textes alignés à gauche, icônes à droite.
  - **Mon profil public** :
    - l'interrupteur, sur une ligne : « Profil en ligne » ou « Profil hors ligne » selon l'état ; un clic n'importe où sur la ligne le bascule ;
    - **Copier l'adresse** (icône copier) : copie l'adresse du profil public ; la ligne affiche un instant « Adresse copiée » avec une coche ;
    - **Ouvrir mon profil public** (icône « nouvel onglet ») : ouvre le profil dans un nouvel onglet.
  - **Thème** : Clair, Sombre, Système. Une coche juste après le libellé du choix actif ; l'icône (soleil, lune, écran) à droite.
- L'interrupteur, redessiné pour être lisible : désactivé, fond gris pâle et rond gris à gauche ; activé, fond rouge (`primary`) et rond blanc à droite. Il remplace le `Switch` actuel du design system (voir [design-system.md](design-system.md)).
- Un nouvel onglet suffit pour voir son profil comme un visiteur (voir *Points d'attention*) : pas besoin de navigation privée. Pour revenir à l'espace privé, on ferme l'onglet.

**Mise en page publique** (direction « Onglets »)

- Distincte de l'espace privé : ni barre latérale, ni menu du profil. Pensée d'abord pour le mobile, dans le thème du visiteur (clair ou sombre). Contenu dans une colonne de 1080 px au plus.
- **En-tête**, avec la lumière de studio et un filet en bas :
  - une photo carrée, une étiquette (le titre professionnel) et le nom en grand (Newsreader, 72 px sur ordinateur, 40 px sur mobile) ;
  - à droite (dessous sur mobile), le bouton rouge de l'action principale, par exemple « Prendre rendez-vous » ;
  - des **onglets** : « Profil », puis un onglet par module public (CV, Rendez-vous, Board, Fichiers). Onglet actif : texte à l'encre et trait rouge dessous. Sur mobile, les onglets défilent horizontalement.
- Chaque onglet est une page, avec sa propre adresse : `/<identifiant>` pour « Profil », `/<identifiant>/<module>` pour les autres.
- **Pied de page**, sous un filet : « Créé avec » et le logo MyWork.
- **Pour l'instant (squelette)** : l'en-tête montre seulement l'étiquette « Espace public » et le titre « Page de profil », sans photo, bouton ni onglets ; dessous, « Contenu à venir. ». Photo, nom, bouton et onglets arriveront avec les modules.
- **Page introuvable (404)** : même gabarit, étiquette « Erreur 404 », titre « Page introuvable », puis « Cette adresse ne correspond à aucun profil public. Vérifiez le lien, ou demandez-le à la personne qui vous l'a envoyé. »
- Titre de l'onglet et aperçu au partage du lien (Open Graph) provisoires, enrichis avec le CV.
- Pas de référencement par les moteurs de recherche (`noindex`) tant que la page est vide.

**Ce que le squelette fournit aux modules**

- Un onglet et une sous-page `/<identifiant>/<module>` par module public, avec la même mise en page et les mêmes règles (404 hors ligne, aperçu du propriétaire).
- L'onglet « Profil » (`/<identifiant>`), page d'accueil du profil, où chaque module pourra ajouter un aperçu de son contenu.

Points d'attention
- **La page publique ignore la connexion** : elle lit toujours les données comme un visiteur anonyme, même quand le propriétaire est connecté. Ce que voit le propriétaire est donc exactement ce que voient ses visiteurs. Et la page ne peut pas afficher une donnée privée par erreur, car la base la refuserait. Seule exception, l'aperçu hors ligne : il reconnaît le propriétaire pour lui ouvrir la page, et montre le même contenu que verront les visiteurs une fois le profil en ligne.
- La lecture publique passe par un accès dédié, ouvert aux visiteurs anonymes, qui n'expose que le strict nécessaire (l'identifiant, puis les blocs publics), jamais l'adresse e-mail.
- Identiques pour tous, les pages publiques peuvent être mises en cache : elles restent rapides, y compris sur mobile.
- Tests de bout en bout : un visiteur voit un profil en ligne ; 404 pour un identifiant inconnu et pour un profil hors ligne ; aperçu avec bandeau pour le propriétaire hors ligne ; le sous-menu « Mon profil public » (interrupteur, copier l'adresse, ouvrir) ; le sous-menu « Thème » ; l'espace privé reste fermé aux visiteurs. Tests unitaires pour la génération de l'identifiant (accents, doublons, mots réservés).

Mise en œuvre (ordre proposé)
1. Maquettes : fait, validées le 2026-10-12.
2. Déplacement de l'espace privé sous `/app`, et règles d'accès.
3. Base de données : identifiant et état en ligne dans `profiles`, génération de l'identifiant (comptes existants compris), accès public dédié.
4. Page publique et sa mise en page, 404, aperçu hors ligne.
5. Menu du profil : sous-menus « Mon profil public » et « Thème ». Nouvel interrupteur dans le composant `Switch`, puis vitrine `/design` et copie claude.ai du design system mises à jour.
6. Tests ; vérification en clair et en sombre, et sur mobile.

Plus tard
- Redirection depuis l'ancien identifiant quand on en change, pour ne pas casser les liens déjà partagés.
- Référencement par les moteurs de recherche, avec le contenu et le nom de domaine.

## CV (type LinkedIn)

**Objectif** : renseigner son parcours facilement et le partager, par URL ou par export.

MVP
- Saisie simple et agréable : identité, titre, résumé, photo, coordonnées, expériences, formations, compétences, langues, projets, liens.
- Réorganisation des sections et des éléments.
- **Multilingue** : contenu saisi en plusieurs langues (au moins FR et EN), avec choix de la langue sur le profil public et à l'export.
- Vue publique façon profil LinkedIn sur le profil.
- Export **PDF** et **image (PNG)**.

Plus tard
- Plusieurs modèles de mise en page pour l'export.
- Import (export LinkedIn, format JSON Resume).
- Variantes de CV ciblées (par mission, par type de poste).

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

## Boards (type Trello)

**Objectif** : organiser ses tâches dans des tableaux kanban.

MVP
- Plusieurs boards, avec des colonnes et des cartes (titre, description, étiquettes, échéance, checklist).
- Glisser-déposer des cartes et des colonnes.
- Visibilité par board, privée ou publique. Un board public se consulte en lecture seule depuis le profil (roadmap publique, suivi de projets…).

Plus tard
- Commentaires, pièces jointes (reliées au Drive), archivage, recherche et filtres.
- Collaboration à plusieurs sur un même board.

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

Tout centraliser n'a d'intérêt que si les modules communiquent. Quelques exemples : un rendez-vous réservé crée une carte dans un board, une carte reçoit des fichiers du Drive en pièces jointes, un projet du CV renvoie vers des fichiers publics.
