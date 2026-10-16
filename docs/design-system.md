# Design system

L'identité de MyWork s'inspire de **Westworld** : la plaquette de luxe que Delos remettrait aux visiteurs de son parc. Sobre, blanc et noir, un rouge rare, une touche technologique.
Ce fichier dit **où trouver** chaque élément et **comment l'appliquer**. L'historique des choix (pistes écartées, raisons) est dans [product.md](product.md), section *Décisions* (2026-10-08 et 2026-10-09).

## Où regarder

| Élément | Emplacement |
|---|---|
| Tokens : couleurs des deux thèmes, polices, rayons. Utilitaires `bg-spotlight` et `eyebrow` | `src/app/globals.css` |
| Chargement des polices, thème (clair, sombre, système) | `src/app/layout.tsx` |
| Composants de base (shadcn/ui, style `base-nova`, sur Base UI), déjà adaptés | `src/components/ui/` |
| Composants maison : `Logo`, `StatusDot`, `ThemeToggle`, `PublicPage` (gabarit des pages publiques et des pages introuvables, bandeau « Hors ligne »), `ProfilePhoto` (photo carrée ou initiales), `SiteIcon` (logo d'un lien, d'après son adresse), `FileIconFor` (icône d'un fichier d'après son type), `Pagination` (par 50, « 1–50 sur 132 »), `ConfirmDialog` (confirmation d'une suppression) | `src/components/` |
| **Vitrine** : chaque composant dans les deux thèmes, et une maquette par module | http://localhost:3000/design (`src/app/design/`), en local uniquement (404 en production) |
| Fichiers du logo (SVG, PNG) | `public/brand/` |
| Favicon, icône d'application, image de partage | `src/app/` : `icon.svg`, `favicon.ico`, `apple-icon.png`, `opengraph-image.png` |
| Copie sur claude.ai, pour les maquettes faites avec Claude | design system **MyWork** : https://claude.ai/artifact/T7MhWyh31URAnNAjyGd61b (dernière synchronisation : 2026-10-14, module Profil) |

En cas d'écart : le code (`globals.css`, composants) fait foi, la page `/design` montre l'usage, la copie claude.ai suit.

## Principes

- **Blanc et noir** : un blanc franc et une encre profonde, comme une plaquette imprimée.
- **Le rouge pour l'essentiel** : action principale, sélection, focus. **Un seul bouton rouge par écran.** Cases à cocher en encre. Interrupteurs : rouge quand ils sont activés (c'est une sélection), gris quand ils sont désactivés, et arrondis (décisions du 2026-10-12). Dans une ligne de menu qui sert elle-même d'interrupteur, `SwitchIndicator` dessine le même interrupteur, sans en être un. Dosage visé sur un écran : fond 62 %, surfaces 22 %, encre 11 %, rouge 5 %.
- **Sobriété** : angles droits (rayon 0 ; seuls les boutons radio, les pastilles et les interrupteurs sont ronds), filets de 1 px clairs, aucune ombre portée, beaucoup d'espace. Survols discrets : le filet se renforce, la flèche avance.
- **Précision technique** : chiffres alignés (`tabular-nums`), détails nets.
- **Deux thèmes**, clair et sombre, avec le thème du système par défaut. Tout écran doit fonctionner dans les deux.
- Interface en **français**.

## Couleurs

Toujours passer par les classes Tailwind des tokens (`bg-primary`, `text-muted-foreground`, `border-border`…), jamais de couleur en dur : c'est ce qui fait fonctionner les deux thèmes.

| Token | Nom | Usage |
|---|---|---|
| `background` | Fond | Blanc franc en clair, noir profond en sombre |
| `muted` | Gris perle | Zones secondaires, survols |
| `border` | Filet | Bordures et séparateurs |
| `foreground` | Encre | Texte principal, bouton encre |
| `muted-foreground` | Encre atténuée | Texte secondaire, étiquettes |
| `primary` | Rouge | Action principale, sélection, focus |
| `destructive` | Alerte | Erreurs, suppressions, statut « annulé » |
| `success` | Validation | Confirmations, disponibilité |
| `warning` | Attention | Échéances proches, statut « en attente » |
| `chart-1` à `chart-5` | Graphiques | Séries de données, dans cet ordre |
| `spotlight` | Lumière de studio | Halo de `bg-spotlight`, en haut des grandes zones |

## Typographie

Deux polices, pas de police mono : **Newsreader** (`font-heading`) pour les titres, **Geist** (`font-sans`, par défaut) pour tout le reste.

| Rôle | Classes |
|---|---|
| Affichage (72 px) | `font-heading text-7xl leading-none font-medium` |
| Titre 1 (48 px) | `font-heading text-5xl font-medium` |
| Titre 2 (24 px) | `font-heading text-2xl font-semibold` |
| Texte (16 px) | `text-base` |
| Petit texte (14 px) | `text-sm text-muted-foreground` |
| Étiquette (11 px, capitales espacées) | `eyebrow` |
| Donnée (heures, montants, compteurs) | `tabular-nums` |

## Composants

- **Boutons** (`Button`) : `default` (rouge, l'action principale), `contrast` (encre), `outline`, `secondary`, `ghost`, `destructive`, `link`. Tailles `xs`, `sm`, normale, `lg`, `icon`. Icône placée avec `data-icon="inline-start"` ou `"inline-end"`. Une flèche en fin de bouton pour les actions qui font avancer.
- **Badges** (`Badge`) : `default`, `secondary`, `outline`, `contrast`, `success`, `warning`, `destructive`. Statuts : confirmé = `success`, en attente = `warning`, annulé = `destructive`.
- **Composants installés** dans `src/components/ui/` : avatar (carré), badge, button, card, checkbox, dialog, dropdown-menu, input, label, native-select (listes déroulantes des formulaires), popover (sans ombre), progress, radio-group, select, separator, skeleton, sonner (notifications), switch, table, tabs, textarea, tooltip. Icônes : **lucide-react**.
- **`Logo`** : variantes `lockup` (par défaut), `mark` (le carré seul) et `wordmark` (le nom seul). Ne jamais redessiner le logo ni écrire « MyWork » à sa place.
- **`StatusDot`** : pastille de statut. La pulsation (`pulse`) est réservée à ce qui est en direct.
- **Maquettes des modules** (choix d'un créneau, fichiers, barre latérale, badge de visibilité) : dans `src/app/design/_components/`, avec des données fictives. Pour construire le vrai écran, partir de la maquette et déplacer le composant dans le code du module : ne jamais importer depuis `src/app/design/`.
- **Module Profil** : la vitrine montre ses **vrais composants** (en-tête et onglet « Profil » de la page publique, panneau « Me contacter », champs de « Mon profil », CV), avec un profil fictif (`src/app/design/_components/profile-demo.ts`). Les anciennes maquettes (en-tête, parcours, matrice de compétences) ont été retirées.
- **Module Tableaux** : la vitrine montre ses **vraies cartes**, rangées dans des listes (pastilles description, checklist, images), et une description mise en forme, avec un tableau fictif (`src/app/design/_components/board-bricks.tsx`). L'ancienne maquette kanban a été retirée.
- **Module Drive** : la vitrine montre ses **vrais composants** (liste de « Mes fichiers » avec badge « Public » et punaise de la ressource mise en avant, indicateur de stockage, onglet « Ressources » du profil public), avec des fichiers fictifs (`src/app/design/_components/drive-bricks.tsx`). L'ancienne maquette « Liste de fichiers » a été retirée.
- Autres motifs visibles sur `/design` : message d'information (fond `muted`, filet rouge à gauche), état vide, chargement (`Skeleton`), indicateurs chiffrés, tableaux.
- **Notifications** (`toast`, Sonner) : **en bas à droite**, après chaque action sur le compte (enregistrement, mise en ligne, suppression…). Un titre court au passé, le détail dessous (voir [settings.md](settings.md), *Notifications*).
- **Aide contextuelle** : une icône « ? » (`CircleHelpIcon`, encre atténuée) à droite d'un libellé, avec une infobulle (`Tooltip`) au survol ou au focus. Exemple : « Adresse de mon profil public » dans les Paramètres.

## Ajouter ou modifier

1. Composant shadcn/ui manquant : `npx shadcn@latest add <composant>`, puis l'adapter aux principes ci-dessus (angles droits, filets, tokens).
2. Toute nouvelle brique d'interface est ajoutée à la page `/design`.
3. Un token se modifie dans `globals.css`, pour **les deux thèmes**.
4. Vérifier chaque écran en clair et en sombre, et les pages publiques sur mobile.
5. Après un changement de `globals.css`, d'un composant ou du logo : resynchroniser la copie claude.ai.

## Marque

- Logo : le nom **MyWork** en Newsreader (lettres vectorisées), dont le M est porté par un **carré rouge**. Le carré seul sert de favicon et d'icône d'application.
- Règles hors de l'application : laisser autour du logo un espace au moins égal à la moitié du carré ; sur fond sombre, prendre la version blanche (le carré reste rouge) ; ne pas déformer, recolorer ni réécrire le nom dans une autre police.
- Fichiers (`public/brand/`) : `mywork-logo.svg` et `mywork-logo-white.svg` (avec leurs PNG 1200 px), `mywork-wordmark.svg` et `mywork-wordmark-white.svg`, `mywork-mark.svg` (carré rouge), `mywork-mark-ink.svg` (carré encre), `mywork-mark-512.png`.
- Image de partage (1200 × 630) : `src/app/opengraph-image.png`, texte alternatif dans `opengraph-image.alt.txt`.
