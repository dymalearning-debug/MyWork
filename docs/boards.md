# Module Tableaux

Spécification du module Tableaux (« Boards » dans le code, type Trello), désormais étape 3 de la roadmap (voir [product.md](product.md), *Roadmap*).
Statut : **spécifié** le 2026-10-14, maquettes validées le même jour, **développé** le même jour (voir *Précisé pendant le développement*). Les choix marqués *(proposé)* ont été pris sans le porteur du projet et sont rassemblés dans *Décisions à valider*.

## En bref

- Des **tableaux kanban**, version simplifiée de Trello : des listes côte à côte, des cartes dans les listes, que l'on déplace par glisser-déposer. L'expérience doit rester proche de Trello.
- **Uniquement privés** : un outil d'organisation personnel, visible du seul utilisateur, dans l'espace privé. Ni partie publique, ni visiteurs, ni commentaires (décision du 2026-10-14, qui remplace la première version de la fiche).
- Plusieurs tableaux par compte ; on passe de l'un à l'autre à tout moment, par une liste déroulante sur le nom du tableau.
- Une carte s'écrit d'un trait dans la liste. Un clic l'ouvre dans une fenêtre : **description** à la mise en forme légère, **checklist** (visible sur la carte), **images**.
- Plafonds : **5 listes** par tableau, **20 cartes** par liste.

## Maquettes

Validées le 2026-10-14 : [Maquettes module Tableaux](https://claude.ai/artifact/2ZD8iW5GEuWmk5MhHZv9E8) sur claude.ai (réglage « dark » pour le thème sombre). Personnage fictif : Inès Robert.

| Écran | Planche | Origine |
|---|---|---|
| Tableau | **Tableau** | Rendu « A · Atelier » (listes sur fond gris, cartes blanches à filet), avec la navigation de « C · Pupitre » (une seconde colonne qui liste les tableaux), remplacée après essai par une liste déroulante sur le nom du tableau (2026-10-14) |
| Fenêtre d'une carte | **Carte ouverte** | « A · Atelier » : deux colonnes, le contenu à gauche, les actions à droite ; sans les commentaires |

Écartées le 2026-10-14 : « B · Registre » (listes sans fond, numérotées, onglets de tableaux) et « C · Pupitre » pour le reste (cartes en lignes compactes, carte ouverte dans un panneau latéral). Les trois directions publiques (« Miroir », « Feuille de route », « Bandeau ») ont été retirées avec la partie publique.

Dessinés pendant le développement, dans le style des maquettes : les réglages d'un tableau (menu « … » : renommer, supprimer), le tableau vide (« Aucun tableau », avec le nom à saisir et « Créer mon premier tableau ») et les confirmations de suppression (tableau, liste, carte), sur le modèle de celle du compte.

## Vocabulaire

**Tableau** : un kanban (« board » dans le code). **Liste** : une colonne (« list »). **Carte** : un élément d'une liste (« card »).

## Navigation

- Un troisième lien dans la barre latérale, **« Mes tableaux »**, sous « Mon profil », vers `/app/boards`. Il ouvre le dernier tableau consulté *(proposé)*. Chaque tableau a son adresse, `/app/boards/<id>`.
- **Choix du tableau sur son nom** (décision du 2026-10-14, après essai de la seconde colonne) : le nom du tableau, en tête de page, est une liste déroulante (flèche à droite du nom). Elle montre les tableaux (sans leur nombre de cartes), le tableau ouvert coché, et « Nouveau tableau » en bas, qui demande le nom dans une petite fenêtre. À 10 tableaux, « Nouveau tableau » est grisé (« 10 au plus »).
- Les tableaux s'affichent dans l'ordre de leur création. La barre latérale garde sa largeur habituelle (256 px).

## Tableaux

- Un tableau a un **nom**\* (60 caractères). Pas de fond, d'icône ni de description *(proposé)*.
- **10 tableaux au plus** par compte *(proposé)*, comme garde-fou pour le SaaS.
- En tête du tableau : son nom (Newsreader) et le menu « … » des **réglages** : renommer, supprimer.
- Supprimer demande une confirmation, et efface listes, cartes et images.
- Un nouveau compte n'a aucun tableau : la page propose « Créer mon premier tableau ».
- Un nouveau tableau part avec trois listes, « À faire », « En cours », « Terminé », que l'on renomme ou supprime *(proposé)*.

## Listes

- **5 listes au plus** par tableau. « Ajouter une liste » (cadre en pointillés, après la dernière liste), sans compteur, disparaît une fois la limite atteinte. À l'ajout de la cinquième liste, une notification prévient : « 5 listes au plus — Supprimez une liste pour en ajouter une autre. »
- Nom\* : 50 caractères. Il se modifie d'un clic sur le titre (Entrée enregistre, Échap annule).
- Le titre de la liste, sans nombre de cartes, et son menu « … » pour la renommer ou la supprimer.
- Les listes se déplacent par **glisser-déposer**, horizontalement (et au clavier : Espace, flèches, Espace, comme l'ordre des sections du module Profil).
- Supprimer une liste demande une confirmation, qui annonce le nombre de cartes supprimées avec elle.
- Largeur fixe de 272 px, comme Trello ; au-delà de l'écran, le tableau défile horizontalement.

## Cartes

### Dans la liste

- **20 cartes au plus** par liste.
- **Ajout rapide, comme Trello** : « Ajouter une carte » en bas de la liste ouvre une zone de saisie. On tape le titre, **Entrée** crée la carte et rouvre aussitôt une zone vide pour la suivante (rappel « Entrée ajoute » à côté du bouton) ; Échap, la croix ou un clic à côté referment.
- Titre\* : 200 caractères.
- Les cartes se déplacent par **glisser-déposer**, dans la liste et d'une liste à l'autre (et au clavier). Une liste pleine refuse la carte, avec un message.
- Affichage d'une carte dans la liste :
  - la **couverture** (première image) en haut, s'il y en a une ;
  - le titre ;
  - des **pastilles** : description (icône de texte), **checklist** (« 3/5 », qui passe en couleur `success` une fois tout coché), nombre d'images.
- Un clic ouvre la **fenêtre de la carte**.

### Fenêtre de la carte

Planche « Carte ouverte ». Une fenêtre de dialogue de 820 px, au-dessus du tableau assombri. L'adresse change à l'ouverture (`…?card=<id>`), pour retrouver une carte par un lien *(proposé)*.

- **À gauche**, le contenu : le titre (Newsreader, modifiable d'un clic) et « dans la liste *En cours* », puis **Description**, **Checklist** et **Images**.
- **À droite**, les actions, en boutons gris :
  - **Ajouter** : « Checklist », « Images » ;
  - **Actions** : « Déplacer » (choix de la liste, utile au clavier), « Supprimer » (variante `destructive`, avec confirmation) ;
  - la croix de fermeture en haut.
- Pas d'archivage (plus tard).
- **Enregistrement au fil de l'eau**, champ par champ, sans bouton « Enregistrer » global, comme Trello *(proposé)*. Une notification en bas à droite seulement en cas d'erreur ou de suppression.

### Description

- 10 000 caractères *(proposé)*.
- Au repos, la description s'affiche **mise en forme**. Un clic la passe en édition, avec une petite barre d'outils : gras, italique, liste à puces, lien.
- **Mise en forme légère**, bien plus simple que Trello, en Markdown : **gras**, *italique*, listes à puces et numérotées, liens cliquables (les adresses deviennent des liens d'elles-mêmes). Rien d'autre : ni titres, ni tableaux, ni couleurs *(proposé)*.
- **Clavier, comme dans un chat d'IA** :
  - **Entrée enregistre** et quitte l'édition ;
  - **Maj+Entrée** va à la ligne. Dans une liste à puces, la ligne suivante reprend la puce ;
  - Échap annule les modifications ;
  - Ctrl+B et Ctrl+I mettent la sélection en gras ou en italique.
- Sous la zone : « Enregistrer », « Annuler » et le rappel des raccourcis. Un clic à côté **enregistre** aussi, pour ne jamais perdre un long texte *(proposé)*.

### Checklist

- **Une checklist par carte** *(proposé ; Trello en permet plusieurs)*, ajoutée par le bouton « Checklist », sans nom.
- 20 éléments au plus, 200 caractères chacun. On les ajoute à la suite (« Ajouter un élément » ; Entrée crée l'élément et rouvre une ligne vide), on les coche (case à l'encre, texte barré et atténué), on les renomme d'un clic, on les range par glisser-déposer, on les supprime (sans confirmation).
- Au-dessus, le pourcentage d'éléments cochés (« 50 % » pour un élément coché sur deux, en vert à 100 %) et une barre de progression fine. Pas de compteur « 3 / 5 » dans la fenêtre (retiré le 2026-10-14).
- Sur la carte, dans la liste, la pastille « 3/5 » (voir *Dans la liste*).

### Images

- 5 images par carte, 5 Mo chacune, JPG, PNG, WebP ou GIF. Réduites à 1 600 pixels au plus à l'envoi *(proposé)*.
- Ajout par le bouton « Images », par la case « + » à la suite des vignettes (« 3 / 5 »), par glisser-déposer d'un fichier sur la fenêtre, ou par un coller (Ctrl+V).
- La première image sert de **couverture** (marquée « Couverture » sur sa vignette) ; on choisit une autre couverture, ou aucune, depuis le menu de l'image.
- Un clic ouvre l'image en grand, avec les flèches pour passer aux autres. On la supprime depuis son menu.

## Données

- Tables, chaque ligne rattachée à l'utilisateur (`user_id`) et supprimée en cascade avec le compte :
  - `boards` : nom, position ;
  - `board_lists` : tableau, nom, position ;
  - `board_cards` : liste, titre, description, position, image de couverture, dates de création et de modification ;
  - `board_checklist_items` : carte, texte, coché, position ;
  - `board_card_images` : carte, fichier, position.
- **RLS** : chacun ne lit et ne modifie que ses propres lignes. Écritures directes sur les tables, élément par élément, puisque tout s'enregistre au fil de l'eau *(proposé ; le module Profil, lui, enregistre tout d'un coup par une fonction)*.
- Plafonds (10 tableaux, 5 listes, 20 cartes par liste, 20 éléments de checklist, 5 images) vérifiés **dans la base**, par des déclencheurs, pas seulement dans l'interface.
- Positions : des nombres décimaux, pour insérer une carte entre deux autres sans renuméroter la liste *(proposé)*.
- **Fichiers** : Supabase Storage, compartiment **`board-images`**, **privé** : un dossier par utilisateur, où lui seul lit et écrit. Les images s'affichent par des adresses temporaires (signées), valables une heure *(proposé)*. Contrairement à `profile-images`, rien n'y est public, puisque les tableaux ne le sont pas. Images supprimées par l'application avec leur carte, leur liste, leur tableau ou le compte.

## Technique

Pour les agents qui développeront le module.

- Lire d'abord les guides Next.js 16 concernés dans `node_modules/next/dist/docs/01-app/` : formulaires et Server Actions, routes dynamiques, et les guides de cache (`cacheComponents` est activé).
- Bibliothèques *(proposé)* : **dnd-kit**, déjà utilisé par le module Profil, pour les tableaux, les listes, les cartes et la checklist (souris et clavier). Pour la description, une zone de texte Markdown et un rendu limité aux éléments permis (**react-markdown**), plutôt qu'un éditeur visuel complet (Tiptap) : plus simple, plus léger, et la mise en forme voulue est minime.
- Glisser-déposer **optimiste** : la carte bouge tout de suite, l'enregistrement suit ; en cas d'échec (liste pleine, réseau), elle revient à sa place avec un message.
- Code du module : `src/app/app/(subscribed)/boards/` (pages et composants), règles partagées (plafonds, positions, Markdown permis, raccourcis) dans `src/lib/boards/`. Lien « Mes tableaux » à ajouter dans `src/app/app/_components/sidebar-nav.tsx`.
- Reporter `board-images`, `react-markdown` et tout autre choix dans `docs/product.md`, *Inventaire technique*.

## Tests

- Bout en bout :
  - créer un tableau (trois listes de départ), le renommer, en créer un second et passer de l'un à l'autre par la liste déroulante du nom ; supprimer un tableau ;
  - ajouter des cartes à la suite (Entrée), les déplacer dans une liste et d'une liste à l'autre ; renommer, déplacer et supprimer une liste ;
  - plafonds : un 11e tableau, une 6e liste et une 21e carte sont refusés, dans l'interface et par la base ;
  - fenêtre de la carte : description mise en forme (gras, liste), Entrée enregistre, Maj+Entrée va à la ligne, Échap annule ; checklist et pastille « 3/5 » ; image, couverture, suppression d'image ; « Déplacer » ; suppression de la carte ;
  - sécurité : un utilisateur ne lit ni ne modifie les tableaux d'un autre, ni ses images ; un visiteur non connecté n'accède à rien ;
  - la suppression du compte efface tableaux et images.
- Unitaires : calcul des positions, plafonds, nettoyage du Markdown (rien d'autre que les éléments permis), raccourcis clavier de la description.

## Mise en œuvre

Tout est fait (2026-10-14) :

1. Maquettes : validées le 2026-10-14.
2. Base de données et stockage : migrations `20261014120000_add_boards_module.sql` et `20261014121000_board_limits_as_owner.sql` (tables, plafonds, RLS, compartiment privé).
3. Navigation (« Mes tableaux », liste déroulante sur le nom du tableau), tableaux, listes, cartes, glisser-déposer.
4. Fenêtre de la carte : description, checklist, images.
5. Tests (`e2e/boards.spec.ts`, `src/lib/boards/*.test.ts`) ; vérification en clair et en sombre.

## Précisé pendant le développement

Choix faits en cours de route, à valider avec ceux de *Décisions à valider* :

- **Enregistrement** : chaque changement s'affiche aussitôt, puis s'enregistre depuis le navigateur, directement dans les tables (la base vérifie droits et plafonds). En cas d'échec, il est annulé à l'écran, avec une notification qui dit pourquoi (plafond atteint ou « Réessayez »). Notifications de réussite seulement pour les suppressions (tableau, liste, carte, image).
- **Nouveau tableau** : créé par une fonction de la base (`create_board`), qui ajoute les trois listes de départ d'un coup. Il se place après les autres et s'ouvre aussitôt.
- **Dernier tableau consulté** : retenu par un cookie, propre à chaque appareil. Le lien « Mes tableaux » n'est jamais préchargé, puisque sa destination change. Après la suppression d'un tableau, on passe au premier tableau restant.
- **Listes** : on les déplace en les saisissant par leur en-tête ; au clavier, l'en-tête prend le focus, Entrée renomme, Espace déplace. Le nom se modifie aussi d'un clic, ou par le menu « … » de la liste. Une liste pleine affiche « Liste pleine · 20 / 20 » à la place de « Ajouter une carte ».
- **Cartes** : Entrée sur une carte l'ouvre, Espace la déplace. Une carte déposée sur une liste (même vide) va à la fin de celle-ci. La couverture occupe toute la largeur de la carte, sur 128 pixels de haut.
- **Fenêtre de la carte** : « Déplacer » propose les autres listes ; une liste pleine y est grisée (« pleine »). La fenêtre prend elle-même le focus à l'ouverture. Échap dans un champ en cours d'édition annule l'édition, sans fermer la fenêtre.
- **Description** : sans description, une zone « Ajouter une description… » ; avec, un bouton « Modifier » au-dessus du texte (un clic sur le texte marche aussi, sauf sur un lien). Le bouton « Lien » insère `[texte](https://)`, l'adresse sélectionnée pour la coller par-dessus. Les liens s'ouvrent dans un nouvel onglet ; seules les adresses `http`, `https` et `mailto` deviennent des liens. Une ligne simple reste une ligne simple (le retour à la ligne est conservé).
- **Checklist** : elle apparaît dès qu'elle a un élément, ou au clic sur « Checklist ». Les éléments se rangent par leur poignée (visible au survol), comme les listes du module Profil.
- **Images** : la première image envoyée devient la couverture ; si l'on supprime la couverture, l'image suivante la remplace. Le menu d'une image propose « Utiliser en couverture » ou « Retirer la couverture », et « Supprimer ». Les GIF sont envoyés tels quels (pour garder l'animation) ; une image que le navigateur ne sait pas lire aussi. Les fichiers sont rangés à plat dans le dossier de l'utilisateur (`<id>/<nom au hasard>.<extension>`).
- **Retours du porteur du projet** (2026-10-14, après essai) : seconde colonne et barre latérale à 220 px retirées au profit de la liste déroulante sur le nom ; compteur « 3 / 5 · 60 % » de la checklist retiré de la fenêtre (la pastille « 3/5 » reste sur la carte) ; bouton « Copier le lien » retiré (l'adresse `?card=<id>` ouvre toujours la carte). Puis : nombres de cartes retirés de la liste déroulante et des titres de listes, « 4 / 5 » retiré de « Ajouter une liste » (notification à la cinquième liste), pourcentage seul ajouté au-dessus de la checklist.

## Décisions à valider

Choix pris le 2026-10-14 sans le porteur du projet, à sa demande, pour qu'il change ce qui ne lui convient pas :

1. **Roadmap** : les Tableaux passent en étape 3, avant les Rendez-vous (étape 4).
2. **Nom** : « Tableaux » dans l'interface, « Mes tableaux » dans la barre latérale, `boards` dans le code et les adresses (`/app/boards`).
3. **10 tableaux** au plus par compte ; trois listes de départ (« À faire », « En cours », « Terminé ») ; le dernier tableau consulté se rouvre.
4. Autres plafonds : 20 éléments de checklist, 5 images de 5 Mo par carte, description de 10 000 caractères.
5. **Description** : Markdown léger (gras, italique, listes, liens). **Entrée enregistre, Maj+Entrée va à la ligne**, Échap annule, un clic à côté enregistre.
6. **Une seule checklist** par carte, sans nom.
7. **Images** : galerie de la carte, la première en couverture.
8. **Enregistrement au fil de l'eau** dans la fenêtre de la carte, sans bouton « Enregistrer » global.
9. **Étiquettes et échéances**, prévues jusqu'ici au MVP, passent **plus tard** : elles n'étaient pas dans la demande.
10. **Lien vers une carte** (`?card=<id>`), sans bouton « Copier le lien » (retiré le 2026-10-14).
11. **Images privées** : compartiment `board-images` fermé, affichage par adresses temporaires.
12. ~~Barre latérale à 220 px~~ : sans objet depuis le retrait de la seconde colonne (2026-10-14).

Validé par le porteur du projet le 2026-10-14 : tableaux uniquement privés, sans commentaires ; maquettes « Tableau » et « Carte ouverte » (voir *Maquettes*).

## Hors périmètre (plus tard)

- Étiquettes, échéances.
- Archivage des cartes et des listes, corbeille, historique des modifications.
- Plusieurs checklists par carte, pièces jointes autres que des images (reliées au Drive).
- Recherche et filtres, modèles de tableaux, fonds personnalisés.
- Résumé de l'activité dans le tableau de bord.
- Version mobile de l'espace privé (voir [product.md](product.md), *Plateforme*).

## Écarté

Le 2026-10-14, après une première version de la fiche :
- **tableaux publics** sur le profil public, ouverts aux visiteurs (ajout et modification de cartes après avoir donné leur prénom et leur nom), et tout ce qui allait avec : onglet « Tableaux » de la page publique, identité des visiteurs, limites contre le spam ;
- **commentaires** : l'utilisateur est seul sur ses tableaux, ils n'ont pas d'intérêt ;
- collaboration de plusieurs utilisateurs sur un même tableau.
