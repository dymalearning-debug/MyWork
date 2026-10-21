# Abonnement et paiement

Liste de tout ce qu'il faut mettre en place pour l'étape 6 (voir [product.md](product.md), *Roadmap*), de la landing page jusqu'à la fin d'un abonnement.
Statut : **développé en mode test le 2026-10-21**, décisions encore à valider par le porteur du projet. Les choix marqués *(proposé)* sont rassemblés à la fin, dans *Décisions à valider* ; ceux faits pendant le développement, dans *Précisé pendant le développement*. Ce qui manque encore : *Reste à faire*. Le compte Stripe et son mode test : voir [product.md](product.md), *Inventaire technique*.
Maquettes (une seule direction, à valider) : [Maquettes abonnement](https://claude.ai/artifact/8WGUBc6zFS1xap5P7yd3Au) sur claude.ai : inscription, choix de la formule, page de paiement (schéma), retour, rappels, paiement refusé, abonnement terminé, Paramètres › Abonnement et ses états, confirmations, cinq e-mails. Chaque écran a un réglage « thème sombre ».

## En bref

- **Pas de compte sans abonnement.** S'inscrire, c'est créer son compte, puis choisir sa formule et enregistrer sa carte sur la page de paiement de Stripe : 7 jours d'essai, puis 5 € par mois ou 50 € par an.
- Tant qu'un compte n'a pas d'abonnement en cours, l'espace privé se limite à une page : « Choisissez votre formule ».
- Dans les Paramètres, une section **Abonnement** : l'essentiel se lit dans MyWork ; les opérations (carte, factures, changement de formule, résiliation) se font sur le **portail client de Stripe**, ouvert depuis MyWork.
- Des **e-mails MyWork** aux moments clés (bienvenue, fin de l'essai, au revoir, fin de l'abonnement) ; Stripe envoie les reçus, les factures et les alertes de paiement.

## Le parcours d'inscription

1. **Landing page** : les boutons « Essayer 7 jours » des deux cartes du tarif mènent à `/signup?plan=monthly` ou `/signup?plan=yearly`. Les autres (en-tête, hero, outils remplacés, appel final) mènent à `/signup` : la formule annuelle est alors présélectionnée *(proposé : c'est celle que la landing met en avant)*.
2. **Inscription** (`/signup`) : en haut, la formule choisie (« Formule annuelle · 50 € par an · 7 jours d'essai ») avec un lien « Changer » ; sous le bouton, « Étape suivante : votre formule et votre carte. Rien n'est prélevé avant le 8e jour. » La formule est gardée avec le compte, pour survivre à la confirmation de l'e-mail.
3. **Création du compte**, comme aujourd'hui ([auth.md](auth.md)) : avec Google (compte créé tout de suite) ou avec un e-mail et un mot de passe (après le clic sur le lien de confirmation).
4. **« Choisissez votre formule »** (`/app/subscribe`) : les deux formules, la bonne présélectionnée, le rappel de l'essai, et le bouton « Démarrer mon essai de 7 jours ». C'est aussi la page de tout compte sans abonnement (paiement abandonné, abonnement terminé).
5. **Page de paiement de Stripe** (Checkout), en français : la formule, l'essai de 7 jours puis le prix, la carte bancaire (et Apple Pay ou Google Pay quand l'appareil les propose), l'adresse de facturation, le nom de l'entreprise et le numéro de TVA facultatifs (pour les factures), la **case d'acceptation des conditions générales**, un champ « code promo » *(proposé, pour les abonnés de la chaîne YouTube)*.
6. **Retour dans MyWork** : l'application vérifie le paiement auprès de Stripe tout de suite, puis ouvre le tableau de bord avec la notification « Bienvenue ! Votre essai court jusqu'au 28 octobre. » Un retour sans payer (flèche de retour sur la page de Stripe) ramène à « Choisissez votre formule ».

Règles :

- **Un seul essai par compte.** Se réabonner après une résiliation : pas d'essai, premier prélèvement tout de suite.
- **Un seul abonnement par compte** : la page de paiement n'est jamais proposée à un compte déjà abonné.
- **Inscription abandonnée** (compte créé, jamais payé) : à chaque connexion, retour à « Choisissez votre formule ». Le compte est supprimé au bout de 30 jours *(proposé)*.

## Accès selon l'état de l'abonnement

| État | Espace privé | Profil public et réservations | Ce que voit l'abonné |
|---|---|---|---|
| Essai (7 jours) | Ouvert | Ouverts | Les 3 derniers jours, un rappel dans le tableau de bord : « Votre essai se termine le … » *(proposé)* |
| Actif | Ouvert | Ouverts | Rien de particulier |
| Résiliation demandée **pendant l'essai** | **Fermé tout de suite** | **Hors ligne tout de suite** | Rien n'a été payé : l'abonnement s'arrête aussitôt, comme à la fin d'un abonnement (ci-dessous), et l'espace est mis en pause. Se réabonner : sans nouvel essai (décision du porteur du projet, 2026-10-21) |
| Résiliation demandée **après l'essai** (jusqu'à la fin de la période payée) | Ouvert | Ouverts | « Votre abonnement s'arrête le … », bouton « Reprendre mon abonnement » |
| Paiement refusé (Stripe réessaie pendant environ 2 semaines) | Ouvert | Ouverts | Bandeau en haut de l'espace privé : « Le paiement a échoué. Mettez à jour votre carte. » |
| Terminé, ou jamais abonné | **Fermé** : seulement « Choisissez votre formule » et les Paramètres (pour pouvoir supprimer son compte) | **Hors ligne** (« Page introuvable »), réservations fermées | « Choisissez votre formule », sans essai s'il y a déjà eu un abonnement |

À la fin d'un abonnement *(proposé)* :

- les **rendez-vous à venir sont annulés**, et les invités prévenus par l'e-mail d'annulation habituel ; l'abonné en est averti au moment de résilier (« Vous avez 3 rendez-vous après le 28 octobre : ils seront annulés. ») ;
- les **données sont gardées 90 jours** : se réabonner pendant ce délai rend tout, comme avant. Ensuite, le compte est supprimé, après un e-mail d'avertissement 7 jours avant.

**Pas d'accès offert** (décision du porteur du projet, 2026-10-21) : son compte passe par la page de paiement comme les autres ; il s'abonne avec une carte de test tant que le mode réel n'est pas ouvert. Une fois les clés réelles en place, la production ne reconnaît que les abonnements réels *(proposé)* : il faudra alors s'abonner pour de vrai. Les comptes des tests automatiques reçoivent un abonnement de test écrit directement dans la base par les tests (clé secrète Supabase, réservée aux tests) ; seuls les tests du paiement passent par la page de Stripe.

## La section « Abonnement » des Paramètres

Deux possibilités : un simple lien vers le portail de Stripe, ou tout refaire dans MyWork. **Proposé : entre les deux.** MyWork affiche l'essentiel ; chaque bouton ouvre directement la bonne page du portail de Stripe, qui ramène ensuite dans les Paramètres.

Ce que la section affiche :

- la formule et son prix : « Formule annuelle — 50 € par an » ;
- l'état et la prochaine échéance : « Essai gratuit jusqu'au 28 octobre, puis 50 € », « Prochain prélèvement : 50 € le 28 octobre 2027 », « Se termine le 28 octobre 2027 », « Paiement refusé » ;
- la carte enregistrée : « Visa •••• 4242, expire en 08/28 » ;
- les 3 dernières factures : date, montant, état, lien vers le PDF *(proposé)*.

Les boutons :

- **Changer de carte**, **Voir toutes les factures**, **Passer à la formule annuelle** (ou mensuelle), **Résilier** : chacun ouvre la page correspondante du portail de Stripe ; pendant l'essai, « Résilier » arrête l'abonnement directement dans MyWork (« Résilier maintenant »), sans passer par Stripe ;
- **Reprendre mon abonnement**, après une résiliation demandée, tant que la période payée court.

Changer de formule *(proposé)* : du mois à l'année, tout de suite, avec le reste du mois en cours déduit ; de l'année au mois, à la fin de l'année payée.

Pourquoi ne pas tout refaire dans MyWork : la saisie de la carte (avec la validation 3-D Secure de la banque), le changement de formule au prorata, la résiliation et les factures représentent beaucoup de code et de tests, pour refaire ce que Stripe fournit déjà, en français, et tient à jour avec les règles des banques. On pourra en rapatrier une partie plus tard.

**Supprimer le compte** (déjà en place, [settings.md](settings.md)) : la confirmation précise que l'abonnement est arrêté tout de suite, sans remboursement ; l'abonnement est résilié chez Stripe avant la suppression. Les factures restent chez Stripe (obligation légale de conservation de 10 ans), ce que la politique de confidentialité doit dire.

## E-mails

**Envoyés par MyWork** (Resend, même habillage que les e-mails de connexion et des rendez-vous) :

| E-mail | Quand | Contenu |
|---|---|---|
| Bienvenue | À la souscription | Ce qui est inclus, date de fin de l'essai, montant et date du premier prélèvement, comment résilier, trois premiers pas (compléter et mettre en ligne son profil, ouvrir ses créneaux, partager son lien) |
| Fin de l'essai | 3 jours avant la fin de l'essai | Date et montant du premier prélèvement, lien pour résilier. Promis sur la landing page |
| Au revoir | Quand l'abonné résilie après l'essai (pendant l'essai, c'est « Abonnement terminé », envoyé aussitôt) | Confirmation de la résiliation, date de fin de l'accès, ce qui se passe ensuite (profil hors ligne, rendez-vous annulés, données gardées 90 jours), bouton « Reprendre mon abonnement » |
| Abonnement terminé | Le jour où l'accès se ferme | Accès fermé, données gardées jusqu'au …, bouton pour se réabonner *(proposé)* |
| Suppression prochaine | 7 jours avant la suppression des données | Dernier rappel, bouton pour se réabonner *(proposé)* |

**Envoyés par Stripe** (à activer dans ses réglages, en français, avec le logo MyWork) :

- un reçu à chaque paiement, avec la facture en PDF ;
- paiement refusé, avec un lien pour changer de carte ;
- carte bientôt expirée ;
- rappel 7 jours avant le renouvellement annuel *(proposé)*.

Le rappel de fin d'essai de Stripe n'est pas utilisé : il part 7 jours avant la fin, soit le jour même de l'inscription.

## En coulisses

- **Une table `subscriptions`**, une ligne par compte : identifiants Stripe (client, abonnement), formule, état, fin de l'essai, fin de la période payée, résiliation demandée, carte (marque, 4 derniers chiffres, expiration), test ou réel. Chacun ne lit que sa ligne ; personne ne l'écrit depuis le navigateur.
- **Le webhook** (`/api/stripe/webhook`) : Stripe y annonce chaque changement (paiement, essai qui se termine, résiliation…). L'application vérifie la signature (`STRIPE_WEBHOOK_SECRET`), traite chaque événement une seule fois, puis met la table à jour par une fonction de la base protégée par un code secret, comme la file des e-mails des rendez-vous ([booking.md](booking.md), *E-mails*) : pas de clé secrète Supabase dans l'application.
- Au **retour de la page de paiement**, l'application interroge Stripe directement, sans attendre le webhook. Le parcours fonctionne ainsi aussi sur les aperçus de Vercel, que Stripe ne peut pas joindre (ils sont protégés).
- **Contrôle de l'accès** : dans l'espace privé (chaque page et chaque action) ; pour le profil public et les réservations, dans les fonctions de lecture de la base.
- Un **client Stripe** par compte, créé au premier passage sur la page de paiement, relié au compte MyWork.
- Les prix sont lus par leurs noms fixes (`mywork_monthly`, `mywork_yearly`) ; l'essai de 7 jours est demandé à chaque session de paiement, sauf après un premier abonnement.
- **Stockage** : 10 Go par abonné. Aujourd'hui, la capacité vaut pour toute l'application (1 Go, offre gratuite de Supabase) : elle devient un quota par utilisateur ([drive.md](drive.md)).
- Nouvelle variable dans Vercel : `BILLING_SECRET`, le code secret des fonctions de la base (dans les trois environnements ; seule son empreinte est dans la migration).

## Réglages dans Stripe

À faire en mode test, puis à refaire en mode réel :

- [x] Produit MyWork et ses deux prix (mode test, 2026-10-21).
- [ ] **Moyens de paiement** (*Settings › Payment methods*) : la carte, avec Apple Pay et Google Pay ; désactiver les autres (Klarna, Satispay, Amazon Pay… sont proposés aujourd'hui par défaut). Cette version de l'API de Stripe ne permet plus de les choisir dans le code.
- [ ] **Portail client** : changement de carte, factures, adresse de facturation et numéro de TVA, changement de formule (règles ci-dessus : les deux prix dans les produits proposés, passage à la formule mensuelle à la fin de la période), résiliation à la fin de la période payée avec la question « Pourquoi partez-vous ? », liens vers les conditions générales et la politique de confidentialité. En mode test, le réglage par défaut fonctionne déjà (essayé le 2026-10-21 : carte, résiliation, retour dans MyWork).
- [ ] **Apparence** : logo, icône, couleur, pour la page de paiement, le portail, les factures et les e-mails.
- [ ] **E-mails clients** (liste ci-dessus).
- [ ] **Paiements refusés** : nouvelles tentatives automatiques recommandées par Stripe pendant 2 semaines, puis arrêt de l'abonnement *(proposé)*.
- [ ] **Factures** : numérotation, mentions légales en pied de page (SIRET, mention de TVA).
- [ ] **Page de paiement** : adresse de la page des conditions générales (*Settings › Public details*), puis la case d'acceptation, une ligne à ajouter dans `src/app/app/subscribe/actions.ts` (`consent_collection`) ; libellé `MYWORK` sur les relevés bancaires ; adresse de contact ; nom public du compte (aujourd'hui « hellomywork sandbox »).
- [ ] **Webhook réel** `https://hellomywork.com/api/stripe/webhook`, et son secret dans Vercel (Production). Événements : `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`, `.paused`, `.resumed`, `.trial_will_end`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`. Tant que la production tourne avec la clé de test, un webhook de test vers la même adresse fait l'affaire.
- [ ] Codes promo, quand on en voudra (par exemple pour la chaîne YouTube).

## Avant d'ouvrir les inscriptions

Ce qui ne relève pas du code, mais conditionne l'ouverture :

- **Activation du compte Stripe** (identité, SIRET, IBAN), puis clé réelle en Production.
- **TVA**, avec un comptable : prix TTC ou HT, mention sur les factures, calcul par Stripe (Stripe Tax) ou non.
- **Pages légales** : mentions légales, politique de confidentialité (Stripe parmi les prestataires), conditions générales d'utilisation et de vente (essai, renouvellement, résiliation, droit de rétractation, médiateur de la consommation), à faire relire ([landing.md](landing.md)). Stripe les vérifie aussi avant d'autoriser les vrais paiements.
- **Adresse de contact**, par exemple `contact@hellomywork.com` : sur les reçus, les factures, la FAQ.
- **Supabase Pro et Vercel Pro** : obligatoires pour un usage commercial, et nécessaires aux 10 Go par abonné.
- **Abonnement réel du porteur du projet** : son abonnement de test ne compte plus en production une fois les clés réelles en place.
- **Protection contre les robots** à l'inscription ([auth.md](auth.md), *Plus tard*).

## Tests

- **Unitaires** (`src/lib/billing/*.test.ts`) : de l'état Stripe à l'accès (tableau ci-dessus), un seul essai, 90 jours de conservation, prochain prélèvement, dates en français à l'heure de Paris, rappels du tableau de bord, abonnement Stripe tel que la base le garde, textes et dates des quatre e-mails, formule gardée avec le compte à l'inscription.
- **Bout en bout** (`e2e/billing.spec.ts`) : les comptes de test reçoivent un abonnement de test écrit dans la base (en essai par défaut ; `createUser({ subscription })` choisit l'état). Compte sans abonnement renvoyé vers « Choisissez votre formule » depuis chaque page ; formule de l'adresse ou de l'inscription ; profil impossible à mettre en ligne et Drive fermé à l'écriture sans abonnement ; abonnement terminé (« Votre espace est en pause », sans nouvel essai) ; section Abonnement (essai, carte, factures, pied « Fermer », confirmation de « Résilier ») ; lien `?settings=billing` des e-mails ; résiliation demandée (rappel, « Reprendre mon abonnement ») ; paiement refusé (bandeau, rappel, accès ouvert) ; mention de l'abonnement dans la suppression du compte ; cartes du tarif de la landing vers `/signup?plan=…`.
- **Avec le code secret** (`.env.local`, pas sur GitHub) : la fin d'un abonnement met le profil hors ligne, annule les rendez-vous à venir (e-mail de l'invité préparé) et le remet en ligne au retour ; un événement reçu deux fois n'est traité qu'une fois ; un code faux est refusé.
- **Avec la clé de test de Stripe** (`.env.local`, pas sur GitHub) : la page de paiement de Stripe avec la carte de test `4242 4242 4242 4242`, le retour sur le tableau de bord avec la notification, l'abonnement enregistré, puis la suppression du compte qui arrête l'abonnement chez Stripe.
- **Résiliation pendant l'essai** (même condition) : essai payé avec la carte de test, « Résilier maintenant », espace aussitôt en pause et abonnement arrêté chez Stripe.
- **Essayé à la main** le 2026-10-21, en mode test : paiement, retour, Paramètres › Abonnement, changement de carte et résiliation sur le portail puis retour, « Reprendre mon abonnement », bandeau du paiement refusé, thème sombre.
- **Pas encore automatisé** : le temps qui passe, avec les horloges de test de Stripe (e-mail de fin d'essai, premier prélèvement, paiement refusé puis accès fermé, renouvellement annuel, fin après une résiliation) et la signature du webhook (à essayer avec `stripe listen` et `stripe trigger`).

## Précisé pendant le développement

À valider par le porteur du projet, comme les décisions proposées.

- **Verrou de l'espace privé** : dans le gabarit de ses pages (`src/app/app/(subscribed)/`), qui renvoie vers « Choisissez votre formule » ; dans les actions et les routes de l'espace privé ; et dans la base pour ce que le navigateur écrit lui-même (tableaux, Drive, images) : sans abonnement, rien ne s'y ajoute ni ne s'y modifie. Supprimer reste possible. Les Paramètres (profil, suppression du compte) restent ouverts.
- **Profil public à la fin de l'abonnement** : mis hors ligne par la base au moment où l'accès se ferme, et remis en ligne au retour s'il l'était ; sans abonnement, il ne peut pas être mis en ligne. Un profil déjà en ligne avant l'arrivée des abonnements (celui du porteur du projet) le reste jusqu'à sa première fin d'abonnement.
- **Rendez-vous annulés à la fin** : l'invité reçoit l'e-mail d'annulation habituel, sans message ; son bouton mène à la page de son rendez-vous (le profil est hors ligne).
- **Relire Stripe sans attendre le webhook** : au retour de la page de paiement et du portail (`/app/subscribe/return`, `/app/subscribe/refresh`), l'abonnement est relu chez Stripe. Le webhook reste nécessaire pour ce qui arrive sans l'abonné : fin de l'essai, prélèvements, paiement refusé, fin de la période.
- **Le webhook relit l'abonnement** chez Stripe à chaque événement, plutôt que de lire l'événement : l'ordre d'arrivée des événements ne compte plus. Un événement sur un abonnement plus ancien que celui enregistré est ignoré.
- **Mode test et mode réel** : avec la clé réelle, un abonnement de test ne compte plus (décision 8), et son essai non plus : il en faut un réel. La base, elle, ne distingue pas les deux modes pour le profil public.
- **Moyens de paiement** : réglés dans Stripe (cette version de son API ne permet plus de les choisir dans le code).
- **Case des conditions générales** : pas encore demandée, faute de page ; une ligne à ajouter avec les pages légales.
- **E-mail « Au revoir »** : sans la phrase « Répondez à cet e-mail » tant qu'il n'y a pas d'adresse de contact (décision 16).
- **Résiliation pendant l'essai** (décision du porteur du projet, 2026-10-21) : l'abonnement est arrêté aussitôt chez Stripe, quel que soit l'endroit où la résiliation est demandée (bouton de MyWork, portail ou tableau de bord de Stripe) : MyWork l'arrête chaque fois qu'il relit chez Stripe un essai avec une résiliation programmée. La confirmation dit que tout s'arrête maintenant, et compte tous les rendez-vous à venir.
- **Libellés** : « Résilier » ouvre la confirmation de MyWork, puis la page de Stripe (après l'essai) ; les boutons vers Stripe portent la flèche ↗ ; un compte sans abonnement voit « Aucun abonnement en cours » dans la section.

## Reste à faire

- **Suppression des comptes** : jamais payés après 30 jours, terminés après 90 jours, avec l'e-mail « Suppression prochaine » 7 jours avant. Les fichiers du stockage ne se suppriment que par l'API de Supabase, avec la clé secrète, aujourd'hui réservée aux tests : la façon de faire est à décider. En attendant, rien n'est supprimé.
- **Quota de 10 Go par abonné** : il reste à 1 Go par compte tant que Supabase est sur l'offre gratuite (1 Go en tout) ; une ligne à changer dans la base avec Supabase Pro.
- **Webhook de production** et réglages de Stripe (*Réglages dans Stripe*), puis les conditions d'ouverture (*Avant d'ouvrir les inscriptions*).
- Tests du temps qui passe (horloges de test de Stripe) et du webhook.

## Code

- Pages : `src/app/app/subscribe/` (« Choisissez votre formule », départ vers Stripe, `return/` et `refresh/` pour les retours) ; l'espace privé verrouillé est sous `src/app/app/(subscribed)/` (même adresse `/app/…`) ; section Abonnement, bandeau et notification de bienvenue dans `src/app/app/_components/billing/` ; webhook `src/app/api/stripe/webhook/route.ts`.
- Règles et données : `src/lib/billing/` (`plans.ts` formules et prix, `rules.ts` états, accès, dates et rappels, `snapshot.ts` lecture d'un abonnement Stripe, `data.ts` lecture, verrou et synchronisation, `portal.ts` section des Paramètres et portail, `stripe.ts` client Stripe, `emails/` les quatre e-mails). Habillage commun des e-mails : `src/lib/emails/parts.ts`.
- Base : migration `20261021120000_add_subscriptions.sql` (table `subscriptions`, événements déjà traités, verrous, fonctions `save_billing_customer` et `sync_subscription`).
- En local, pour recevoir les webhooks : `stripe listen --forward-to localhost:3000/api/stripe/webhook` (le CLI prend la clé de test dans `STRIPE_API_KEY`).

## Hors périmètre (plus tard)

- Saisie de la carte, liste complète des factures et résiliation dans MyWork (sur le portail de Stripe au départ).
- E-mail de relance d'une inscription abandonnée (« Il ne manque que votre formule »).
- Prélèvement SEPA, plusieurs paliers ou options payantes, offres pour les équipes.
- Hausse de prix pour les nouveaux abonnés, en gardant leur prix aux premiers (Stripe le permet sans toucher aux abonnements en cours).
- Remboursements : à la main, depuis le tableau de bord de Stripe.

## Décisions à valider

1. Formule annuelle présélectionnée quand on arrive sans formule choisie.
2. Une page « Choisissez votre formule » entre la création du compte et la page de paiement ; elle sert aussi à tout compte sans abonnement.
3. Page de paiement hébergée par Stripe, en français, avec adresse de facturation, nom d'entreprise et numéro de TVA facultatifs, conditions générales à accepter et champ code promo.
4. Un seul essai par compte ; pas d'essai pour un réabonnement.
5. Compte jamais payé supprimé au bout de 30 jours.
6. Paiement refusé : l'accès reste ouvert, avec un bandeau, le temps des nouvelles tentatives de Stripe (environ 2 semaines) ; ensuite l'abonnement s'arrête.
7. Fin de l'abonnement : espace privé fermé, profil public hors ligne, rendez-vous à venir annulés (invités prévenus), données gardées 90 jours puis supprimées.
8. Avec les clés réelles, la production ne reconnaît que les abonnements réels ; les comptes des tests automatiques reçoivent un abonnement de test écrit par les tests. (Pas d'accès offert : décision du porteur du projet.)
9. Section Abonnement : l'essentiel affiché dans MyWork (formule, état, échéance, carte, 3 dernières factures), les opérations sur le portail de Stripe.
10. Changement de formule : vers l'annuelle tout de suite au prorata, vers la mensuelle à la fin de l'année payée.
11. Cinq e-mails MyWork (bienvenue, fin de l'essai, au revoir, abonnement terminé, suppression prochaine) ; reçus, factures, paiement refusé, carte expirée et rappel du renouvellement annuel envoyés par Stripe.
12. Rappels du tableau de bord ([dashboard.md](dashboard.md)) : fin de l'essai (3 derniers jours), résiliation demandée et paiement refusé.
13. Inscription en deux étapes affichées (« Étape 1 sur 2 », « Étape 2 sur 2 ») ; « Choisissez votre formule » montre l'échéancier : 0 € aujourd'hui, le montant à la fin de l'essai.
14. « Résilier » ouvre d'abord une confirmation dans MyWork (date de fin, rendez-vous annulés, données gardées 90 jours), puis la page de Stripe. (Pendant l'essai, la résiliation est immédiate et se fait dans MyWork : décidé par le porteur du projet le 2026-10-21.)
15. Section Abonnement des Paramètres : rien à enregistrer, le pied de la fenêtre n'a qu'un bouton « Fermer » ; les boutons qui ouvrent Stripe portent une flèche.
16. E-mail « Au revoir » : « Répondez à cet e-mail » ; il faut donc une adresse de réponse (l'adresse de contact).
