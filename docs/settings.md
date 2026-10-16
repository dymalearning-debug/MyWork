# Paramètres

Spécification des Paramètres, qui font partie de l'étape 1 (voir [product.md](product.md), *Roadmap*).
Statut : **développés** (2026-10-12), directement sur `main`.

## En bref

- Une entrée **Paramètres** dans le menu du profil, entre « Mon profil public › » et « Thème › ». Elle ouvre une grande fenêtre de dialogue au milieu de l'écran, comme dans l'application de bureau de Claude : les sections à gauche, la page à droite.
- Une seule section pour l'instant, **Profil** : prénom, nom, adresse e-mail (non modifiable pour l'instant), adresse du profil public, et le bouton « Supprimer le compte ».
- Un seul bouton **Enregistrer**, en bas de la fenêtre, pour tout ce qu'elle contient ; **Annuler** ferme sans enregistrer.
- Chaque action sur le compte est confirmée par une **notification en bas à droite**, qui dit ce qui a été fait.
- Plus tard, d'autres sections : abonnement, réglages des modules.

## Interface

Maquettes validées le 2026-10-12 : [Maquettes paramètres](https://claude.ai/artifact/GyHpFTDTANaj6TyBv9Awwm) sur claude.ai. En haut, un prototype cliquable ; en dessous, une planche par état (réglages « thème » et « compte » : Google ou e-mail).

- **Menu du profil** : « Paramètres » (icône d'engrenage), sans sous-menu. Un clic ferme le menu et ouvre la fenêtre.
- **Bloc du profil**, en bas de la barre latérale : le prénom et le nom, ou l'adresse e-mail quand ils sont vides. L'adresse e-mail reste en tête du menu. Initiale de l'avatar (sans photo Google) : celle du prénom, sinon de l'e-mail.
- **Fenêtre** : 960 × 680 px au plus. À gauche, le titre « Paramètres » et les sections (lien actif comme dans la barre latérale : fond `sidebar-accent`, trait rouge). En haut à droite, la croix.
- **Page Profil**, d'une traite, sans catégories ni texte d'aide :
  - Prénom et Nom côte à côte, facultatifs ;
  - Adresse e-mail, grisée ;
  - un filet, puis **Adresse de mon profil public**, avec une icône « ? » : au survol, l'infobulle « L'adresse de la page que vous partagez avec vos clients et recruteurs. ». Le champ est précédé de l'adresse du site (`linku-nu.vercel.app/`, ou celle du site où l'on est) ;
  - tout en bas, à gauche, le bouton « Supprimer le compte » (variante `destructive`).
- **Pied de la fenêtre** : « Modifications non enregistrées » (pastille `warning`) dès qu'un champ change, puis « Annuler » et « Enregistrer » (le bouton rouge de l'écran).

## Parcours

### Enregistrer, annuler, fermer

- « Enregistrer » n'est actif que si un champ a changé et que l'adresse du profil public est valable. Il enregistre tout, ferme la fenêtre et affiche la notification « Paramètres enregistrés », avec ce qui a changé (« Prénom et nom modifiés. », « Adresse du profil public modifiée. »…).
- « Annuler » ferme tout de suite, sans enregistrer.
- La croix, la touche Échap ou un clic à côté : si des modifications ne sont pas enregistrées, la question « Enregistrer les modifications ? » s'affiche, avec « Ignorer les modifications » et « Enregistrer ». Sinon, la fenêtre se ferme.
- À chaque ouverture, la fenêtre repart des valeurs enregistrées.

### Prénom et nom

- Facultatifs, 100 caractères au plus, espaces autour retirés.
- **Remplis à la création du compte avec Google** : `given_name` et `family_name` quand Google les donne, sinon le premier mot du nom complet pour le prénom et le reste pour le nom (« Jean-Pierre Dupont » donne « Jean-Pierre » et « Dupont »). Vides pour un compte créé avec un e-mail. Les comptes existants ont été complétés de la même façon.
- Changer de nom ne change pas l'adresse du profil public.

### Adresse e-mail

- Affichée, **non modifiable pour l'instant** (décision du 2026-10-12). Un changement devra être confirmé par un e-mail, ce que le service d'envoi actuel ne permet pas : il n'écrit qu'aux membres de l'équipe Supabase (voir [auth.md](auth.md), *E-mails*). À reprendre avec Resend.

### Adresse du profil public

- C'est l'identifiant du profil public (voir [public-profile.md](public-profile.md), *Identifiant public*) : mêmes règles, unique dans toute l'application, jamais un mot réservé.
- Les majuscules sont converties en minuscules pendant la frappe.
- Vérification pendant la frappe, un court instant après la dernière touche : « Vérification… », puis « Disponible », « Cette adresse n'est pas disponible. » (déjà prise ou réservée, un seul message), ou la règle de format en cas d'erreur (« 3 à 30 caractères : lettres minuscules sans accents, chiffres et tirets, sans tiret au début ni à la fin. »). La base revérifie à l'enregistrement.
- Quand elle est disponible, un message prévient que l'ancienne adresse ne fonctionnera plus.
- **Pas de redirection** depuis l'ancienne adresse (décision du 2026-10-12) : les liens déjà partagés mènent à « Page introuvable », et l'ancienne adresse redevient libre. On ne la change en principe qu'une fois, au début.

### Supprimer le compte

1. « Supprimer le compte » ouvre une confirmation : étiquette « Action irréversible », « Supprimer votre compte ? », et l'avertissement que toutes les données liées au compte seront supprimées définitivement. Boutons « Annuler » et « Supprimer définitivement ».
2. Le compte est supprimé avec tout ce qui lui est lié, puis l'appareil est déconnecté.
3. Retour à la page de connexion, avec la notification « Compte supprimé ».

## Notifications

- **En bas à droite** de l'écran (Sonner, déjà en place), après chaque action sur le compte : enregistrement des Paramètres, mise en ligne ou hors ligne du profil (« Profil mis en ligne », « Profil mis hors ligne »), suppression du compte. Plus tard : abonnement, actions des modules.
- Un titre court au passé, et le détail en dessous. Une erreur dit quoi faire (« Réessayez. »).

## Données

- Table `profiles` : deux colonnes en plus, `first_name` et `last_name` (vides possibles, 100 caractères au plus).
- Les utilisateurs peuvent modifier leurs nom, prénom, adresse du profil public et état en ligne, sur leur seule ligne (RLS).
- Adresse du profil public : le format et l'unicité sont des contraintes de la table ; un déclencheur refuse les mots réservés, que les utilisateurs ne peuvent pas lire. La vérification pendant la frappe passe par une fonction de la base (`is_handle_available`).
- Suppression du compte : une fonction de la base (`delete_own_account`) supprime le compte de l'utilisateur connecté dans Supabase Auth. Le profil, les sessions et les méthodes de connexion partent avec lui (suppression en cascade). La clé secrète Supabase reste réservée aux tests. Les fichiers stockés (images du profil et des tableaux, fichiers du Drive) sont retirés juste avant, par l'application : la cascade de la base ne vide pas le stockage.

## Technique

- Fenêtre : `src/app/app/_components/settings-dialog.tsx`, ouverte depuis le menu du profil (`user-menu.tsx`). Composant `Dialog` du design system ; les deux questions sont des dialogues imbriqués.
- Actions serveur dans `src/app/app/actions.ts` : `saveProfileSettings`, `checkHandle`, `deleteAccount`. L'espace privé est rafraîchi après un enregistrement, pour que la barre latérale et le menu montrent les nouvelles valeurs.
- Règles partagées (nettoyage, validation, texte de la notification, nom affiché) : `src/lib/account/settings.ts` ; lecture et écriture du profil : `src/lib/account/profile.ts`.
- Migration : `supabase/migrations/20261012160000_add_settings.sql`.
- Après la suppression, la page de connexion reçoit `?notice=account-deleted` et affiche la notification.

## Tests

- Unitaires : nettoyage et validation des valeurs, texte de la notification (accords), nom affiché.
- Bout en bout (`e2e/settings.spec.ts`) :
  - prénom et nom fabriqués par la base (nom Google, `given_name` et `family_name`, compte e-mail) ;
  - ouverture depuis le menu, valeurs enregistrées, e-mail grisé, infobulle ;
  - enregistrement des noms : notification, barre latérale, base ;
  - adresse du profil public : prise, réservée, mal écrite, puis libre et enregistrée ; l'ancienne adresse ne répond plus ;
  - fermeture avec des modifications : la question, « Ignorer les modifications », « Enregistrer » ; « Annuler » ferme sans rien enregistrer ;
  - suppression du compte : confirmation, annulation, puis suppression, déconnexion, notification, plus aucune donnée ;
  - notification de la mise en ligne ;
  - la base refuse seule un mot réservé, une adresse prise, et la modification du profil d'un autre.

## Hors périmètre (plus tard)

- Changement d'adresse e-mail, confirmé par e-mail (avec Resend), et changement de mot de passe.
- Méthodes de connexion (relier ou délier Google).
- Sections Abonnement et réglages des modules (modules activés, visibles sur le profil).
- Thème dans les Paramètres (il reste dans le menu du profil).
