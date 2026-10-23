# Authentification

Spécification de l'authentification, première brique de l'étape 1 (voir [product.md](product.md), *Roadmap*).
Statut : **développée** (branche `feat/auth`, 2026-10-11). Écarts avec le cadrage initial signalés dans le texte (e-mails par défaut de Supabase, liens à ouvrir dans le même navigateur).

## En bref

- Toute l'application est privée : il faut être connecté pour y accéder. La page d'entrée est la **connexion**.
- Deux façons de créer un compte et de se connecter : **Google**, ou **e-mail et mot de passe** (avec confirmation de l'e-mail).
- Option « Rester connecté », mot de passe oublié, déconnexion.
- Une fois connecté, une interface minimale : une barre latérale avec le logo, les liens « Tableau de bord » et « Mon profil » (provisoires) et, en bas, le menu du profil.
- Tout repose sur **Supabase Auth** : comptes, mots de passe, sessions, envoi des e-mails.

## Accès aux pages

| Visiteur | Page demandée | Résultat |
|---|---|---|
| Non connecté | Une page de l'espace privé (`/app/…`) | Redirigé vers la connexion, puis ramené à la page demandée une fois connecté |
| Non connecté | Une page d'authentification | Affichée |
| Connecté | Connexion ou inscription | Redirigé vers l'accueil de l'application |
| Connecté, sans abonnement en cours | Une page de l'espace privé | Redirigé vers « Choisissez votre formule » (`/app/subscribe`, [billing.md](billing.md)) |

- Restent publiques : les pages d'authentification, le **profil public** `/<identifiant>` (c'est sa raison d'être ; règles d'accès dans [public-profile.md](public-profile.md)) et la landing page `/` ([landing.md](landing.md)).
- La vitrine `/design` reste accessible sans connexion, en local uniquement.

## Parcours

### Connexion (page d'entrée)

- Bouton **Continuer avec Google**.
- Ou : e-mail, mot de passe (avec un bouton afficher / masquer), case **Rester connecté** (cochée par défaut), lien **Mot de passe oublié ?**, bouton **Se connecter**.
- Lien vers l'inscription : « Pas encore de compte ? Créer un compte ».
- Erreurs :
  - identifiants faux : un seul message, « E-mail ou mot de passe incorrect », qui ne révèle pas si le compte existe ;
  - e-mail pas encore confirmé : message, et bouton pour renvoyer l'e-mail de confirmation ;
  - trop de tentatives : « Trop de tentatives, réessayez dans quelques minutes ».

### Inscription

- Bouton **Continuer avec Google**.
- Ou : e-mail et mot de passe, bouton **Créer mon compte**. Mot de passe de 8 caractères minimum, sans autre règle. Le bouton afficher / masquer remplace le second champ « confirmer le mot de passe ».
- Après l'envoi : écran « Vérifiez votre boîte mail », avec un bouton pour renvoyer l'e-mail.
- Le lien de l'e-mail confirme l'adresse, connecte l'utilisateur et l'amène dans l'application. Il expire au bout d'une heure.
- Adresse déjà inscrite : le même écran « Vérifiez votre boîte mail ». C'est le comportement de Supabase, qui évite de révéler quelles adresses ont un compte.
- Lien vers la connexion : « Déjà un compte ? Se connecter ».

### Connexion avec Google

- Au premier passage, le compte est créé directement, sans e-mail de confirmation : Google a déjà vérifié l'adresse.
- Si un compte e-mail et mot de passe existe déjà avec la même adresse (confirmée), Supabase relie les deux : c'est le même compte, accessible des deux façons.
- La case « Rester connecté » s'applique aussi. Depuis la page d'inscription, qui n'a pas cette case, la valeur par défaut s'applique : rester connecté.

### Mot de passe oublié

1. L'utilisateur saisit son e-mail. Message neutre : « Si un compte existe pour cette adresse, un e-mail vient d'être envoyé ».
2. Le lien de l'e-mail (valable une heure, utilisable une seule fois) connecte l'utilisateur et ouvre la page **Nouveau mot de passe**. C'est le fonctionnement de Supabase : s'il quitte la page sans changer son mot de passe, il reste connecté (risque faible, il a fallu accéder à sa boîte mail).
3. Une fois le mot de passe enregistré, il arrive dans l'application.

### Lien expiré ou déjà utilisé

- Un lien d'e-mail (confirmation ou réinitialisation) périmé ou déjà utilisé ouvre la page « Ce lien n'est plus valide », avec un bouton pour en recevoir un nouveau.

### Rester connecté

- Case cochée (par défaut) : la session dure **sans limite**, jusqu'à la déconnexion. Elle tombe seulement après 400 jours sans aucune visite.
- Case décochée : la session se termine à la fermeture du navigateur. Limite : un navigateur réglé pour rouvrir les onglets précédents peut la conserver.
- Une déconnexion automatique après une période d'inactivité est possible chez Supabase, mais réservée à l'offre payante.

### Déconnexion

- Depuis le menu du profil : **Se déconnecter**, puis retour à la page de connexion. Seul l'appareil utilisé est déconnecté.

## Interface

Maquettes validées le 2026-10-10, direction « Plaquette » : [Maquettes authentification](https://claude.ai/artifact/Hkcrvz7En247ozg92MhwUC) sur claude.ai, chaque écran en clair et en sombre (réglage « thème »).

| Écran | Maquette (nom de la planche) |
|---|---|
| Connexion | `Main` (A · Connexion) |
| Inscription | `A-Inscription` |
| Page de profil, menu du profil ouvert | `A-Profil` (interactive : clic sur le profil, choix du thème) |
| Mot de passe oublié (formulaire, puis « e-mail envoyé ») | `A-MotDePasseOublie` (réglage « état ») |
| Nouveau mot de passe | `A-NouveauMotDePasse` |
| Vérifiez votre boîte mail | `A-VerifiezBoiteMail` |
| Lien expiré ou déjà utilisé | `A-LienExpire` |
| E-mail de confirmation de l'inscription | `Email-Confirmation` |
| E-mail de réinitialisation du mot de passe | `Email-Reinitialisation` |

Dans les maquettes, l'adresse `ines.robert@exemple.fr` (ou `quentin@exemple.fr`) et l'initiale « Q » sont des exemples.

- **Pages d'authentification** : fond blanc avec la « lumière de studio » en haut, tout est centré dans une colonne d'environ 400 px.
  - En tête : le carré rouge du logo, une étiquette (« Espace privé » ou « Nouveau compte »), le titre en Newsreader (« Connexion » ou « Créer un compte ») et une phrase courte en encre atténuée.
  - Une carte à filet fin contient, dans l'ordre : le bouton **Continuer avec Google** (contour, logo Google, pleine largeur), un séparateur « ou », les champs, puis le bouton rouge (pleine largeur, flèche à droite).
  - Connexion : le lien « Mot de passe oublié ? » est à droite du libellé « Mot de passe » ; la case **Rester connecté** est sur la même ligne que son libellé.
  - Inscription : l'aide « 8 caractères minimum » sous le mot de passe, et sous le bouton la mention « Un e-mail de confirmation vous sera envoyé ».
  - Sous la carte : le lien vers l'autre page (« Pas encore de compte ? Créer un compte » / « Déjà un compte ? Se connecter »).
  - Les écrans complémentaires reprennent ce gabarit, avec sous la carte le lien « Retour à la connexion » :
    - **Mot de passe oublié** : champ e-mail et bouton « Envoyer le lien ». Après l'envoi, le formulaire laisse place à un message d'information (fond `muted`, filet rouge à gauche) : « Si un compte existe pour cette adresse, un e-mail vient de lui être envoyé. Le lien est valable une heure. »
    - **Nouveau mot de passe** : le rappel de l'adresse du compte, un seul champ avec l'aide « 8 caractères minimum », bouton « Enregistrer et me connecter ».
    - **Vérifiez votre boîte mail** : une enveloppe, l'adresse à laquelle le lien a été envoyé, sa durée de validité, puis un bouton secondaire « Renvoyer l'e-mail ». Sous la carte : « Mauvaise adresse ? Recommencer l'inscription ».
  - L'inscription est l'**étape 1 sur 2** (« Nouveau compte · Étape 1 sur 2 ») : au-dessus de la carte, la formule choisie sur la landing page (`/signup?plan=monthly` ou `yearly`, l'annuelle sinon) avec un lien « Changer » ; elle est gardée avec le compte. L'étape 2 est « Choisissez votre formule », puis la page de paiement de Stripe ([billing.md](billing.md)).
    - **Lien expiré** : titre « Ce lien n'est plus valide », champ e-mail et bouton « Recevoir un nouveau lien ».
  - Un seul bouton rouge par écran. En clair et en sombre, et lisibles sur mobile.
- **Coque de l'application**, une fois connecté : une **barre latérale** à gauche, volontairement très simple et non repliable, dans l'esprit de l'application de bureau de Claude. Fond `sidebar`, filet à droite.
  - En haut : le logo MyWork complet.
  - Deux liens pour l'instant : **Tableau de bord** (`/app`, actif seulement sur cette adresse) et **Mon profil** (`/app/profile`), décision du 2026-10-13. Lien actif : fond `sidebar-accent` et trait rouge de 2 px à gauche. Les liens des modules s'ajouteront avec les modules.
  - En bas, sous un filet : le bloc du profil (avatar carré, adresse e-mail, double chevron). Un clic ouvre, juste au-dessus, un menu comme dans l'application de Claude :
    - l'adresse e-mail, en petit ;
    - **Thème** : Clair, Sombre ou Système (par défaut), une coche sur le choix actif. Ce choix pourra plus tard rejoindre les Paramètres ;
    - **Se déconnecter**.
  - Le profil public réorganise ce menu en sous-menus : **Mon profil public** (mise en ligne, copier l'adresse, ouvrir) et **Thème**. Voir [public-profile.md](public-profile.md), *Menu du profil*. Les Paramètres y ajoutent l'entrée **Paramètres**, et le bloc affiche le prénom et le nom à la place de l'e-mail quand ils sont renseignés (voir [settings.md](settings.md)).
- **Avatar** : la photo Google quand elle existe, sinon l'initiale du prénom, ou de l'adresse e-mail.
- **Tableau de bord** : l'accueil de l'espace privé, où l'on arrive après la connexion. Pour l'instant un simple emplacement réservé : l'étiquette « Espace privé », le titre « Tableau de bord » et « Futures informations sur mon espace. ». Il donnera plus tard une vue d'ensemble des modules et du profil.
- **Mon profil** : le futur module Profil (le CV en ligne). Même emplacement réservé, titré « Mon profil », avec « Contenu à venir ».
- Textes en français, en vouvoiement comme le reste de l'interface. Les messages d'erreur de Supabase, en anglais, sont traduits.

## E-mails

Deux e-mails : **confirmation de l'inscription** et **réinitialisation du mot de passe**.

> **Depuis le 2026-10-18, ce sont les modèles MyWork, envoyés par Resend.** Avant, c'étaient les e-mails par défaut de Supabase (en anglais) : l'offre gratuite refuse les modèles personnalisés avec le service d'envoi intégré. Leur lien devait être ouvert dans le navigateur qui avait fait la demande ; celui des modèles MyWork marche partout.

- **Aux couleurs du design system** : logo MyWork, blanc franc et encre, bouton rouge à angles droits pour l'action, filets fins, titre en sérif, beaucoup d'espace. Les messageries imposent quelques adaptations :
  - couleurs écrites en valeurs fixes (hexadécimal), converties depuis les tokens de `src/app/globals.css` : les messageries ne comprennent ni les variables CSS ni le format `oklch` ;
  - polices de secours proches : Georgia pour les titres (à la place de Newsreader), Helvetica ou Arial pour le texte (à la place de Geist), car Gmail et Outlook ne chargent pas les polices web ;
  - logo en image PNG, hébergée sur le site en production ;
  - thème clair par défaut. Le thème sombre dépend de la messagerie (certaines inversent les couleurs d'elles-mêmes).
- Valeurs fixes : encre `#0e0d0c`, rouge `#cd171e`, texte sur rouge `#fcfcfc`, encre atténuée `#656360`, filet `#e2e1df`, fond autour de l'e-mail `#f6f5f4`, alerte (étiquettes « Annulé » des e-mails de rendez-vous, voir [booking.md](booking.md)) `#a3261f`.
- Contenu (maquettes `Email-Confirmation` et `Email-Reinitialisation`) : sur fond gris perle, une carte blanche de 560 px à filet fin. Dedans : le logo, un filet, une étiquette, le titre en Georgia, un paragraphe, le bouton rouge, la durée de validité du lien, puis le lien en clair pour le cas où le bouton ne marche pas. Sous la carte : « MyWork — L'espace tout-en-un des freelances ».
  - Confirmation : objet « Confirmez votre adresse e-mail », bouton « Confirmer mon adresse ».
  - Réinitialisation : objet « Réinitialisez votre mot de passe », bouton « Choisir un nouveau mot de passe ».
- Les modèles HTML sont versionnés dans le dépôt (`supabase/templates/`), déclarés dans `supabase/config.toml` et ajoutés à la vitrine `/design`, pour contrôler leur rendu.
- Le bouton mène à `/auth/confirm?token_hash=…&type=…` : l'application donne à Supabase l'adresse `/auth/confirm` **sans paramètre**, le modèle ajoute le reste (un test unitaire le vérifie).
- **Service d'envoi** : **Resend**, branché à Supabase par SMTP (`smtp.resend.com`, port 465, mot de passe : la clé `RESEND_API_KEY`). Expéditeur « MyWork » (`noreply@hellomywork.com`). 30 e-mails par heure au plus pour tout le site (réglage Supabase `email_sent`). Connexions et inscriptions : 100 toutes les 5 minutes par adresse IP (`sign_in_sign_ups`, relevé de 30 le 2026-10-19 : les tests de bout en bout se connectent plus souvent que cela depuis la seule adresse de GitHub). Chaque envoi se suit dans Resend, *Emails*. Voir [product.md](product.md), *Inventaire technique*.

## Données de l'utilisateur

- **Supabase Auth** conserve l'essentiel dans sa table interne `auth.users` : e-mail, mot de passe (chiffré), méthodes de connexion (e-mail, Google), date de confirmation, dates de création et de dernière connexion. L'application n'y écrit jamais directement.
- **Table `profiles`** de MyWork : une ligne par utilisateur, créée automatiquement à l'inscription. Pour l'instant : identifiant (le même que dans Supabase Auth), **e-mail** (tenu à jour automatiquement), dates de création et de modification. Elle accueillera ensuite les informations propres à MyWork : nom, photo, identifiant du profil public…
- Sécurité (RLS) : chaque utilisateur ne lit et ne modifie que sa propre ligne.
- Google fournit aussi le nom et la photo. Supabase Auth les conserve avec le compte : la photo y est lue pour l'avatar. Le nom est copié dans `profiles` à la création du compte, en prénom et nom, modifiables dans les Paramètres (voir [settings.md](settings.md)).

## Configuration de Google

Fait le 2026-10-11 : projet Google Cloud **MyWork** (`mywork-511308`), client OAuth « MyWork (Supabase) ». Le compte Google doit avoir la validation en deux étapes (exigée par Google Cloud).

Le fournisseur Google est réglé **dans le tableau de bord Supabase** (Authentication › Sign In / Providers › Google), pas dans `supabase/config.toml` : le code secret n'a ainsi jamais à passer par le dépôt ni par une variable d'environnement, et `config push` laisse intact ce que le fichier ne déclare pas. Le code secret se régénère au besoin dans Google Cloud (Clients › MyWork (Supabase)).

1. **Google Cloud** : un projet « MyWork » et, dans *Google Auth Platform* :
   - *Branding* : nom MyWork, e-mail d'assistance. Pas de logo pour l'instant, car il déclencherait une vérification de la marque par Google (plusieurs jours).
   - *Audience* : externe, statut **Testing**, avec son adresse comme utilisateur test. Seuls les utilisateurs test peuvent alors utiliser Google : un verrou bienvenu tant que l'application est personnelle. Sans effet sur la durée de connexion à MyWork.
   - *Data access* : `openid`, `email`, `profile`, qui ne demandent aucune vérification par Google.
   - *Clients* : un client OAuth de type « Application Web ». Origines autorisées : `http://localhost:3000` et `https://linku-nu.vercel.app` (inutiles ici, la connexion passant par Supabase : `https://hellomywork.com` n'y a donc pas été ajoutée). URI de redirection : `https://ulufanywmrporutivwgc.supabase.co/auth/v1/callback`.
2. **Supabase** : activer le fournisseur Google avec l'identifiant et le code secret du client OAuth. Le porteur du projet colle lui-même le code secret (Claude ne saisit jamais de secret). Il n'est jamais écrit dans le dépôt.
3. Limite : l'écran de Google affichera « continuer vers ulufanywmrporutivwgc.supabase.co ». Y afficher MyWork demande un domaine personnalisé chez Supabase, option payante : plus tard.

## Réglages Supabase

| Réglage | Valeur |
|---|---|
| Confirmation de l'e-mail | Activée |
| Longueur minimale du mot de passe | 8 caractères |
| URL du site | `https://hellomywork.com` |
| URL de redirection autorisées | `http://localhost:3000/**`, `https://hellomywork.com/**`, `https://linku-nu.vercel.app/**` et les aperçus Vercel `https://*-mywork-8619.vercel.app/**` |
| Fournisseur Google | Activé |
| Envoi des e-mails | Resend (SMTP), expéditeur « MyWork », 30 par heure |
| Modèles d'e-mails | Ceux de MyWork (`supabase/templates/`) |
| Durée des sessions | Illimitée (réglage par défaut) |

Ces réglages sont versionnés dans `supabase/config.toml` et appliqués au projet en ligne avec `npx supabase config push`, qui affiche les différences et demande confirmation. La clé Resend y est lue depuis la variable `RESEND_API_KEY` : lancer la commande avec les variables de `.env.local` chargées (dans Git Bash : `set -a; . ./.env.local; set +a`).

Le fichier sert aux deux projets : ses réglages sont ceux de la production, et le bloc `[remotes.development]` remplace l'adresse du site et les adresses de retour pour **MyWork Dev** (`localhost` et les aperçus). `config push` s'applique au projet auquel le dossier est relié (MyWork Dev par défaut, voir [AGENTS.md](../AGENTS.md)).

`config push` envoie **tout** le fichier, pas seulement les lignes modifiées. Avant le premier envoi, le fichier (encore aux valeurs par défaut de l'installation) est donc aligné sur les réglages en ligne, pour ne rien écraser par accident ; les changements ci-dessus sont ajoutés ensuite.

## Technique

Pour les agents qui développeront la fonctionnalité.

- Next.js 16 : `src/proxy.ts` (l'ancien `middleware`) rafraîchit la session Supabase à chaque requête et redirige les visiteurs non connectés. Il ne suffit pas : chaque page et chaque action serveur revérifie l'utilisateur. Lire d'abord `node_modules/next/dist/docs/01-app/02-guides/authentication.md` et, `cacheComponents` étant activé, `authentication-with-cache-components.md`.
- Table `profiles` : aucune table n'est exposée à l'API par défaut (décision du 2026-10-07), la migration lui donne donc explicitement accès au rôle `authenticated`.
- « Vérifiez votre boîte mail » remplace le formulaire d'inscription sur la même page : l'adresse (utilisée par « Renvoyer l'e-mail ») reste dans l'état de la page, jamais dans l'URL.
- Routes, en anglais comme le code : `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/link-expired` (lien expiré ou déjà utilisé), `/app` (tableau de bord, l'accueil ; `/` y redirige pour l'instant), `/app/profile` (Mon profil, anciennement `/profile`, qui y renvoie), et deux routes techniques :
  - `/auth/callback` : retour de Google (échange du code contre une session) ;
  - `/auth/confirm` : liens des e-mails. L'application y ajoute `type=signup` ou `type=recovery` pour savoir où aller ensuite. Deux formes acceptées : un `code` (e-mails par défaut de Supabase, à ouvrir dans le même navigateur) ou un `token_hash` (modèles MyWork et tests, valable dans n'importe quel navigateur).
- Ces noms sont interdits comme identifiants du profil public (mots réservés, voir [public-profile.md](public-profile.md)).
- Développement et production partagent le même projet Supabase : les liens des e-mails ramènent vers le site d'où vient la demande (local, aperçu ou production), grâce à l'adresse de redirection transmise par l'application, et non vers l'URL du site.
- Formulaires : Server Actions, validation côté serveur. Le paramètre de retour (`next`) n'accepte que des chemins internes, jamais un autre site.
- Rester connecté : la préférence est gardée dans un petit cookie. Quand elle est désactivée, les cookies de session Supabase sont écrits sans date d'expiration.
- Base de données : première migration dans `supabase/migrations/` : table `profiles`, politiques RLS, déclencheurs (création à l'inscription, mise à jour de l'e-mail).
- Tests : mise en place de Vitest et Playwright dans cette itération, lancés par GitHub à chaque modification.
  - Bout en bout : redirection d'un visiteur non connecté, connexion et déconnexion, erreurs de connexion, rester connecté, inscription, mot de passe oublié.
  - Les tests ne lisent pas de boîte mail : les liens de confirmation et de réinitialisation sont générés par l'API d'administration de Supabase, qui crée aussi les comptes de test.
  - Les tests tournent sur la base en ligne : comptes de test à adresse reconnaissable, supprimés à la fin de chaque exécution. Il faut pour cela la clé secrète Supabase, uniquement dans `.env.local` et dans les secrets GitHub, jamais côté navigateur.
  - Aucun test automatique n'envoie d'e-mail : un envoi est refusé pour une adresse hors équipe, et le quota de 2 par heure est partagé avec l'usage réel du porteur du projet. En attendant Resend, les trois parcours qui envoient un e-mail (inscription, mot de passe oublié, renvoi de l'e-mail de confirmation) sont couverts par des tests unitaires (Vitest, Supabase simulé). Le bout en bout vérifie les formulaires sans les envoyer, puis reprend le parcours à partir d'un lien généré par l'API d'administration (confirmation d'un compte non confirmé, nouveau mot de passe).
  - « Trop de tentatives » : test unitaire uniquement (le provoquer pour de vrai épuiserait les limites de Supabase).
  - GitHub : l'application est construite et lancée dans le workflow ; il lui faut trois secrets (adresse Supabase, clé publique, clé secrète).
  - Le bouton Google n'est pas testé automatiquement : vérification manuelle.

## Mise en œuvre

Ordre proposé pour la session de développement, sur une branche, avec une pull request et son URL d'aperçu Vercel :

1. Tests : installer Vitest et Playwright, et le workflow GitHub qui les lance.
2. Base de données : migration `profiles` (RLS, déclencheurs). Réglages Supabase dans `supabase/config.toml`, appliqués avec `npx supabase config push`.
3. Parcours e-mail et mot de passe : proxy, pages, formulaires, « Rester connecté », mot de passe oublié, lien expiré.
4. Coque : barre latérale, menu du profil, page de profil.
5. E-mails : modèles HTML, ajoutés à la vitrine `/design`.
6. Google : configuration dans Chrome, puis bouton « Continuer avec Google ».
7. Tests de bout en bout ; vérification en clair et en sombre, et sur mobile.

Ce qui revient au porteur du projet :
- coller le code secret Google dans Supabase ;
- copier la clé secrète Supabase (nécessaire aux tests) dans `.env.local` et dans les secrets GitHub ;
- valider les changements de réglages Supabase que `config push` affiche.

## Hors périmètre (plus tard)

- Landing page publique.
- Changer d'e-mail ou de mot de passe, gérer les méthodes de connexion : dans les Paramètres, plus tard (avec Resend pour l'e-mail). La suppression du compte (obligation RGPD avant l'ouverture SaaS) y est déjà : voir [settings.md](settings.md).
- Domaine personnalisé Supabase et logo sur l'écran de Google.
- Protection contre les robots (captcha) à l'inscription, avant l'ouverture SaaS.
- Autres méthodes : autres fournisseurs (Apple, LinkedIn…), lien magique, double authentification, passkeys.
- Déconnexion de tous les appareils ; détection des mots de passe compromis (offre payante de Supabase).

## Questions ouvertes

Aucune.
