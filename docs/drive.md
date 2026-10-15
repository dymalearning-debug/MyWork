# Module Drive

Spécification du module Drive (type Google Drive), étape 5 de la roadmap (voir [product.md](product.md), *Roadmap*).
Statut : **spécifié** le 2026-10-15, à partir des souhaits du porteur du projet. Maquettes à faire. Les choix marqués *(proposé)* ont été pris sans le porteur du projet, à sa demande, puis **validés** par lui le même jour (voir *Décisions validées*).

## En bref

- Une **mini-reproduction de Google Drive**, réduite à sa partie centrale : une seule page, sans la colonne de navigation de Drive (ni « Partagés avec moi », ni « Récents », ni « Suivis »).
- Des **dossiers** pour s'organiser, et des **fichiers** de tout type.
- Deux affichages, au choix : **liste** (un tableau) ou **grille** (des vignettes).
- Pour chaque élément : nom, propriétaire, date de modification, taille, visibilité.
- Chaque fichier est **privé** par défaut. **Public**, n'importe qui peut le télécharger depuis l'onglet **« Ressources »** du profil public.
- Tri par nom ou par date de modification, filtre par type, petite barre de recherche, pagination.
- Un **indicateur de stockage** : l'espace utilisé par rapport à la capacité de l'offre Supabase.

## Maquettes

À faire avant le développement, dans le style des maquettes des Tableaux, avec le personnage fictif Inès Robert, en clair et en sombre :

| Planche | Contenu |
|---|---|
| **Liste** | La page en affichage liste : en-tête, barre d'outils, tableau, pagination, indicateur de stockage ; une ligne sélectionnée, le menu « … » ouvert |
| **Grille** | La même page en grille : dossiers puis fichiers, vignettes d'images |
| **Envoi** | Le panneau d'envoi en bas à droite, une zone de dépôt survolée, le message « Stockage plein » |
| **Ressources** | L'onglet « Ressources » du profil public, sur ordinateur et sur mobile |

Point de départ : la maquette « fichiers » de la vitrine `/design` (`src/app/design/_components/module-previews.tsx`), à adapter (elle montre une visibilité « par lien », écartée au MVP).

## Vocabulaire

**Élément** : un dossier ou un fichier (« item » dans le code). **Mes fichiers** : la racine, le dossier de départ.

## Navigation

- Un quatrième lien dans la barre latérale, **« Mes fichiers »**, sous « Mes tableaux », vers `/app/drive` *(proposé : « Mes fichiers » plutôt que « Mon Drive », nom de Google, et dans la lignée de « Mon profil » et « Mes tableaux »)*.
- Chaque dossier a son adresse, `/app/drive/<id>`, pour y revenir par un lien ou par le bouton « Précédent » du navigateur.
- En tête de page, un **fil d'Ariane** : « Mes fichiers › Clients › Acme » (Newsreader pour le dernier). Chaque étape est un lien, et une cible de dépôt pour remonter un élément.
- La recherche, le filtre, le tri et la page sont dans l'adresse (`?q=…&type=…&sort=…&page=…`) : un lien ou un rafraîchissement retrouve la même vue *(proposé)*.

## La page

De haut en bas :

1. **En-tête** : le fil d'Ariane à gauche ; à droite, le bouton rouge **« Nouveau »**, qui ouvre un menu : « Nouveau dossier », « Importer des fichiers ».
2. **Barre d'outils** :
   - la **barre de recherche** (« Rechercher dans ce dossier ») ;
   - le filtre **« Type »** (liste déroulante, voir *Filtre par type*) ;
   - le menu **« Trier »** (utile surtout en grille ; en liste, on trie aussi par les titres de colonnes) ;
   - à droite, le choix de l'**affichage**, deux boutons à icône côte à côte : liste, grille.
3. **Les éléments**, en liste ou en grille. Les dossiers passent toujours avant les fichiers, comme dans Drive.
4. **Pied** : la pagination à gauche, l'**indicateur de stockage** à droite.

### Affichage liste

Un tableau (composant `Table` du design system), une ligne par élément :

| Colonne | Contenu |
|---|---|
| (case) | Case à cocher, pour la sélection multiple |
| **Nom** | Icône du type (dossier, PDF, image…) et nom. Triable |
| **Propriétaire** | « moi », avec l'avatar. Une seule valeur possible au MVP : la colonne prépare le partage, plus tard *(proposé)* |
| **Modifié** | Date courte (« 14 oct. 2026 », l'heure si c'est aujourd'hui), en `tabular-nums`. Triable |
| **Taille** | « 4,8 Mo » ; « — » pour un dossier, comme Drive |
| **Visibilité** | Badge « Public » (`contrast`) ; rien pour un fichier privé, pour que le public ressorte *(proposé)* |
| (actions) | Le menu « … » de l'élément |

### Affichage grille

- D'abord les **dossiers**, en tuiles basses (icône et nom), puis les **fichiers**, en cartes : une vignette (l'image elle-même pour une image, sinon la grande icône du type), le nom, le badge « Public » s'il y a lieu, le menu « … ».
- La case de sélection apparaît au survol, et reste affichée sur les éléments sélectionnés.
- Le choix liste ou grille est retenu par un cookie, propre à chaque appareil, comme le dernier tableau consulté *(proposé)*. Liste par défaut.

### Ouvrir un élément

- **Un clic** sur un dossier l'ouvre ; un clic sur un fichier ouvre son **aperçu** *(proposé : un clic simple, plus naturel sur le web que le double-clic de Drive)*. La sélection passe par la case à cocher.
- **Aperçu**, dans une grande fenêtre : les images et les PDF s'affichent ; les autres types montrent leur icône, leurs informations et « Télécharger ». Flèches pour passer au fichier suivant ou précédent du dossier ; en haut, le nom, « Télécharger » et la croix.

### Menu « … » d'un élément

- Dossier : Ouvrir, Renommer, Déplacer, Supprimer.
- Fichier : Aperçu, Télécharger, Renommer, Déplacer, **Rendre public** / **Rendre privé**, Supprimer.
- Supprimer en variante `destructive`, en bas, après un séparateur.

### Sélection multiple

- Cocher un ou plusieurs éléments (ou « tout sélectionner » dans l'en-tête de la liste, pour la page affichée) remplace la barre d'outils par une **barre d'actions** : « 3 sélectionnés », Déplacer, Rendre public, Rendre privé, Supprimer, et la croix pour tout désélectionner *(proposé)*.
- « Rendre public » ou « privé » sur une sélection qui contient des dossiers s'applique seulement aux fichiers sélectionnés.

## Dossiers

- Nom\* : 120 caractères. Création par « Nouveau › Nouveau dossier », dans une petite fenêtre (« Dossier sans titre » présélectionné).
- **Sous-dossiers** sur **10 niveaux au plus** *(proposé, garde-fou)*.
- Deux éléments d'un même dossier ne peuvent pas porter le même nom : « Un élément porte déjà ce nom dans ce dossier. » *(proposé ; Drive l'accepte, mais c'est source de confusion)*.
- Un dossier n'a **pas de visibilité** : seuls les fichiers sont publics ou privés *(proposé)*.
- Supprimer un dossier demande une confirmation, qui annonce ce qui part avec lui (« 12 fichiers et 2 dossiers »).

## Fichiers

### Envoi

- Par « Nouveau › Importer des fichiers » (plusieurs à la fois), ou par **glisser-déposer** de fichiers sur la page : la zone des éléments s'encadre de rouge, « Déposer dans *Acme* ». Déposer sur un dossier de la liste l'envoie dans ce dossier.
- **50 Mo au plus par fichier** : la limite de l'offre gratuite de Supabase *(proposé)*.
- **Tous les types**, sauf les programmes exécutables (`.exe`, `.msi`, `.bat`, `.cmd`, `.com`, `.scr`, `.ps1`, `.sh`, `.apk`, `.dmg`…), refusés avec un message *(proposé)*.
- Un nom déjà pris dans le dossier reçoit un numéro : « Devis (2).pdf ».
- **Panneau d'envoi** en bas à droite, comme Drive : un fichier par ligne, avec sa barre de progression ; « 3 envois terminés » à la fin, refermable. Un envoi en cours peut être annulé.
- Les fichiers trop gros, interdits ou qui dépasseraient la capacité sont refusés **avant l'envoi**, chacun avec sa raison dans le panneau.
- Pour une image, une **vignette** (400 pixels, WebP) est fabriquée dans le navigateur à l'envoi, pour la grille et l'aperçu rapide *(proposé)*.

### Renommer, déplacer, télécharger, supprimer

- **Renommer** : petite fenêtre, nom présélectionné sans l'extension. Changer d'extension est permis.
- **Déplacer** : une fenêtre qui montre l'arborescence des dossiers, « Déplacer ici ». Ou glisser-déposer un élément sur un dossier, ou sur une étape du fil d'Ariane. Un dossier ne peut pas aller dans l'un de ses propres sous-dossiers.
- **Télécharger** : le fichier, sous son nom. Pas de téléchargement d'un dossier entier au MVP (archive zip : plus tard).
- **Supprimer** : **définitif**, après une confirmation *(proposé : pas de corbeille au MVP, alors que [modules.md](modules.md) en prévoyait une)*. Une notification le confirme.

### Date de modification

- Un fichier : la date de son envoi, puis de son dernier renommage. Un dossier : sa création, puis son dernier renommage.
- Déplacer un élément ou changer sa visibilité ne change pas la date *(proposé)*.

## Visibilité et onglet « Ressources »

- Chaque fichier est **privé** par défaut. **Public**, il apparaît dans l'onglet « Ressources » du profil public, et n'importe qui peut le télécharger.
- Pas de visibilité « par lien » (fichier accessible à qui a son adresse, sans être listé) au MVP *(proposé, plus tard)*.
- Rendre un fichier public ou privé : depuis son menu, ou la barre d'actions. Tout de suite, sans confirmation, avec une notification (« Fichier rendu public — visible dans l'onglet Ressources de votre profil »).
- Un fichier public reste soumis à l'interrupteur du profil : profil hors ligne, personne ne le voit ni ne le télécharge (voir [public-profile.md](public-profile.md), *En ligne ou hors ligne*).

### L'onglet « Ressources »

- Adresse : `/<identifiant>/resources` *(proposé : en anglais, comme `/cv` et les autres routes, ce qui tranche la question ouverte des noms des sous-pages)*.
- L'onglet apparaît après « Profil », **seulement s'il y a au moins un fichier public**. Sinon, l'adresse mène à la page introuvable.
- Contenu : la liste des fichiers publics, **à plat** (sans les dossiers, qui sont l'organisation privée), du plus récent au plus ancien : icône du type, nom, taille, date, bouton « Télécharger » *(proposé)*. Au-delà de 50 fichiers, la même pagination que l'espace privé.
- Sur mobile : une ligne par fichier, le bouton réduit à son icône.
- Le téléchargement se fait toujours en **pièce jointe** : le fichier est enregistré, jamais ouvert dans le navigateur, ce qui protège les visiteurs d'un fichier piégé *(proposé)*.

## Tri, filtre, recherche, pagination

### Tri

- **Nom** (A → Z, Z → A) ou **date de modification** (plus récent d'abord, plus ancien d'abord). Par défaut : nom, A → Z *(proposé, comme Drive)*.
- En liste, un clic sur le titre « Nom » ou « Modifié » trie, un second clic inverse ; une flèche montre le sens. En grille, le menu « Trier » propose les quatre choix.
- Les dossiers restent toujours en tête, triés de la même façon.

### Filtre par type

Une liste déroulante « Type », un seul choix à la fois *(proposé)*, qui ne garde que les éléments de ce type :

| Type | Ce qu'il regroupe |
|---|---|
| Dossiers | Les dossiers |
| Documents | PDF, Word, OpenDocument texte, texte brut, Markdown, RTF |
| Feuilles de calcul | Excel, OpenDocument tableur, CSV |
| Présentations | PowerPoint, OpenDocument présentation, Keynote |
| Images | JPG, PNG, WebP, GIF, SVG, HEIC… |
| Vidéos | MP4, MOV, WebM… |
| Audio | MP3, WAV, M4A… |
| Archives | ZIP, RAR, 7z, TAR… |
| Autres | Tout le reste |

Le type se déduit de l'extension et du type déclaré par le navigateur à l'envoi, et il est enregistré avec le fichier.

### Recherche

- Une petite barre de recherche : elle filtre les éléments **du dossier affiché** dont le nom contient le texte saisi, sans tenir compte des majuscules ni des accents, pendant la frappe *(proposé : « filtrer dans la liste », comme demandé ; la recherche dans tout le Drive viendra plus tard)*.
- Recherche, filtre et tri se combinent. Aucun résultat : « Aucun élément ne correspond », avec « Effacer les filtres ».

### Pagination

- **50 éléments par page** *(proposé)*, dossiers compris.
- Sous les éléments : « 1–50 sur 132 », les boutons « Précédent » et « Suivant », et les numéros de page (les premières, la page actuelle et ses voisines, la dernière).
- Changer de dossier, de recherche, de filtre ou de tri revient à la page 1.

## Indicateur de stockage

- En bas à droite de la page : une **barre de progression** fine et « 312 Mo sur 1 Go ».
- **Capacité** : celle de l'offre Supabase utilisée par le projet, soit **1 Go** sur l'offre gratuite *(proposé)*. Elle est inscrite à un seul endroit, dans la base ; elle deviendra le quota de l'abonnement avec l'ouverture en SaaS, et 100 Go en passant à l'offre Pro.
- **Espace utilisé** : la taille de **tous les fichiers de l'utilisateur**, tous compartiments confondus, et pas seulement ceux du Drive.
- Une icône « ? » à côté (aide contextuelle du design system), avec une infobulle qui détaille :
  - « Mes fichiers : 280 Mo »
  - « Photo et images du profil : 12 Mo »
  - « Images des tableaux : 20 Mo »
  - puis « La capacité est celle de l'offre gratuite de Supabase, partagée par toute l'application. »
- Couleurs : la barre en encre ; en `warning` au-delà de 80 % ; en `destructive` à 100 %, avec « Stockage plein ».
- **Capacité atteinte** : les envois qui la dépasseraient sont refusés (« Stockage plein — Supprimez des fichiers pour en ajouter d'autres »). La base vérifie elle aussi, pas seulement l'interface. Les images du profil et des tableaux ne sont pas bloquées au MVP *(proposé)*.

## Données

- Une table **`drive_items`**, chaque ligne rattachée à l'utilisateur (`user_id`) et supprimée en cascade avec le compte : type (dossier ou fichier), nom, dossier parent (vide pour la racine), et pour un fichier : chemin dans le stockage, taille, type MIME, catégorie (pour le filtre), vignette, visibilité (`private` par défaut ou `public`) ; dates de création et de modification.
- **RLS** : chacun ne lit et ne modifie que ses propres éléments. Unicité du nom dans un dossier, profondeur et capacité vérifiées **dans la base**.
- **Fichiers** : Supabase Storage, compartiment **`drive-files`**, **privé**, 50 Mo par fichier, un dossier par utilisateur. Les fichiers y sont rangés **à plat** sous un nom au hasard (`<id utilisateur>/<id>`), comme les images des tableaux : renommer ou déplacer ne touche que la table, jamais le stockage. Vignettes à côté (`<id utilisateur>/<id>-thumb.webp`).
- **Téléchargement et aperçu** par des adresses temporaires (signées), valables une heure dans l'espace privé, quelques minutes pour les visiteurs, avec le vrai nom du fichier.
- **Accès des visiteurs** : un accès dédié, ouvert aux visiteurs anonymes, qui liste les seuls fichiers publics d'un profil en ligne (jamais leur dossier ni leur chemin), et une règle du stockage qui leur permet de télécharger un fichier seulement s'il est public et que le profil est en ligne. La clé secrète Supabase n'est pas utilisée.
- **Espace utilisé** : une fonction de la base qui additionne la taille des fichiers du dossier de l'utilisateur dans chaque compartiment (`profile-images`, `board-images`, `drive-files`), et renvoie aussi la capacité.
- Suppression d'un fichier, d'un dossier ou du compte : l'application retire aussi les fichiers du stockage, comme pour les images des tableaux.

## Technique

Pour les agents qui développeront le module.

- Lire d'abord les guides Next.js 16 concernés dans `node_modules/next/dist/docs/01-app/` : routes dynamiques, `searchParams`, formulaires et Server Actions, et les guides de cache (`cacheComponents` est activé).
- **Envoi direct du navigateur vers Supabase Storage**, jamais par une fonction Vercel, limitée à 4,5 Mo par requête.
- Envoi **reprenable** (protocole TUS, que Supabase recommande au-delà de 6 Mo), qui donne aussi la progression pour le panneau d'envoi. Bibliothèque *(proposé)* : `tus-js-client`. À reporter dans `docs/product.md`, *Inventaire technique*, avec le compartiment `drive-files`.
- Ordre d'un envoi, pour que la capacité soit vérifiée par la base : la ligne de `drive_items` est créée d'abord (la base refuse si la capacité ou les règles sont dépassées), puis le fichier est envoyé ; en cas d'échec ou d'annulation, la ligne est retirée. Une ligne restée sans fichier (onglet fermé en plein envoi) n'est pas affichée, et elle est nettoyée au prochain passage.
- Recherche, filtre, tri et pagination **côté base** (une requête par page), pour tenir avec beaucoup de fichiers. Recherche sans accents : extension `unaccent`, ou nom normalisé enregistré à côté du nom.
- Glisser-déposer des éléments sur un dossier : dnd-kit, déjà utilisé ; dépôt de fichiers venus de l'ordinateur : événements natifs du navigateur.
- Code du module : `src/app/app/drive/` (pages et composants), règles partagées (types et catégories, extensions interdites, tailles, numérotation des doublons, format des tailles et des dates) dans `src/lib/drive/`. Onglet public : `src/app/[handle]/resources/`, et son lien dans `profile-header.tsx`. Lien « Mes fichiers » dans `src/app/app/_components/sidebar-nav.tsx`.
- Page publique : mêmes règles de cache que l'onglet « Profil » (voir [public-profile.md](public-profile.md), *Technique*).

## Tests

- Bout en bout :
  - créer un dossier, un sous-dossier ; y entrer, remonter par le fil d'Ariane ; renommer, déplacer, supprimer (avec son contenu) ;
  - envoyer des fichiers (bouton et glisser-déposer), voir la progression ; doublon numéroté ; fichier trop gros et exécutable refusés ;
  - aperçu d'une image et d'un PDF ; téléchargement sous le bon nom ;
  - liste et grille, choix retenu ; tri par nom et par date, dans les deux sens, dossiers en tête ; filtre par type ; recherche (majuscules, accents) ; pagination au-delà de 50 éléments ;
  - sélection multiple : déplacer, rendre public, supprimer ;
  - rendre un fichier public : il apparaît dans l'onglet « Ressources », téléchargeable sans connexion ; rendu privé, il disparaît, et son ancienne adresse de téléchargement ne marche plus une fois expirée ; profil hors ligne : ni onglet, ni téléchargement ;
  - indicateur de stockage : il augmente après un envoi, l'infobulle détaille les trois sources ; capacité dépassée refusée par la base ;
  - sécurité : un utilisateur ne voit, ne télécharge ni ne modifie les fichiers d'un autre ; un visiteur n'obtient jamais un fichier privé ;
  - la suppression du compte efface éléments et fichiers.
- Unitaires : catégorie d'après l'extension et le type, extensions interdites, numérotation des doublons, format des tailles (« 4,8 Mo ») et des dates, calcul des numéros de page.

## Mise en œuvre

1. Maquettes (planches ci-dessus), à valider par le porteur du projet.
2. Base de données et stockage : table, règles, accès des visiteurs, espace utilisé, compartiment privé.
3. Page « Mes fichiers » : navigation, dossiers, envoi, liste et grille, menu, aperçu.
4. Tri, filtre, recherche, pagination, sélection multiple, indicateur de stockage.
5. Onglet « Ressources » du profil public.
6. Tests ; vérification en clair et en sombre, et l'onglet public sur mobile.

## Décisions validées

Choix pris le 2026-10-15 sans le porteur du projet, à sa demande, puis validés par lui le même jour, sans changement :

1. **Nom** : « Mes fichiers » dans la barre latérale, « Drive » dans la documentation, `drive` dans le code et l'adresse (`/app/drive`).
2. **Onglet public** « Ressources » à l'adresse `/<identifiant>/resources` (en anglais, comme `/cv`), affiché seulement s'il y a un fichier public ; fichiers à plat, du plus récent au plus ancien.
3. **Visibilité sur les fichiers seulement**, pas sur les dossiers ; pas de visibilité « par lien » au MVP.
4. **Pas de corbeille** : suppression définitive après confirmation (la corbeille était prévue au MVP dans [modules.md](modules.md)).
5. **Un clic** ouvre un dossier ou l'aperçu d'un fichier ; la sélection passe par une case à cocher ; sélection multiple avec barre d'actions.
6. **Aperçu** des images et des PDF gardé au MVP, comme prévu dans [modules.md](modules.md).
7. **Plafonds** : 50 Mo par fichier, 10 niveaux de dossiers, noms de 120 caractères, noms uniques dans un dossier (doublons numérotés à l'envoi), exécutables refusés.
8. **Capacité** de 1 Go (offre gratuite de Supabase), comptant tous les fichiers de l'utilisateur ; seuls les envois du Drive sont bloqués une fois pleine.
9. **Recherche et filtre dans le dossier affiché** seulement ; filtre « Type » à un seul choix, en neuf catégories.
10. **Tri** par défaut sur le nom, dossiers toujours en tête.
11. **Pagination** de 50 éléments ; recherche, filtre, tri et page dans l'adresse ; liste ou grille retenue par appareil, liste par défaut.
12. **Colonne « Propriétaire »** affichée, toujours « moi » au MVP ; badge « Public » seul, rien pour les fichiers privés.
13. **Date de modification** changée par l'envoi et le renommage, pas par un déplacement ni un changement de visibilité.
14. **Vignettes** d'images fabriquées dans le navigateur à l'envoi ; téléchargements publics toujours en pièce jointe.
15. **Envoi reprenable** (TUS, `tus-js-client`), direct du navigateur vers Supabase, avec un panneau de progression en bas à droite.

## Hors périmètre (plus tard)

- Corbeille, historique des versions, remplacement d'un fichier par une nouvelle version.
- Visibilité « par lien », liens de partage avec expiration, dossiers publics.
- Recherche dans tout le Drive, filtres combinés (plusieurs types, dates, taille).
- Import d'un dossier entier, téléchargement d'un dossier en archive zip.
- Partage avec d'autres utilisateurs (la colonne « Propriétaire » prendra alors son sens), favoris, récents.
- Aperçu d'autres types (vidéo, audio, texte, Office).
- Pièces jointes des cartes reliées au Drive, fichiers publics reliés aux projets du profil (voir [modules.md](modules.md), *Liens entre modules*).
- Compteur de téléchargements des ressources, signalement d'un fichier public abusif (avec le SaaS).
- Résumé de l'activité dans le tableau de bord.
- Version mobile de l'espace privé (voir [product.md](product.md), *Plateforme*).
