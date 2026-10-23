# Mise en production : ouvrir MyWork à de vrais utilisateurs

Tout ce qu'il faut avant d'accepter de vrais abonnés, qui paient pour de vrai. Rédigé le 2026-10-21, à reprendre au moment de l'ouverture. Aujourd'hui, MyWork tourne en production avec le **mode test** de Stripe : personne ne paie, et seul le porteur du projet s'en sert.

Chaque point dit **qui** s'en charge : *vous* (le porteur du projet, parfois avec un comptable ou un juriste) ou *développement* (une session de code). L'ordre compte : les premiers points conditionnent les suivants (Stripe ne passe en réel qu'avec une entreprise et des pages légales, par exemple).

## En bref

1. **Entreprise et textes légaux** : statut, SIRET, TVA, pages légales, médiateur, RGPD, adresse de contact.
2. **Services en offre payante** : Supabase Pro, Vercel Pro, Resend, LiveKit ; connexion Google ouverte à tous.
3. **Séparer le développement de la production** : une base à part pour le développement et les tests.
4. **Stripe en mode réel** : activation du compte, réglages refaits, clés réelles en production.
5. **Ce qu'il reste à développer**.
6. **Sécurité et surveillance**.
7. **Vérifications du jour J**, puis l'ouverture.

Coût fixe au départ : **environ 46 $ par mois**, puis environ 116 $ quand l'usage grandit (détail dans [landing.md](landing.md), *Les coûts fixes*). Prix relevés en octobre 2026 : à vérifier au moment de souscrire.

## 1. L'entreprise et les textes légaux

- **Statut et SIRET** *(vous)* : une micro-entreprise suffit pour commencer. Le SIRET est demandé par Stripe, et figure dans les mentions légales et sur les factures.
- **TVA** *(vous, avec un comptable)* :
  - franchise en base (factures avec « TVA non applicable, art. 293 B du CGI ») ou TVA facturée ;
  - prix affichés TTC (5 € et 50 €, comme sur la landing) ;
  - ventes à des particuliers d'autres pays de l'UE : au-delà de 10 000 € par an, TVA du pays du client (guichet unique OSS) ;
  - calcul par Stripe (Stripe Tax, payant) ou non.
- **Pages légales** *(vous pour les textes, développement pour les pages)*, aux adresses déjà réservées `/mentions-legales`, `/confidentialite`, `/cgu` ([landing.md](landing.md)) :
  - **mentions légales** : éditeur (nom, SIRET, adresse, contact), hébergeur (Vercel) ;
  - **politique de confidentialité** : quelles données, pourquoi, combien de temps (voir ci-dessous), chez quels prestataires (Supabase, Vercel, Stripe, Resend, LiveKit, Google pour la connexion, YouTube pour la vidéo chargée au clic), les droits de chacun et comment les exercer ;
  - **conditions générales d'utilisation et de vente** : essai de 7 jours, renouvellement automatique, résiliation (immédiate pendant l'essai, à la fin de la période payée ensuite), changement de formule, absence de remboursement, fin de l'abonnement (espace en pause, données gardées 90 jours), droit de rétractation de 14 jours pour un service en ligne et la renonciation à ce droit quand le service commence tout de suite, médiateur de la consommation ;
  - textes **à faire relire** (modèle sérieux ou juriste) ;
  - liens dans le pied de page de la landing et du profil public.
- **Médiateur de la consommation** *(vous)* : obligatoire pour vendre à des particuliers. Adhésion à un médiateur (quelques dizaines d'euros par an), cité dans les CGV.
- **RGPD** *(vous)* :
  - un **registre des traitements** (un simple tableau : comptes, profils publics, rendez-vous et leurs invités, fichiers, visites, paiements) ;
  - les **contrats de sous-traitance** (DPA) de chaque prestataire, à accepter dans leurs réglages (Supabase, Vercel, Stripe, Resend, LiveKit) ;
  - les **durées de conservation**, déjà dans le code : rendez-vous effacés un an après leur date, visites du profil après 90 jours, données d'un abonnement terminé après 90 jours (suppression encore à développer, voir 5), factures 10 ans chez Stripe.
- **Adresse de contact** *(vous)* qui **reçoit** vraiment des e-mails, par exemple `contact@hellomywork.com` : Resend ne fait qu'envoyer. Une boîte mail sur le domaine (Google Workspace, ou une simple redirection vers votre boîte actuelle). Elle sert aux reçus de Stripe, à la FAQ, aux pages légales, et à la phrase « Répondez à cet e-mail » de l'e-mail « Au revoir ».

## 2. Les services en offre payante

| Service | Pourquoi | Quand | Qui |
|---|---|---|---|
| **Supabase Pro** (25 $/mois) | Usage commercial ; plus de mise en pause ; sauvegardes quotidiennes ; 100 Go de fichiers au lieu d'1 Go pour toute l'application | Avant l'ouverture | Vous |
| **Vercel Pro** (20 $/mois) | L'offre gratuite interdit l'usage commercial | Avant l'ouverture | Vous |
| **Resend** (gratuit jusqu'à 100 e-mails par jour, puis 20 $/mois) | Chaque inscription, rendez-vous ou abonnement envoie des e-mails : 100 par jour est vite atteint | Dès les premiers abonnés | Vous |
| **LiveKit** (gratuit : 5 000 minutes par mois pour tout le monde, puis 50 $/mois) | Visio des rendez-vous | Quand l'usage approche la limite | Vous |
| Supabase, limite d'envoi des e-mails de connexion | 30 par heure pour tout le site (`email_sent`, `supabase/config.toml`) | Avant l'ouverture | Développement |

- **Connexion Google ouverte à tous** *(vous)* : dans Google Cloud (*Google Auth Platform › Audience*), passer l'application de **« Testing »** à **« In production »**. Aujourd'hui, seuls les comptes déclarés comme utilisateurs test peuvent se connecter avec Google ([auth.md](auth.md)). Les autorisations demandées (`openid`, `email`, `profile`) n'exigent pas de vérification par Google. Facultatif : un logo sur l'écran de Google (vérification de la marque, quelques jours) et un domaine personnalisé chez Supabase (payant), pour afficher « MyWork » au lieu de l'adresse en `supabase.co`.

## 3. Séparer le développement de la production

Aujourd'hui, **une seule base** sert au poste de développement, aux aperçus de Vercel, aux tests automatiques de GitHub et à la production (décision provisoire, [product.md](product.md)). Les tests créent et suppriment des comptes dans la base de production, et un développement peut abîmer de vraies données. Avec de vrais utilisateurs, ce n'est plus acceptable.

Fait le 2026-10-23 :

- **Second projet Supabase**, **MyWork Dev** (`othjqrfcmbvzfexkvjml`, Irlande), pour le développement, les aperçus et les tests, dans une organisation à part pour rester gratuit ; la production garde le projet **MyWork**.
- Mêmes migrations ; mêmes réglages d'authentification, sauf les adresses de retour (bloc `[remotes.development]` de `supabase/config.toml`) ; fournisseur Google réglé avec le même client Google (adresse de retour de MyWork Dev ajoutée dans Google Cloud).
- **Codes secrets propres à chaque base** : leurs empreintes sont dans la table `private.secret_hashes` de chaque projet, plus dans les migrations (migration `20261023120000_secrets_per_database.sql`). MyWork Dev garde les codes actuels ; la production en reçoit de nouveaux.
- Le webhook de Stripe supporte deux bases sur le même compte de test : un événement d'un compte de l'autre base est ignoré (« compte inconnu »), sans erreur.

**Bascule faite le 2026-10-23**, dans l'ordre ci-dessous. Vérifié : production déployée avec ses nouveaux codes (webhook de test signé accepté, abonnement synchronisé après le retrait des anciennes empreintes), tests de GitHub sur MyWork Dev.

| Où | Variable | Production | Preview | Development |
|---|---|---|---|---|
| Vercel | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | MyWork (inchangé) | **MyWork Dev** | **MyWork Dev** |
| Vercel | `SUPABASE_SECRET_KEY` | — | — | **MyWork Dev** |
| Vercel | `BILLING_SECRET`, `BOOKING_EMAILS_SECRET` | **nouveaux codes** | inchangés | inchangés |
| Vercel | `LIVEKIT_*`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY` (test) | inchangés, mêmes valeurs partout | | |
| Vercel | `STRIPE_WEBHOOK_SECRET` | webhook du mode test `we_1UTegDLaybyIrcihK0ua7xNP` vers `https://hellomywork.com/api/stripe/webhook` (à remplacer par le webhook réel à l'activation de Stripe) | — | `stripe listen` (inchangé) |
| GitHub | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | **MyWork Dev** | | |
| GitHub | `BILLING_SECRET`, `LIVEKIT_*` | inchangés | | |

1. Migration `20261023120000` envoyée sur la production (sans effet : elle reprend les codes actuels), puis empreintes des nouveaux codes ajoutées dans `private.secret_hashes` : anciens et nouveaux codes valent alors tous les deux.
2. Variables de Vercel et secrets de GitHub changés comme ci-dessus ; webhook de test de la production créé chez Stripe.
3. Nouveau déploiement de la production (le prochain push sur `main`), puis anciennes empreintes retirées de la production.
4. `localhost` et les aperçus retirés des adresses de retour de la production (`supabase/config.toml`, puis `config push` sur la production).
5. `vercel env pull .env.local` sur le poste ; tests de bout en bout et connexion Google sur MyWork Dev ; vérification de la production (connexion, page publique).

Ensuite : **nettoyer la base de production** (comptes de test restants, abonnements du mode test), après accord sur la liste.

## 4. Stripe en mode réel

Le détail des réglages est dans [billing.md](billing.md), *Réglages dans Stripe*. À refaire en mode réel, car le mode test et le mode réel ne partagent rien.

1. **Activer le compte** *(vous)* : identité, SIRET, IBAN, adresse, description de l'activité, adresse du site. Stripe vérifie aussi les pages légales.
2. **Produit et prix** *(vous ou développement)* : « MyWork », 5 € par mois et 50 € par an, avec les **mêmes noms fixes** `mywork_monthly` et `mywork_yearly` (le code les cherche par ces noms).
3. **Réglages** *(vous)* :
   - portail client ;
   - moyens de paiement (la carte seulement) ;
   - apparence : logo, couleurs, nom public « MyWork » (le mode test affiche « hellomywork sandbox ») ;
   - e-mails aux clients ;
   - nouvelles tentatives des paiements refusés ;
   - factures (numérotation, mentions légales, mention de TVA) ;
   - libellé `MYWORK` sur les relevés bancaires ;
   - adresse des conditions générales, puis la case d'acceptation sur la page de paiement (une ligne de code, *développement*).
4. **Webhook réel** *(vous, ou développement avec votre accord)* vers `https://hellomywork.com/api/stripe/webhook`, avec les événements listés dans [billing.md](billing.md). Sans lui, la production ne voit ni la fin d'un essai, ni les prélèvements, ni la fin d'une période.
5. **Clés réelles en production seulement** *(vous)*, dans Vercel, environnement Production : `STRIPE_SECRET_KEY` (`sk_live_…`) et `STRIPE_WEBHOOK_SECRET` (celui du webhook réel). Jamais de clé réelle en local ni sur les aperçus.
6. **Conséquence** : dès la clé réelle en place, les abonnements de test ne comptent plus en production. Votre compte doit s'abonner pour de vrai.
7. **Premier paiement réel** *(vous)* : un abonnement avec votre propre carte, puis un remboursement depuis le tableau de bord de Stripe si besoin, pour vérifier toute la chaîne.

## 5. Ce qu'il reste à développer

Avant l'ouverture *(développement)* :

- **Suppression automatique des comptes** : jamais payés après 30 jours ; abonnement terminé après 90 jours, avec l'e-mail « Suppression prochaine » 7 jours avant. Les fichiers ne se suppriment que par l'API de Supabase : décider comment ([billing.md](billing.md), *Reste à faire*).
- **Quota de 10 Go par abonné**, avec Supabase Pro (une ligne dans la base).
- **Pages légales** et leurs liens ; case des CGV sur la page de paiement.
- **Changement d'adresse e-mail et de mot de passe** dans les Paramètres ([settings.md](settings.md)).
- **Export des données** du compte (droit à la portabilité, RGPD, promis dans [product.md](product.md)).
- **Protection contre les robots** à l'inscription : captcha de Supabase (Cloudflare Turnstile ou hCaptcha) ([auth.md](auth.md)).
- **Adresse de contact** dans l'e-mail « Au revoir » et la FAQ.
- **Tests du temps qui passe** avec les horloges de test de Stripe (fin d'essai, prélèvement, paiement refusé, renouvellement, fin de période) et du webhook.
- **Décisions encore à valider** dans les fiches ([billing.md](billing.md), [landing.md](landing.md), [booking.md](booking.md), [drive.md](drive.md), [dashboard.md](dashboard.md), [boards.md](boards.md)).

Souhaitable, pas bloquant : mesure d'audience sans cookie (Vercel Web Analytics, [landing.md](landing.md)), relance des inscriptions abandonnées, suivi des erreurs (Sentry ou équivalent).

## 6. Sécurité et surveillance

- **Supabase** *(développement, avec vous)* : protection contre les mots de passe divulgués (offre Pro), limites de connexion et d'inscription par adresse IP revues, sauvegardes vérifiées (une restauration d'essai).
- **Vercel** *(développement)* : aperçus protégés par connexion ; pare-feu de Vercel en cas d'abus.
- **Clés et codes secrets** *(vous)* : uniquement dans Vercel et GitHub ; en cas de fuite, les changer partout (la liste est dans [product.md](product.md), *Inventaire technique*).
- **E-mails** *(vous)* : après quelques semaines d'envois sans problème, durcir la règle DMARC du domaine (de « surveiller » à « mettre en quarantaine »), pour éviter qu'on usurpe `hellomywork.com`.
- **Surveillance**, chaque semaine au début *(vous)* :
  - Stripe : webhooks en échec (Stripe prévient par e-mail), paiements refusés, résiliations ;
  - Resend : e-mails rejetés ou en spam ;
  - Vercel : erreurs dans les journaux ;
  - Supabase : usage (base, fichiers, téléchargements) ;
  - LiveKit : minutes consommées.

## 7. Le jour J

Avant d'annoncer l'ouverture, avec la clé réelle de Stripe et un compte neuf *(vous, avec développement)* :

- [ ] Inscription depuis la landing avec chaque formule, par e-mail puis par Google (compte Google qui n'est pas utilisateur test).
- [ ] Paiement réel, retour sur le tableau de bord, e-mail de bienvenue reçu, reçu de Stripe reçu.
- [ ] Webhook : les événements arrivent en réponse 200 (Stripe › Développeurs › Webhooks).
- [ ] Paramètres › Abonnement : formule, carte, factures, portail.
- [ ] Résiliation pendant l'essai : espace en pause, e-mail « Abonnement terminé ».
- [ ] Suppression d'un compte abonné : abonnement arrêté chez Stripe.
- [ ] Pages légales accessibles depuis la landing, le profil public et la page de paiement.
- [ ] Sur téléphone et en thème sombre : landing, inscription, « Choisissez votre formule », tableau de bord.
- [ ] Tests automatiques au vert sur GitHub (sur la base de développement).

Puis : retirer les comptes de test de la base de production, et ouvrir (vidéo YouTube, liens avec `utm_source`, codes promo si prévu).

## 8. Après l'ouverture

- Suivre chaque semaine : inscriptions, essais convertis en abonnements, résiliations et leurs raisons (question du portail de Stripe), coûts des services.
- Répondre aux messages de l'adresse de contact ; noter les demandes qui reviennent.
- Revoir les offres payantes des services quand une limite approche (Resend, LiveKit, stockage Supabase).
