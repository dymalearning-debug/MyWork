# Module Profil

Spécification du module Profil (anciennement « module CV »), étape 2 de la roadmap (voir [product.md](product.md), *Roadmap*).
Statut : **développé** le 2026-10-13 (contenu et maquettes validés le même jour). Vitrine `/design` et copie claude.ai du design system mises à jour le 2026-10-14. Reste : vérifier l'export du CV une fois déployé sur Vercel.

## En bref

- Le profil professionnel de l'utilisateur, façon LinkedIn : qui il est, ce qu'il propose, son parcours, ses réalisations. C'est la première chose que voit un recruteur, un client ou un partenaire.
- Il se remplit dans l'espace privé, page **« Mon profil »** (`/app/profile`), et s'affiche dans l'onglet **« Profil »** de la page publique (`/<identifiant>`), le premier onglet. Il n'y a pas d'onglet « CV » à part.
- **Ce qui est rempli est public, ce qui est vide n'apparaît pas.** Il n'y a pas de réglage de visibilité champ par champ : pour ne pas montrer une information, on ne la remplit pas. Le tout reste soumis à l'interrupteur « Profil en ligne » (voir [public-profile.md](public-profile.md)).
- Pour les utilisateurs qui ne sont pas freelances, un interrupteur masque l'**offre freelance** (disponibilité, prestations, mode de travail, TJM).
- Contenu en **français** seulement, pour l'instant.
- **Export du CV** en PDF et en PNG, depuis la même mise en page que son aperçu.
- Rubriques inspirées d'un profil LinkedIn, et de Malt pour l'offre freelance.

## Maquettes

Validées le 2026-10-13 : [Maquettes module Profil](https://claude.ai/artifact/3zqQNUgNHsyofrPAqpxfoN) sur claude.ai, chaque planche en clair et en sombre (réglage « thème »). Personnage fictif : Inès Robert.

| Écran | Planche retenue | Écartées |
|---|---|---|
| « Mon profil » (remplissage) | **B · Formulaire** | A · Sur place (page façon LinkedIn, une fenêtre par modification) ; C · Atelier (formulaire en accordéon et aperçu en direct) |
| Onglet « Profil » de la page publique (affichage) | **1 · Classique**, réglage « contact » pour le panneau « Me contacter » | 2 · Fiche (une colonne façon fiche technique) ; 3 · Vitrine (projets et prestations d'abord) |

Retenues telles quelles. Dessinées pendant le développement : la page publique sur mobile et le CV exporté (voir *Précisé pendant le développement*).

## Contenu

Règles communes :
- Textes simples : les retours à la ligne sont conservés, sans autre mise en forme (gras, listes : plus tard). Les espaces autour sont retirés.
- Dates : année obligatoire, mois facultatif (« mars 2022 » ou « 2022 »).
- Liens : `http` ou `https` seulement ; `https://` est ajouté s'il manque.
- Champs facultatifs, sauf ceux marqués d'un astérisque (\*) : sans eux, l'élément n'a pas de sens.
- Le nombre d'éléments est plafonné par section, comme garde-fou pour le SaaS (chiffres ci-dessous, à ajuster).

### En-tête

Le haut de la page publique (voir [public-profile.md](public-profile.md), *Page publique*).

- **Photo** :
  - JPG, PNG ou WebP, 5 Mo au plus, recadrée en carré à l'envoi (zoom et déplacement) ;
  - par défaut, la photo du compte Google, que l'on peut remplacer ou retirer. Sans photo, les initiales du prénom et du nom, sur un carré à l'encre ;
  - elle sert aussi d'avatar dans la barre latérale.
- **Prénom et nom** : les mêmes que dans les Paramètres, modifiables aux deux endroits (voir [settings.md](settings.md)). Sans prénom ni nom, l'en-tête affiche l'identifiant.
- **Titre professionnel** : 100 caractères. Par exemple « Product designer freelance · Design systems ».
- **Localisation** : texte libre, 100 caractères (« Lyon, France »).
- **Disponibilité** : saisie dans l'offre freelance (voir plus bas), affichée dans l'en-tête.
- Trois boutons, qui ne sont pas des champs :
  - **Me contacter**, le bouton rouge, s'il y a un e-mail ou un téléphone de contact : il ouvre le panneau des coordonnées. Avec le module Rendez-vous, le bouton rouge deviendra « Prendre rendez-vous » et « Me contacter » passera en second ;
  - **Télécharger le CV** (contour) : le PDF (voir *Export du CV*) ;
  - **Partager** (icône) : sur mobile, le menu de partage du téléphone ; sur ordinateur, il copie l'adresse du profil.

### Coordonnées

- **E-mail de contact** : distinct de l'adresse de connexion. Il est pré-rempli avec elle, mais on peut le modifier ou l'effacer.
- **Téléphone** : public s'il est rempli. Format libre (`+33 6 12 34 56 78`) : chiffres, espaces, `+`, points, tirets et parenthèses, 6 à 20 caractères.
- **Panneau « Me contacter »** : l'e-mail et le téléphone n'apparaissent qu'au clic, pour que les robots qui ramassent les adresses ne les trouvent pas dans la page. Chacun a deux boutons : « Copier », et « Écrire » ou « Appeler ».
- **Liens** : 10 au plus, dans l'ordre choisi, chacun avec une adresse\* et un libellé. L'icône est reconnue d'après l'adresse (LinkedIn, GitHub, Malt, X, Instagram, Behance, Dribbble, YouTube…), sinon c'est un globe. Sans libellé, on affiche le nom du site.

### À propos

- **Présentation** : 2 600 caractères, comme sur LinkedIn.
- **Compétences phares** : 5 au plus, choisies dans la liste des compétences (une étoile), affichées sous la présentation.

### Offre freelance

- Interrupteur **« Je propose mes services en freelance »**, en tête de la section, **activé par défaut**, puisque MyWork s'adresse d'abord aux freelances. Désactivé, la section se replie dans le formulaire, et rien n'en apparaît sur la page publique ni dans l'export. Les données sont gardées, pour le jour où on le réactive.
- **Disponibilité** : « Non précisée » (par défaut, rien d'affiché), « Disponible », « Disponible à partir du » une date, ou « Indisponible ». Une fois la date passée, on affiche « Disponible ».
- **Prestations** : 10 au plus, dans l'ordre choisi. Un nom\* (80 caractères) et une description (500), par exemple « Audit UX » ou « Création de design system ».
- **Mode de travail** : à distance, sur site, hybride (plusieurs choix possibles), et une zone de déplacement (100 caractères, « Lyon et environs, Paris ponctuellement »).
- **TJM** : un montant entier en euros, affiché « 550 € HT / jour » s'il est rempli.

### Expériences

50 au plus.
- Poste\*, entreprise ou client, lieu (100 caractères chacun). Pour un client confidentiel, un nom générique suffit (« Grand groupe bancaire »).
- Type : Freelance, CDI, CDD, Stage, Alternance, Intérim.
- Mode : sur site, hybride, à distance.
- Début\*, puis fin ou « Poste actuel ».
- Description (2 000 caractères) et compétences utilisées.
- Ordre **automatique, par date** : les postes actuels d'abord, puis du plus récent au plus ancien. La durée est calculée (« mars 2022 – aujourd'hui · 2 ans 8 mois »).
- Plusieurs postes à la suite dans la même entreprise (même nom) sont regroupés sous elle, avec la durée totale, comme sur LinkedIn.

### Formation

20 au plus.
- Établissement\*, diplôme, domaine d'études (100 caractères chacun).
- Début, puis fin ou « En cours ».
- Description (1 000 caractères).
- Ordre automatique : en cours d'abord, puis de la plus récente à la plus ancienne.

### Certifications

30 au plus.
- Nom\*, organisme, identifiant (100 caractères chacun).
- Date d'obtention, puis date d'expiration ou « N'expire pas ».
- Lien de vérification.
- Ordre automatique : de la plus récente à la plus ancienne. Une certification expirée reste affichée, avec la mention « Expirée en mars 2024 ».

### Projets

30 au plus, dans l'ordre choisi.
- Nom\* (100 caractères) et description (2 000).
- Dates facultatives, ou « En cours ».
- Lien et images (5 au plus, mêmes formats que la photo).
- Compétences utilisées, et expérience associée, choisie parmi les expériences (« Mission pour Banque X »).
- Sur la page publique, la première image sert de couverture. Un clic ouvre le projet en entier, avec toutes ses images.

### Compétences

50 au plus, dans l'ordre choisi.
- Un nom (50 caractères), **sans niveau** : une note qu'on se donne soi-même convainc peu. La matrice d'attributs de la vitrine `/design` (notes sur 20) est donc écartée pour le profil.
- La même liste sert aux compétences phares, aux expériences et aux projets : une compétence tapée dans une expérience s'ajoute à la liste.

### Langues

10 au plus, dans l'ordre choisi.
- Langue\* (50 caractères, avec des suggestions).
- Niveau : Notions, Intermédiaire, Courant, Bilingue, Langue maternelle.

### Recommandations

20 au plus, dans l'ordre choisi.
- **Saisies par le propriétaire** au MVP : texte\* (1 500 caractères), auteur\* (100), son rôle et son entreprise (100 chacun), un lien vers son profil (LinkedIn par exemple), une date.
- Plus tard : un lien envoyé au client, qui écrit lui-même sa recommandation. C'est plus crédible, et elle est signalée comme telle.

### Ordre des sections

- L'en-tête reste en haut. Les sections suivantes se rangent à la main, par glisser-déposer. Ordre par défaut : À propos, Offre freelance, Expériences, Projets, Formation, Certifications, Compétences, Langues, Recommandations.
- Sur la page publique, sur ordinateur, deux colonnes (planche « Classique ») : à gauche À propos, Expériences, Projets, Formation, Certifications et Recommandations ; à droite, dans des encadrés, Offre freelance, Compétences, Langues et Liens. L'ordre choisi s'applique dans chaque colonne.
- Dans une section, l'ordre est automatique (par date) pour les expériences, les formations et les certifications, et se choisit à la main pour tout le reste.
- Une section vide n'apparaît pas sur la page publique.

## Espace privé : « Mon profil »

- **Formulaire d'une traite** (planche « B · Formulaire ») : toutes les sections les unes sous les autres, dans l'ordre choisi, chacune avec son titre.
  - À gauche, un **sommaire** des sections, qui y mène d'un clic : une coche pour les sections uniques remplies, le nombre d'éléments pour les listes, un tiret pour une section vide. Sous le sommaire, « Ordre des sections » (glisser-déposer) et « Voir mon profil public ».
  - En tête, une phrase rappelle la règle : ce qui est rempli apparaît sur le profil public, le reste n'apparaît pas.
  - Les éléments d'une liste (expériences, projets…) sont repliés sur une ligne (titre et dates) et se déplient sur place pour être modifiés ; « Ajouter… » sous chaque liste. Les liens se rangent par glisser-déposer.
  - L'interrupteur « Je propose mes services en freelance » est à droite du titre de la section.
- Enregistrement et notifications :
  - une **barre en bas de la page**, comme le pied de la fenêtre des Paramètres : « Modifications non enregistrées » (pastille `warning`) dès qu'un champ change, puis « Annuler » et « Enregistrer » (le seul bouton rouge). Un seul enregistrement pour toute la page ;
  - quitter la page avec des modifications non enregistrées pose la question « Enregistrer les modifications ? », comme dans les Paramètres ;
  - chaque action est confirmée par une notification en bas à droite (« Expérience ajoutée », « Photo modifiée »…) ;
  - supprimer un élément demande une confirmation.
- Aperçu du CV et export : sous le sommaire, un bloc « CV » avec « Aperçu du CV » (nouvel onglet), « Télécharger en PDF » et « Télécharger en PNG ». Le CV reprend le profil **enregistré**.
- Pour voir son profil comme un visiteur : « Ouvrir mon profil public », dans le menu du profil, y compris hors ligne (aperçu avec le bandeau).

## Page publique : onglet « Profil »

- Planche « 1 · Classique » : l'en-tête, puis les sections non vides en deux colonnes (voir *Ordre des sections*). Expériences sur une ligne de temps (dates en étiquette, poste en Newsreader), postes d'une même entreprise regroupés ; projets en cartes à deux colonnes (image, nom, mission) ; recommandations en citation, sous un filet à l'encre. Sur mobile, une seule colonne, à dessiner pendant le développement. Même cadre que le squelette : pensée d'abord pour le mobile, deux thèmes, colonne de 1 080 px au plus (voir [public-profile.md](public-profile.md)).
- Titre de l'onglet du navigateur : `Prénom Nom · MyWork`, ou `<identifiant> · MyWork` sans nom.
- Aperçu au partage du lien (Open Graph) : le nom, le titre et le début de la présentation, avec une image générée à partir de la photo, du nom et du titre, dans le style de MyWork.
- Toujours pas de référencement par les moteurs de recherche (`noindex`). Il viendra avec le nom de domaine (voir [public-profile.md](public-profile.md), *Hors périmètre*).

## Export du CV

- Une **mise en page A4 dédiée**, sobre et imprimable, toujours en thème clair, sur une ou plusieurs pages. Elle sert à la fois d'**aperçu** dans « Mon profil » et de modèle pour le PDF et le PNG : l'export est donc fidèle à l'aperçu.
- Contenu : celui de la page publique, sans les images des projets ni les recommandations (à confirmer avec les maquettes).
  - L'e-mail et le téléphone y figurent en clair : c'est un CV.
  - En pied de page, l'adresse du profil public, si le profil est en ligne.
- **PDF** : bouton « Télécharger le CV » sur la page publique (pour tous les visiteurs) et dans « Mon profil ». Fichier `cv-<identifiant>.pdf`.
- **PNG** : dans « Mon profil » seulement. Une image de toute la hauteur du CV, à envoyer dans une messagerie ou sur un réseau social.

## Données

- Table `profiles` : des colonnes en plus pour les champs uniques. Ce sont le titre, la localisation, la présentation, l'e-mail de contact, le téléphone et la photo, puis l'interrupteur freelance, la disponibilité et sa date, les modes de travail, la zone de déplacement, le TJM, et enfin l'ordre des sections.
- Une table par liste : liens, prestations, expériences, formations, certifications, projets et leurs images, compétences (avec la marque « phare »), langues, recommandations. S'y ajoutent les liens entre les compétences et les expériences ou les projets.
  - Chaque ligne appartient à un utilisateur (`user_id`) et porte sa position, pour l'ordre choisi à la main.
  - RLS : chacun ne lit et ne modifie que ses propres lignes. Tout est supprimé avec le compte (en cascade).
- **Lecture publique**, comme pour le squelette : une fonction de la base ouverte aux visiteurs anonymes, avec les mêmes règles que `get_public_profile` (un profil en ligne pour tous, un profil hors ligne pour son propriétaire seul).
  - Elle renvoie en une fois tout le contenu public d'un profil, sans jamais l'adresse de connexion.
  - L'e-mail de contact et le téléphone n'y sont pas : une seconde fonction, mêmes règles, les renvoie au clic sur « Me contacter ».
- **Fichiers** (photo, images des projets) : Supabase Storage, un dossier par utilisateur, où lui seul peut écrire.
  - Proposé : lecture publique par adresse, avec des noms de fichiers impossibles à deviner. C'est plus simple et plus rapide que des adresses signées. En contrepartie, une image reste visible, même hors ligne, pour qui en connaît déjà l'adresse.
- **Valeurs de départ** : l'e-mail de contact (copie de l'adresse de connexion) et l'adresse de la photo Google, au déclencheur de l'inscription. Une migration les ajoute aux comptes existants, comme pour le prénom et le nom (voir [settings.md](settings.md)).
- **Suppression du compte** : les fichiers du stockage ne partent pas avec la cascade de la base. L'application les supprime donc avant d'appeler `delete_own_account` (voir [settings.md](settings.md)).

## Technique

Pour les agents qui développeront le module.

- Lire d'abord les guides Next.js 16 concernés, dans `node_modules/next/dist/docs/01-app/` : `02-guides/forms.md`, `03-api-reference/03-file-conventions/route.md` et `01-metadata/opengraph-image.md`, et les guides de cache (`cacheComponents` est activé).
- Pages publiques : une seule lecture de la base par visite, sans cache côté serveur au départ, comme le squelette. Si les pages sont lentes, passer à `use cache: remote`, avec un renouvellement à chaque enregistrement (voir [public-profile.md](public-profile.md), *Technique*).
- Bibliothèques, à choisir au début du développement (voir [product.md](product.md), *Stack technique*) : glisser-déposer (par exemple dnd-kit), recadrage de la photo, génération du PDF et du PNG.
- Export :
  - piste recommandée : un navigateur sans écran (Chromium) dans une fonction Vercel, qui ouvre la page A4 et en tire le PDF et le PNG. Le rendu est identique à l'aperçu ;
  - écartée : l'impression par le navigateur du visiteur, au rendu variable et peu pratique sur mobile.
- Icônes des liens : lucide-react (version 1) ne fournit plus de logos de marques. Prendre Simple Icons, ou quelques SVG dans `src/components/`.
- Partir des maquettes de la vitrine (`ProfilePreview`, `ExperienceTimeline` dans `src/app/design/_components/module-previews.tsx`) en les déplaçant dans le code du module (voir [design-system.md](design-system.md)).
- Renommer « CV » dans les commentaires du code (`src/app/app/profile/page.tsx`, `src/app/[handle]/page.tsx`) et dans la vitrine `/design`.

## Tests

- Bout en bout :
  - remplir chaque section dans « Mon profil », puis la retrouver sur la page publique ; un champ vide n'apparaît pas ;
  - interrupteur freelance : l'offre disparaît de la page publique et de l'export, puis revient intacte ;
  - « Me contacter » : l'e-mail et le téléphone sont absents de la page avant le clic, affichés après ;
  - ordre : expériences par date (poste actuel en tête, regroupement par entreprise), sections et listes déplacées à la main ;
  - photo : envoi, recadrage, remplacement, retrait (initiales) ;
  - prénom et nom modifiés dans « Mon profil » se retrouvent dans les Paramètres, et inversement ;
  - export : le PDF se télécharge depuis la page publique et contient le nom ; le PNG, depuis « Mon profil » ;
  - sécurité :
    - un visiteur ne lit rien d'un profil hors ligne, ni le contenu, ni les coordonnées ;
    - un utilisateur ne peut pas modifier le profil d'un autre ;
    - la suppression du compte efface aussi ses fichiers.
- Unitaires : dates et durées (« 2 ans 8 mois »), tri et regroupement des expériences, disponibilité (date passée), nettoyage des liens et reconnaissance des icônes, format du téléphone, TJM.

## Mise en œuvre

Fait le 2026-10-13, dans l'ordre proposé : base de données et stockage, « Mon profil », onglet « Profil » de la page publique (avec « Me contacter » et l'aperçu au partage), export du CV, tests (vérifiés en clair, en sombre et sur mobile).

## Précisé pendant le développement

- **Page publique sur mobile** : une seule colonne, qui suit l'ordre des sections choisi (les encadrés de droite s'intercalent), les liens en dernier.
- **CV exporté** : A4, deux colonnes (le parcours à gauche ; offre freelance, compétences, langues et liens à droite), photo en haut à droite, coordonnées en clair sous le nom. Sans les images des projets ni les recommandations. Les expériences d'une même entreprise ne sont pas regroupées.
- **Ordre des sections** : un panneau qui se déplie sous le sommaire (glisser-déposer, ou clavier : Espace, flèches, Espace), plutôt qu'une fenêtre.
- **Notifications** : une seule, « Profil enregistré », qui dit ce qui a changé (« Expérience ajoutée, photo modifiée. », trois changements au plus) ; rien n'est enregistré avant « Enregistrer ». Une erreur de saisie est signalée en rouge sous le champ, l'élément se déplie et rien n'est enregistré.
- **Certification sans date d'expiration** : elle n'expire pas (pas de case à cocher).
- **Photo** : recadrée en JPEG de 800 × 800 pixels au plus. Les images remplacées ou retirées sont supprimées du stockage à l'enregistrement suivant.
- **Bibliothèques** : dnd-kit (glisser-déposer), react-easy-crop (recadrage), Playwright et @sparticuz/chromium (navigateur sans écran pour l'export), Simple Icons (logos des liens ; LinkedIn dessiné à part), la police Newsreader de Fontsource (image de partage).

## Technique (fait)

- Base : migrations `20261013120000_add_profile_module.sql` (colonnes, tables, fonctions `profile_content`, `get_public_profile_content`, `get_public_profile_contact`, `get_own_profile_content`, `save_own_profile`, compartiment `profile-images`) et `20261013130000_fix_profile_month_checks.sql`. Les utilisateurs lisent leurs lignes, mais n'écrivent que par `save_own_profile`, qui remplace tout le profil d'un coup et vérifie les plafonds.
- Règles partagées (types, dates, tri, liens, nettoyage, validation, texte de la notification) : `src/lib/profile/`, avec leurs tests unitaires.
- « Mon profil » : `src/app/app/profile/` ; page publique : `src/app/[handle]/(profile)/` et `src/app/[handle]/_components/` ; CV : `src/app/[handle]/cv/` (page A4, `cv/pdf`) et `src/app/app/profile/cv/png`.
- Export : le navigateur sans écran ouvre la page du CV avec les cookies du visiteur (le propriétaire d'un profil hors ligne obtient son aperçu), sans JavaScript, sur une adresse du déploiement lui-même (jamais une adresse tirée de la requête). Chromium et les fichiers de l'image de partage sont déclarés dans `next.config.ts` (`outputFileTracingIncludes`).
- Tests : `e2e/profile.spec.ts` (bout en bout) et `src/lib/profile/*.test.ts` (unitaires).
- La page du CV contient l'e-mail et le téléphone en clair, comme le PDF : c'est un CV. Elle n'est pas indexée et aucun lien de la page publique n'y mène (seulement au PDF).

## Hors périmètre (plus tard)

- Contenu en plusieurs langues (français et anglais), repoussé le 2026-10-13.
- Recommandations demandées par lien au client.
- Logos des entreprises (à envoyer à la main), bénévolat, publications et conférences, distinctions et prix, secteurs d'activité, nombre de jours disponibles par semaine.
- Mise en forme des textes (gras, listes).
- Indicateur « profil complet à 80 % », dans le tableau de bord.
- Import (export LinkedIn, format JSON Resume), variantes ciblées du profil et du CV, plusieurs modèles de mise en page pour l'export.
- Référencement par les moteurs de recherche.

## Écarté

Repris de LinkedIn mais écarté le 2026-10-13 :
- la bannière : l'en-tête a déjà sa « lumière de studio » ;
- les pronoms, l'adresse postale, la date de naissance, la messagerie instantanée, la pause de carrière, les brevets, les cours suivis et les résultats aux tests ;
- la section « Sélection » : les projets jouent ce rôle ;
- les niveaux de compétences ;
- tout le côté réseau social : relations, publications, compétences validées par d'autres membres, centres d'intérêt.
