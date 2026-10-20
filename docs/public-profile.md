# Profil public

Spécification du squelette du profil public, qui fait partie de l'étape 1 (voir [product.md](product.md), *Roadmap*).
Statut : **développé** et en production (pull request #4, 2026-10-12). Copie claude.ai du design system resynchronisée (nouvel interrupteur).

Le squelette prépare la partie publique de tous les modules : l'adresse, la mise en page, l'accès sans connexion, la mise en ligne. Le contenu arrivera avec les modules (voir [modules.md](modules.md)).

## En bref

- Chaque utilisateur a un profil public à l'adresse `<domaine>/<identifiant>`. L'espace privé passe sous `/app`.
- L'identifiant est généré à la création du compte, au format `prenom-nom`. Il est modifiable dans les Paramètres, sous le nom « Adresse de mon profil public » ([settings.md](settings.md)).
- Le profil est **hors ligne par défaut**. On le met en ligne depuis le menu du profil. Hors ligne, les visiteurs tombent sur une page introuvable ; le propriétaire, lui, voit un aperçu.
- La page publique **ignore la connexion** : un nouvel onglet suffit pour voir son profil exactement comme un visiteur.
- Mise en page **« Onglets »** : un en-tête, puis un onglet par module, chacun avec sa propre adresse. Pensée d'abord pour le mobile.

## Adresses

| Adresse | Rôle |
|---|---|
| `/<identifiant>` | Profil public, accessible sans connexion |
| `/<identifiant>/…` | Pages publiques des modules : une par onglet (rendez-vous, ressources…) |
| `/app/…` | Espace privé, connexion obligatoire. `/app` est le tableau de bord (l'accueil) ; la page « Mon profil », anciennement `/profile`, est `/app/profile`. |
| `/login`, `/signup`… | Authentification, inchangée (voir [auth.md](auth.md)) |
| `/` | La landing page ([landing.md](landing.md)), publique, pour les visiteurs comme pour les connectés. |
| `/profile` | Ancienne adresse de la page « Mon profil » : renvoie vers `/app/profile`. |

- L'adresse suffit à savoir où l'on est : `/app` est privé, le reste est public. Les noms des modules ne peuvent donc pas entrer en conflit avec un identifiant.
- Une adresse écrite avec des majuscules (`/Ines-Robert`) est ramenée en minuscules.
- Plus tard, un sous-domaine (`<identifiant>.<domaine>`) ou un domaine personnel pourra renvoyer vers ces mêmes pages, sans les refaire.
- Noms des sous-pages des modules : en anglais, comme les autres routes (`/cv`, `/resources`, plus tard `/booking`) (décision du 2026-10-15, avec le Drive, voir [drive.md](drive.md)).

## Accès aux pages

| Visiteur | Page demandée | Résultat |
|---|---|---|
| N'importe qui | `/<identifiant>` d'un profil en ligne | La page publique |
| N'importe qui, sauf le propriétaire | `/<identifiant>` d'un profil hors ligne | Page introuvable (code 200, voir ci-dessous) |
| Le propriétaire, connecté | Son propre profil, hors ligne | Un aperçu, avec le bandeau « Hors ligne » |
| N'importe qui | `/<identifiant>` inconnu | Page introuvable (code 200, voir ci-dessous) |
| Non connecté | Une page de l'espace privé (`/app/…`) | Redirigé vers la connexion |

- Les sous-pages `/<identifiant>/…` suivent les mêmes règles.
- Un profil hors ligne et un identifiant inconnu donnent exactement la même page : rien ne révèle qu'un compte existe.
- **Code de réponse** : la « Page introuvable » d'un profil (hors ligne ou inconnu) répond avec le **code 200**, pas 404. Ce n'est pas un choix : en production, Next.js commence à envoyer la page avant de savoir si le profil existe, et le code part avec ce début. Next.js ajoute alors la mention « ne pas indexer » (`noindex`), comme il le ferait pour un 404.
  - Pour le visiteur, rien ne change : il voit « Page introuvable ».
  - Pour les moteurs de recherche, l'effet est le même qu'un 404 : la page n'est pas indexée. C'est voulu pour un profil hors ligne. Une fois en ligne, il répond avec la vraie page (code 200, sans « Page introuvable »), et les moteurs le reprennent à leur prochain passage : ni un 404, ni ce 200 ne le pénalisent durablement. Aujourd'hui, de toute façon, aucune page publique n'est indexée (`noindex` tant qu'elles sont vides).
  - Les autres adresses inconnues (sous-page de profil inexistante, `/app/…`) répondent bien 404.
  - Un vrai 404 pour les profils demanderait une lecture de la base à chaque visite dans `src/proxy.ts` (voir *Technique*) : à revoir avec le référencement, si besoin.

## Identifiant public

- Généré à la création du compte : à partir du nom Google, au format `prenom-nom` (« Inès Robert » → `ines-robert`), sinon à partir du début de l'adresse e-mail (`ines.robert@exemple.fr` → `ines-robert`).
- Format : lettres minuscules sans accents, chiffres et tirets, de 3 à 30 caractères, sans tiret au début ni à la fin. Unique.
- Fabrication : accents retirés, minuscules, tout ce qui n'est ni lettre ni chiffre devient un tiret. Dans l'adresse e-mail, on ignore ce qui suit un « + » (`jean+test@…` → `jean`).
- Cas limites (validés le 2026-10-12) :
  - nom trop court (moins de 3 caractères) ou sans lettres latines : on passe à l'adresse e-mail, sinon `profil` ;
  - plus de 30 caractères : coupé entre deux mots.
- S'il est déjà pris ou réservé, on ajoute `-2`, `-3`… (`ines-robert-2`).
- Mots réservés : les adresses de l'application (`app`, `login`, `signup`, `auth`, `design`…, l'ancienne `profile`, les fichiers servis à la racine comme `brand` ou `icon`) et quelques noms génériques (`admin`, `api`, `help`, `settings`…).
- Les comptes existants reçoivent le leur lors de la mise en place. Celui du porteur du projet (son compte Google) est tiré de son nom Google ; il peut le corriger dans les Paramètres.
- Modifiable dans les Paramètres, sans redirection depuis l'ancien (voir [settings.md](settings.md)).

## En ligne ou hors ligne

- Un interrupteur, dans le menu du profil (voir *Interface*) : « Profil en ligne » ou « Profil hors ligne ». **Hors ligne par défaut**, pour qu'aucun profil vide ou inachevé ne soit visible.
- Hors ligne :
  - les visiteurs tombent sur une page introuvable ;
  - le propriétaire connecté voit quand même sa page, avec le bandeau « Hors ligne ». Il peut ainsi préparer son profil avant de le publier.
- En ligne, la vue est stricte : identique pour tous, propriétaire compris, sans bandeau.
- L'interrupteur s'ajoute à la visibilité de chaque élément (privé ou public, voir [product.md](product.md), *Principes transverses*) : un élément public n'est visible que si le profil est en ligne.
- Pour voir son profil comme un visiteur, un nouvel onglet suffit : pas besoin de navigation privée. Pour revenir à l'espace privé, on ferme l'onglet.

## Interface

Maquettes validées le 2026-10-12, direction **« Onglets »** : [Maquettes profil public](https://claude.ai/artifact/XmfpRWfmpH1FqnzEgksuEc) sur claude.ai, chaque planche en clair et en sombre (réglage « thème »).

| Écran | Maquette (nom de la planche) |
|---|---|
| Page publique sur ordinateur | `Page publique — ordinateur` : réglages « état » (en ligne, hors ligne, introuvable) et « contenu » (squelette, ou avec modules) ; onglets cliquables |
| Page publique sur mobile | `Page publique — mobile` : mêmes réglages |
| Menu du profil et ses sous-menus | `Espace privé — menu du profil` : interactive (sous-menus, interrupteur, copier) ; réglage « interrupteur » : rouge (retenu) ou encre |

Dans les maquettes, Inès Robert (`ines-robert`) est un personnage fictif, et `linku-nu.vercel.app` l'adresse de la production à l'époque (aujourd'hui `hellomywork.com`). Le réglage « avec modules » illustre le cadre une fois les modules arrivés : les cadres en pointillés marquent leurs emplacements.

Écartées : « Colonne » (une seule page étroite qui défile, les modules les uns sous les autres) et « Sommaire » (une couverture façon magazine, puis une tuile par module).

### Page publique

- Distincte de l'espace privé : ni barre latérale, ni menu du profil. Pensée d'abord pour le mobile, dans le thème du visiteur : celui choisi dans le menu du profil s'il y en a un dans ce navigateur, sinon celui du système. Contenu dans une colonne de 1080 px au plus.
- **En-tête**, avec la lumière de studio et un filet en bas :
  - une photo carrée, une étiquette (le titre professionnel) et le nom en grand (Newsreader, 72 px sur ordinateur, 40 px sur mobile) ;
  - à droite (dessous sur mobile), le bouton rouge de l'action principale, par exemple « Prendre rendez-vous » ;
  - des **onglets** : « Profil » (le module Profil, voir [modules.md](modules.md)), puis un onglet par autre module public (Rendez-vous, Ressources pour les fichiers publics du Drive ; le module Tableaux est privé depuis le 2026-10-14). Onglet actif : texte à l'encre et trait rouge dessous. Sur mobile, les onglets défilent horizontalement.
- Chaque onglet est une page, avec sa propre adresse : `/<identifiant>` pour « Profil », `/<identifiant>/<module>` pour les autres.
- **Pied de page**, sous un filet : « Créé avec » et le logo MyWork. « Créé avec MyWork » est un lien vers la landing page (depuis le 2026-10-19).
- **Pour l'instant (squelette)** : l'en-tête montre seulement l'étiquette « Espace public » et le titre « Page de profil », sans photo, bouton ni onglets ; dessous, « Contenu à venir. ». Photo, nom, bouton et onglets arriveront avec les modules.
- **Bandeau « Hors ligne »** (aperçu du propriétaire) : une bande à l'encre en haut de la page (fond `foreground`, texte `background`), avec une icône d'œil barré, « Hors ligne », puis « Vous seul voyez cette page. ».
- **Page introuvable (404)** : même gabarit, étiquette « Erreur 404 », titre « Page introuvable », puis « Cette adresse ne correspond à aucun profil public. Vérifiez le lien, ou demandez-le à la personne qui vous l'a envoyé. »
- **Les autres adresses inconnues** (`/app/nimporte-quoi`, une sous-page de profil qui n'existe pas, `/design` en production) prennent le même gabarit, avec « Cette adresse ne correspond à aucune page. Vérifiez le lien, ou demandez-le à la personne qui vous l'a envoyé. » Elles remplacent la page 404 par défaut de Next.js, en anglais.
- Titre de l'onglet du navigateur et aperçu au partage du lien (Open Graph) provisoires, enrichis avec le module Profil : `ines-robert · MyWork` pour un profil, `Page introuvable · MyWork` pour la 404, et l'image de partage de MyWork (fond noir, logo).
- Pas de référencement par les moteurs de recherche (`noindex`) tant que la page est vide.

### Menu du profil

Dans l'espace privé, la barre latérale ne change pas : ni adresse, ni état, ni lien au-dessus du bloc du profil. Tout passe par le menu que ce bloc ouvre, réorganisé en sous-menus pour rester compact.

- Menu, une ligne par entrée, sans valeur affichée, une flèche à droite des entrées qui ouvrent un sous-menu :
  - l'adresse e-mail, en petit ;
  - **Mon profil public ›** ;
  - **Paramètres**, qui ouvre la fenêtre des Paramètres (ajouté le 2026-10-12, voir [settings.md](settings.md)) ;
  - **Thème ›** ;
  - **Se déconnecter**.
- Les sous-menus s'ouvrent à droite, au survol ou au clic. Textes alignés à gauche, icônes à droite.
  - **Mon profil public** :
    - l'interrupteur, sur une ligne : « Profil en ligne » ou « Profil hors ligne » selon l'état ; un clic n'importe où sur la ligne le bascule, tout de suite, sans confirmation. Le menu reste ouvert, pour qu'on voie le libellé changer. Une notification le confirme (« Profil mis en ligne », « Profil mis hors ligne »). En cas d'erreur, l'interrupteur revient à son état précédent et un message s'affiche ;
    - **Copier l'adresse** (icône copier) : copie l'adresse complète du profil public, sur le site où l'on se trouve (local, aperçu ou production) ; la ligne affiche un instant « Adresse copiée » avec une coche ;
    - **Ouvrir mon profil public** (icône « nouvel onglet ») : ouvre le profil dans un nouvel onglet.
  - **Thème** : Clair, Sombre, Système. Une coche juste après le libellé du choix actif ; l'icône (soleil, lune, écran) à droite.

### Interrupteur

- Redessiné pour être lisible : désactivé, fond gris pâle et rond gris à gauche ; activé, fond rouge (`primary`) et rond blanc à droite.
- **Arrondi**, comme dans la maquette : piste en pilule et rond qui glisse. C'est une exception à la règle des angles droits, ajoutée au design system le 2026-10-12, et elle vaut pour tous les interrupteurs de l'application.
- Il remplace le `Switch` actuel du design system, à l'encre, jugé peu clair (voir [design-system.md](design-system.md)). Le vert (`success`) a été écarté : un profil en ligne n'est pas un succès, et le rouge rappelle la couleur principale.

## Données

- Table `profiles` : deux colonnes en plus, l'identifiant public (unique) et l'état en ligne (faux par défaut).
- **Tout se passe dans la base** (décision du 2026-10-12) : l'identifiant est fabriqué avec le profil, par le déclencheur qui existe déjà à l'inscription, quel que soit le chemin (Google ou e-mail). Le nom Google se lit dans les données du compte que Supabase Auth reçoit de Google. Une migration complète les comptes existants, du plus ancien au plus récent.
- Mots réservés : une table de la base (`reserved_handles`), seule liste, lue par la fabrication de l'identifiant et par les Paramètres (un déclencheur refuse un mot réservé choisi par l'utilisateur).
- Seul l'utilisateur peut changer l'état de son profil (RLS).
- Lecture publique : un accès dédié, ouvert aux visiteurs anonymes (rôle `anon`), qui ne renvoie que le strict nécessaire pour les profils en ligne (l'identifiant, puis les blocs publics des modules). Jamais l'adresse e-mail. Aucune table n'étant exposée par défaut (décision du 2026-10-07), cet accès est ouvert explicitement dans la migration.

## Technique

Pour les agents qui développeront la fonctionnalité.

- Lire d'abord les guides Next.js 16 concernés, dans `node_modules/next/dist/docs/01-app/` : `03-api-reference/03-file-conventions/dynamic-routes.md` et `not-found.md`, `02-guides/public-static-pages.md`, `multi-tenant.md` et, `cacheComponents` étant activé, `authentication-with-cache-components.md`.
- Une route dynamique pour l'identifiant, à la racine de l'application. Les routes fixes (`/app`, `/login`, `/auth`…) passent avant elle.
- Espace privé déplacé sous `/app` : `HOME_PATH`, liens, tests de bout en bout. `/` y renvoie toujours.
- `src/proxy.ts` : la règle devient « `/app` est privé, le reste est public » ; les pages d'authentification gardent leurs règles.
- **La page publique ignore la connexion** : elle lit toujours les données comme un visiteur anonyme, même quand le propriétaire est connecté. Ce que voit le propriétaire est donc exactement ce que voient ses visiteurs. Et la page ne peut pas afficher une donnée privée par erreur, car la base la refuserait. Seule exception, l'aperçu hors ligne : quand le profil est hors ligne, la page vérifie si le visiteur en est le propriétaire, et lui montre le même contenu que verront les visiteurs une fois le profil en ligne.
- Identiques pour tous, les pages publiques peuvent être mises en cache. Le cache est renouvelé quand le propriétaire change son profil (mise en ligne, identifiant…).
  - Pour le squelette, **pas de cache côté serveur** : celui de Next.js par défaut est propre à chaque instance de Vercel, et une mise en ligne pourrait n'apparaître qu'après un délai, ou l'aperçu « Hors ligne » persister. Une seule lecture légère de la base par visite ; à reprendre avec le contenu (module Profil), par exemple avec `use cache: remote`.
  - Un profil hors ligne et un identifiant inconnu passent par le même chemin : même page, même code, rien ne trahit l'existence d'un compte.
  - Code de réponse 200 de la « Page introuvable » d'un profil, en production : voir *Accès aux pages*. C'est le comportement documenté de Next.js pour une page envoyée au fil de l'eau (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`, *Status codes*). En développement, le code est 404 : les tests vérifient seulement que la réponse est la même pour un profil hors ligne et un identifiant inconnu.
- Mots réservés : une seule liste, dans la base (voir *Données*). Un test vérifie que chaque adresse de premier niveau de l'application y figure : dossiers de `src/app/` (y compris ceux rangés dans un groupe comme `(auth)`), fichiers servis à la racine (`icon.svg`, `opengraph-image.png`…) et dossiers de `public/`.
- « Copier l'adresse » utilise le presse-papiers du navigateur.
- Interrupteur : adapter `src/components/ui/switch.tsx`, puis la vitrine `/design` et la copie claude.ai du design system.

## Tests

- Bout en bout :
  - un visiteur non connecté voit un profil en ligne ;
  - « Page introuvable », identique, pour un identifiant inconnu et pour un profil hors ligne ;
  - aperçu avec bandeau pour le propriétaire d'un profil hors ligne ;
  - le sous-menu « Mon profil public » : interrupteur, copier l'adresse, ouvrir ;
  - le sous-menu « Thème » ;
  - l'espace privé (`/app/…`) reste fermé aux visiteurs.
- Fabrication de l'identifiant (accents, doublons, mots réservés, nom absent, nom trop court, nom trop long) et liste des mots réservés : testées sur la base en ligne avec des comptes de test, dans la suite de bout en bout, puisque tout se passe dans la base.
- Unitaires : format d'un identifiant, règles d'accès des adresses.

## Mise en œuvre

Fait le 2026-10-12, dans cet ordre :

1. Maquettes : fait, validées le 2026-10-12.
2. Déplacement de l'espace privé sous `/app`, et règles d'accès.
3. Base de données : identifiant et état en ligne dans `profiles`, génération de l'identifiant (comptes existants compris), accès public dédié.
4. Page publique et sa mise en page, 404, aperçu hors ligne.
5. Menu du profil : sous-menus « Mon profil public » et « Thème ». Nouvel interrupteur, vitrine `/design` et copie claude.ai mises à jour.
6. Tests ; vérification en clair et en sombre, et sur mobile.

## Ce que le squelette fournit aux modules

- Un onglet et une sous-page `/<identifiant>/<module>` par module public, avec la même mise en page et les mêmes règles (404 hors ligne, aperçu du propriétaire).
- L'onglet « Profil » (`/<identifiant>`), page d'accueil du profil : il accueille le module Profil. Les autres modules pourront peut-être y ajouter un aperçu de leur contenu (à décider).

## Hors périmètre (plus tard)

- Redirection depuis l'ancien identifiant, après un changement dans les Paramètres : écartée le 2026-10-12 (voir [settings.md](settings.md)).
- Référencement par les moteurs de recherche, avec le contenu et le nom de domaine.
- Sous-domaine par utilisateur et domaine personnalisé.
- Thèmes du profil, statistiques de visites.
