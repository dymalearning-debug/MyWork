# Landing page

Spécification de la landing page, la page d'accueil publique de `hellomywork.com`.
Statut : **spécifiée** le 2026-10-19, à partir des souhaits du porteur du projet. Les choix marqués *(proposé)* ont été pris sans lui, à sa demande, puis **validés** par lui le même jour (voir *Décisions validées*). Ossature de la page en place le 2026-10-19 ; hero choisi (approche A · Vitrine) et développé le 2026-10-20 (voir *Mise en œuvre*). Fonctionnalités : approche B · Alternance retenue et développée le 2026-10-20. Outils remplacés : approche B · Tableau retenue et développée le 2026-10-20.

## En bref

- `hellomywork.com` (`/`) affiche la landing page, au lieu de renvoyer vers la connexion.
- **Une seule page**, en blocs : en-tête, hero, fonctionnalités, outils remplacés, tarif, FAQ, appel final, pied de page. Retirés le 2026-10-20 : « Un seul lien », « Comment ça marche », « Qui est derrière MyWork ». Reste à faire : la FAQ.
- Cible de cette première version : les **freelances**. D'autres métiers viendront plus tard, avec leurs propres pages.
- Acquisition : la **chaîne YouTube** du porteur du projet, un peu de publicité plus tard. La page est pensée pour un visiteur qui arrive d'une vidéo, déjà un peu convaincu.
- La FAQ sert aussi aux **moteurs de recherche et aux IA** (ChatGPT, Claude, Perplexity…) : textes rendus côté serveur, données structurées, fichier `llms.txt`.

## Maquettes

Un bloc à la fois. Hero : **approche A · Vitrine retenue** le 2026-10-20 par le porteur du projet, parmi trois, [Maquettes landing page](https://claude.ai/artifact/QzKL4ZebprB3125h3scy4M) sur claude.ai (réglage « Tweaks » : thème clair ou sombre). Personnage fictif du profil : Inès Robert.

| Approche | Idée |
|---|---|
| **A · Vitrine** | Texte à gauche ; à droite, le profil public dans une fenêtre de navigateur, avec ses onglets « Profil », « Rendez-vous », « Ressources » cliquables et l'adresse qui change avec l'onglet |
| B · Projection *(écartée)* | Tout centré, grand titre ; dessous, la vidéo de démonstration (chargée au clic) et les quatre modules en bandeau. Pensée pour le visiteur qui arrive de YouTube |
| C · Adresse *(écartée)* | Le visiteur tape son nom et voit son adresse `hellomywork.com/son-nom` se construire, avec ses trois pages publiques ; le bouton rouge est dans le champ |

Fonctionnalités : **approche B · Alternance retenue** le 2026-10-20 par le porteur du projet, parmi deux, sur le même canevas (deuxième rangée).

| Approche | Idée |
|---|---|
| A · Grille *(écartée)* | Les quatre modules en carrés de deux par deux, séparés par un filet ; chacun avec une petite vignette en haut, puis son étiquette Public ou Privé, son titre, son texte et ses trois points. Compact : tout se lit d'un coup d'œil |
| **B · Alternance** *(retenue)* | Une rangée par module, texte d'un côté et grande vignette de l'autre, en alternance gauche-droite ; chaque vignette montre l'espace privé dans une fenêtre de navigateur (`/app/profile`, `/app/booking`…). Plus long, mais chaque module a la place de convaincre |

Outils remplacés : **approche B · Tableau retenue** le 2026-10-20 par le porteur du projet, parmi deux (troisième rangée du canevas). Réglages « thème » et « logos » (en couleur ou monochrome) sur chacune.

| Approche | Idée |
|---|---|
| A · Avant / après *(écartée)* | Deux panneaux côte à côte : « Aujourd'hui », les cinq outils avec leur logo, leur usage et leur prix, puis « 5 comptes, 5 factures, 5 liens » et ≈ 30 à 45 € ; une flèche ; « Avec MyWork », les quatre modules, « 1 compte, 1 facture, 1 lien », 5 € et le bouton « Essayer 7 jours ». Se lit en un coup d'œil |
| **B · Tableau** *(retenue)* | En-tête centré, puis la rangée des cinq logos qui mène au carré MyWork ; dessous, un tableau Besoin / Outil habituel / Prix courant / Dans MyWork (colonne MyWork éclairée), avec la ligne du total ; la note sur les prix et le bouton « Essayer 7 jours » en bas. Plus factuel, proche du tableau de la fiche |

Tarif : **approche B · Deux formules retenue** le 2026-10-20 par le porteur du projet, parmi deux (quatrième rangée du canevas). Mêmes textes (voir *Tarif*), réglage « thème » sur chacune.

| Approche | Idée |
|---|---|
| A · Carte unique *(écartée)* | En-tête centré ; une seule carte en deux colonnes : à gauche, une bascule « Mensuel / Annuel (2 mois offerts) » qui change le prix (5 €/mois ou 50 €/an, 60 € barré), le bouton rouge « Essayer 7 jours » ; à droite, « Tout est inclus ». Dessous, l'essai en trois étapes : aujourd'hui, pendant 7 jours, le 8e jour. Un seul bouton, le choix de la formule se fait dans la carte |
| **B · Deux formules** *(retenue)* | En-tête en deux colonnes ; trois cartes côte à côte : « Mensuel » (bouton à contour), « Annuel » mise en avant (filet noir, « 2 mois offerts », bouton rouge), « Inclus dans les deux formules ». Dessous, un bandeau sur l'essai de 7 jours. Les deux prix se comparent d'un coup d'œil ; sur mobile, l'annuelle passe en premier |

## Souhaits du porteur du projet (2026-10-19)

- La landing page remplace la page de connexion comme page d'entrée.
- Blocs : un hero classique, les fonctionnalités principales, l'argument « plus besoin des outils qu'on remplace » (LinkedIn, Calendly, Trello, Google Drive), le prix, une FAQ.
- Prix : un seul abonnement à **5 € par mois**, avec **1 Go** de stockage.

## Le modèle économique tient-il ?

Chiffres relevés le 2026-10-19 sur les pages de tarifs (à revérifier avant le lancement).

### Ce que coûte le stockage

- Supabase **Pro** (25 $/mois, obligatoire pour un usage commercial : l'offre gratuite n'a qu'**1 Go pour toute l'application** et se met en pause) inclut **100 Go** de fichiers, puis **0,0213 $ par Go et par mois**.
- **1 Go coûte donc environ 0,02 $ par mois.** Même 10 Go par abonné ne coûtent que 0,21 $ au-delà des 100 Go inclus.
- Le vrai coût à surveiller n'est pas le stockage mais le **téléchargement** (« egress ») : 250 Go inclus par mois, puis 0,09 $ par Go. Un fichier public très téléchargé coûte plus que son stockage. Le plafond de 50 Mo par fichier limite déjà le risque.

### Ce que rapporte un abonné à 5 €

| | Mensuel 5 € | Annuel 50 € *(proposé)* |
|---|---|---|
| Prix payé (TTC) | 5,00 € | 50,00 € (4,17 €/mois) |
| TVA à 20 % (si l'entreprise y est soumise) | − 0,83 € | − 8,33 € |
| Stripe : carte européenne 1,5 % + 0,25 €, abonnements 0,7 % | − 0,36 € | − 1,35 € |
| **Reste par mois** | **≈ 3,80 €** | **≈ 3,36 €** |

Les frais fixes de Stripe (0,25 € par paiement) pèsent lourd sur un petit montant : 7 % sur 5 €, moins de 3 % sur 50 €. D'où l'intérêt d'une formule annuelle.

### Les coûts fixes

| Service | Aujourd'hui | Au lancement payant |
|---|---|---|
| Vercel Pro (l'offre gratuite interdit l'usage commercial) | 0 $ | 20 $/mois |
| Supabase Pro | 0 $ | 25 $/mois |
| Nom de domaine | ≈ 1 $/mois | ≈ 1 $/mois |
| Resend (gratuit : 3 000 e-mails/mois, **100 par jour**) | 0 $ | 0 $, puis 20 $/mois au-delà |
| LiveKit (gratuit : 5 000 minutes, soit environ 80 rendez-vous de 30 min à deux par mois, pour tous les utilisateurs) | 0 $ | 0 $, puis 50 $/mois (150 000 minutes, environ 2 500 rendez-vous) |
| **Total** | ≈ 1 $ | **≈ 46 $/mois**, puis ≈ 116 $/mois |

### Verdict

- **Le modèle tient** : environ **12 abonnés** couvrent les coûts de départ, une trentaine quand la visio et les e-mails dépassent les offres gratuites. Chaque abonné de plus coûte quelques centimes.
- **Le stockage n'est pas le problème.** 1 Go est même trop peu pour l'argument « remplace Google Drive » : Google en donne 15 gratuitement. **Proposé : 10 Go** (coût maximal 0,21 $ par abonné et par mois, et la plupart n'utiliseront qu'une fraction).
- **Le vrai défi est le volume** : à 3,80 € net, 1 000 abonnés rapportent environ 3 800 € par mois. Le prix de 5 € est un bon prix d'appel ; il pourra monter plus tard (7 à 9 €), en gardant leur prix aux premiers abonnés.
- **TVA** : statut à vérifier avec un comptable (franchise en base ou non ; ventes à des particuliers d'autres pays de l'UE). Stripe Tax peut la calculer (0,5 % par transaction).

## Contenu de la page

Textes de départ, à retravailler sur les maquettes. Vouvoiement, comme dans l'application *(proposé)*.

### En-tête

Le logo (lien vers le haut de la page), des ancres « Fonctionnalités », « Tarif », « FAQ », puis « Se connecter » et le bouton principal « Essayer 7 jours ». Si le visiteur est déjà connecté, un seul bouton « Ouvrir mon espace » vers `/app` *(proposé)*. L'en-tête reste visible en haut pendant le défilement.

### Hero

- Titre : *Votre activité de freelance, à une seule adresse.*
- Sous-titre : *Profil professionnel, prise de rendez-vous avec visio, tableaux de tâches et fichiers partagés : MyWork réunit les outils que vous payez séparément, pour 5 € par mois.*
- Boutons : « Essayer 7 jours » et « Voir un profil en exemple » (le profil public du porteur du projet, en vrai : rien ne prouve mieux le produit).
- Visuel : la **vidéo de démonstration** (60 à 90 secondes, celle de la chaîne YouTube), en façade : une image avec un bouton lecture, la vidéo `youtube-nocookie.com` n'étant chargée qu'au clic. Ainsi, aucun cookie YouTube sans action du visiteur, et pas de bandeau de consentement. Tant que la vidéo n'existe pas : une capture du profil public.
- Sous les boutons, trois réassurances courtes : « 7 jours d'essai », « Sans engagement », « Données hébergées en Europe ».

### ~~« Un seul lien »~~ *(retiré)*

**Retiré le 2026-10-20** par le porteur du projet : le hero retenu (A · Vitrine) montre déjà le profil public, son adresse et ses trois onglets ; un second bloc sur le même sujet aurait fait doublon. Son idée propre, *où partager son lien*, devait passer à l'étape 3 de « Comment ça marche », retiré à son tour. Texte d'origine, pour mémoire : le bloc qui distingue MyWork : le **profil public** relie tout. Une adresse `hellomywork.com/votre-nom` qui s'anime en trois onglets, « Profil », « Rendez-vous », « Ressources ». Texte : *Un lien à mettre dans votre signature, votre bio, vos propositions commerciales. Vos clients y trouvent votre parcours, réservent un appel et téléchargent vos documents.*

### Fonctionnalités

Textes rédigés et validés avec la maquette le 2026-10-20. Quatre modules, chacun avec une vignette, une étiquette qui dit s'il est **public** (visible sur votre lien) ou **privé**, un titre, deux lignes et trois points. Rien n'y est promis que l'application ne fasse déjà.

- Étiquette : « Fonctionnalités ».
- Titre : *Quatre outils, un seul espace.*
- Chapeau : *Présentez votre activité, prenez vos rendez-vous, organisez vos missions. Ce que vous rendez public apparaît sur votre lien ; le reste ne regarde que vous.*

| Module | Étiquette | Titre | Texte | Trois points |
|---|---|---|---|---|
| Profil | Public | *Un profil pro qui vous ressemble.* | *Votre parcours, votre offre et vos projets sur une seule page, à votre adresse. Ce que vous laissez vide n'apparaît pas.* | Expériences, formation, projets, compétences, langues, recommandations · Offre freelance : disponibilité, prestations, TJM · Export du CV en PDF ou en image, en un clic |
| Rendez-vous | Public | *Vos clients réservent, vous tenez l'appel.* | *Ils choisissent un créneau de 30 minutes sur votre profil et vous rejoignent en visio depuis leur navigateur, sans compte ni installation.* | Vos horaires, vos jours bloqués, un préavis et une pause entre deux rendez-vous · Visio intégrée, ouverte 15 minutes avant · Confirmation par e-mail et ajout à l'agenda |
| Tableaux | Privé | *Vos missions, carte par carte.* | *Des listes et des cartes à glisser-déposer pour suivre chaque mission, de la prospection à la facture. Personne d'autre ne les voit.* | Autant de tableaux que de projets · Description, checklist et images sur chaque carte · Glisser-déposer des listes et des cartes |
| Fichiers | Privé ou public | *Vos documents, rangés et partagés.* | *Devis, contrats, livrables : tout est rangé en dossiers. Rendez un fichier public, il apparaît dans l'onglet « Ressources » de votre profil.* | Dossiers, recherche, tri, aperçu des images et des PDF · 10 Go de stockage, 50 Mo par fichier · Un document mis en avant en tête de vos ressources |

- Pied du bloc : *Les quatre modules sont inclus dans l'abonnement, sans option payante.*
- Pas de bouton rouge dans ce bloc : celui du hero est encore proche, et l'appel revient au tarif.
- **Vignettes dessinées en code** *(proposé)*, comme la vitrine du hero, plutôt que des captures d'écran : elles suivent le thème clair ou sombre, restent nettes sur tous les écrans et n'ont pas à être refaites quand l'application change un peu.

### Outils remplacés

Textes rédigés et validés avec la maquette le 2026-10-20. Ton voulu par le porteur du projet : **pas agressif**, l'idée de tout réunir au même endroit plutôt que de dénigrer les outils. Le titre « Arrêtez de payer cinq abonnements » est abandonné.

- Étiquette : « Outils remplacés ».
- Titre : *Moins d'outils à gérer, plus de temps pour vos clients.*
- Chapeau : *Une page pour votre profil, un agenda en ligne, une application de visio, une autre pour vos tâches, une dernière pour vos fichiers : autant de comptes, d'abonnements et de mots de passe. MyWork réunit l'essentiel dans un seul espace.*
- Comparaison (lignes ci-dessous) : *Séparément : ≈ 30 à 45 € par mois. Avec MyWork : 5 € par mois, tout compris.*
- Bilan, pour la maquette « avant / après » : *5 comptes, 5 factures, 5 liens à partager* contre *1 compte, 1 facture, 1 lien*.
- Note sous le bloc : *Prix publics des offres payantes les plus courantes, relevés le 19 octobre 2026. Ces outils ont aussi des offres gratuites, plus limitées. MyWork remplace votre page de profil, pas le réseau LinkedIn. Les noms et logos cités appartiennent à leurs propriétaires.*
- **Vrais logos** des outils, à la demande du porteur du projet (2026-10-20), au lieu des noms seuls : voir *Logos des outils* plus bas.

Tableau de départ, prix publics relevés à une date affichée :

| Besoin | Outil habituel | Prix courant | Dans MyWork |
|---|---|---|---|
| Page pro, CV en ligne | Site vitrine, LinkedIn | 0 à 15 €/mois | Profil public, export du CV |
| Prise de rendez-vous | Calendly Standard | ≈ 10 $/mois | Rendez-vous |
| Visio | Zoom Pro | ≈ 14 €/mois | Visio des rendez-vous |
| Tâches | Trello Standard | 5 à 6 $/mois | Tableaux |
| Fichiers partagés | Google Drive (Google One) | ≈ 2 €/mois | Fichiers et Ressources |
| **Total** | | **≈ 30 à 45 €/mois** | **5 €/mois** |

Points d'honnêteté *(proposé)* :
- **Ne pas prétendre remplacer LinkedIn Premium** (≈ 30 à 40 €/mois) : MyWork n'est pas un réseau social. Il remplace la *page de profil*, pas la messagerie ni la recherche. Le total ci-dessus ne compte donc pas LinkedIn Premium.
- Les offres gratuites de ces outils existent : l'argument fort n'est pas seulement l'économie, c'est **un seul outil, un seul lien, une seule facture**.
- ~~Noms des outils cités en texte, sans leurs logos~~ : remplacé le 2026-10-20, voir *Logos des outils*. La publicité comparative reste permise si elle est objective et vérifiable, d'où la date des prix.

#### Logos des outils

- Demandés par le porteur du projet le 2026-10-20. Le droit européen permet de citer une marque concurrente dans une comparaison **objective, vérifiable et non dénigrante** ; les logos eux-mêmes restent des marques déposées, et chaque entreprise a ses règles d'usage (Calendly : newsroom, Trello : atlassian.design, Zoom : brand.zoom.us). Risque faible pour une petite page, mais une marque peut demander le retrait : on retirerait alors son logo, sans toucher au texte.
- Maquettes : dessins de la bibliothèque **Simple Icons** (version 16.35.0) pour Calendly, Trello, Google Drive et Zoom, dans leur couleur officielle. LinkedIn n'y figure plus (retiré à la demande de la marque) : son « in » est redessiné pour la maquette ; au développement, prendre le fichier officiel de LinkedIn.
- Développé **en couleur** (2026-10-20), les dessins recopiés dans `tool-logos.tsx` (aucune bibliothèque ajoutée) : seule exception à la règle « aucune couleur en dur » du design system. Lisibles aussi en thème sombre. Le réglage monochrome des maquettes reste une option si le rendu paraît trop chargé.
- **Avant le lancement** : remplacer le « in » redessiné par le fichier officiel de LinkedIn, et revérifier les prix (la date de la note change avec eux).

### ~~Comment ça marche~~ *(retiré)*

**Retiré le 2026-10-20** par le porteur du projet : le fonctionnement est déjà assez clair avec le hero, les fonctionnalités et le tableau des outils. Texte d'origine, pour mémoire. Trois étapes : 1. Créez votre compte (Google ou e-mail). 2. Remplissez votre profil et vos disponibilités. 3. Partagez votre lien : dans votre signature d'e-mail, votre bio, vos devis et propositions commerciales (reprise du bloc « Un seul lien », retiré le 2026-10-20).

### Tarif

Deux formules, **5 € par mois** ou **50 € par an** (deux mois offerts), sans autre différence (porteur du projet, 2026-10-20). Tout est inclus : les quatre modules, la visio, **10 Go** de stockage, le profil public. 7 jours d'essai dans les deux cas, une fois l'abonnement pris. Un bouton d'inscription « Essayer 7 jours » vers `/signup`.

Textes (2026-10-20) :

- Titre : *Un seul abonnement, tout compris*
- Intro : *Les deux formules donnent accès à tout MyWork. Seule différence : à l'année, deux mois sont offerts.* (maquette A : *Tout MyWork, sans option ni palier : vous choisissez seulement de payer au mois ou à l'année.*)
- Mensuel : *5 € /mois. Payé chaque mois. Sans engagement : vous arrêtez quand vous voulez.* Sous le bouton : *Puis 5 € par mois.*
- Annuel, étiquette *2 mois offerts* : *50 € /an* (*60 €* barré). *Payé en une fois pour l'année, soit 4,17 € par mois.* Sous le bouton : *Puis 50 € pour un an.*
- Tout est inclus : *Profil public à votre nom, export du CV en PDF et en image* · *Prise de rendez-vous en ligne, sans compte pour vos clients* · *Visio intégrée aux rendez-vous, depuis le navigateur* · *Tableaux de tâches, listes et cartes* · *10 Go de fichiers, avec vos documents publics* · *Données hébergées en Europe*
- L'essai, en bandeau sous les formules : *7 jours d'essai gratuit, quelle que soit la formule. Vous choisissez votre formule et enregistrez votre carte à l'inscription. Rien n'est prélevé avant le 8e jour, un e-mail vous prévient avant, et une résiliation pendant l'essai ne coûte rien.* (Maquette A, en trois étapes : *Aujourd'hui : vous créez votre compte, choisissez votre formule et enregistrez votre carte.* · *Pendant 7 jours : vous essayez tout MyWork. Rien n'est prélevé, et un e-mail vous prévient avant la fin de l'essai.* · *Le 8e jour : premier prélèvement, sauf si vous avez résilié : dans ce cas, vous ne payez rien.*)
- À trancher avant le lancement : afficher « TTC » ou « HT » selon le régime de TVA retenu (les abonnés sont des professionnels).

**Abonnement dès l'inscription** (décision du porteur du projet, 2026-10-19) : ni offre gratuite, ni essai sans paiement. Créer son compte, c'est choisir sa formule (mensuelle ou annuelle) et enregistrer sa carte (Stripe Checkout). Les **7 premiers jours sont un essai** : rien n'est prélevé avant le 8e jour, et une résiliation pendant l'essai ne coûte rien. Un e-mail prévient avant le premier prélèvement. Conséquences : moins d'inscriptions, mais des inscrits décidés ; l'inscription publique attend le paiement (étape 6), et la promotion sur YouTube aussi.

### ~~Qui est derrière MyWork~~ *(retiré)*

**Retiré le 2026-10-20** par le porteur du projet. Le lien vers la chaîne YouTube reste prévu dans le pied de page. Texte d'origine, pour mémoire. Une photo, un paragraphe à la première personne : *Je suis freelance, je payais plusieurs outils pour faire tourner mon activité. J'ai construit MyWork pour moi, puis pour vous, et je raconte sa construction sur YouTube.* Lien vers la chaîne. Pour une audience qui vient de YouTube, ce visage est la principale source de confiance.

### FAQ

Questions en titres (`<h3>`), réponses courtes et **factuelles**, qui se suffisent à elles-mêmes (une IA peut en citer une seule). Toutes visibles dans la page, sans accordéon fermé *(proposé : plus lisible pour les robots ; une version repliable reste possible si le texte est bien présent dans le HTML)*. **À tenir à jour à chaque changement du produit** : une FAQ fausse fait plus de tort qu'une FAQ absente.

1. **Qu'est-ce que MyWork ?** Une application web pour freelances qui réunit un profil professionnel public, la prise de rendez-vous avec visio, des tableaux de tâches et un espace de fichiers, pour 5 € par mois.
2. **À qui s'adresse MyWork ?** Aux freelances et indépendants qui veulent présenter leur activité et s'organiser avec un seul outil.
3. **Quels outils MyWork remplace-t-il ?** Une page de profil ou un site vitrine, Calendly, Zoom pour les rendez-vous clients, Trello et le partage de fichiers de Google Drive. Ce n'est pas un réseau social : il ne remplace pas la messagerie de LinkedIn.
4. **Combien coûte MyWork ?** 5 € par mois ou 50 € par an, tout compris. L'abonnement se prend à l'inscription, avec 7 jours d'essai : rien n'est prélevé avant le 8e jour, et vous pouvez résilier avant sans rien payer.
5. **Puis-je arrêter quand je veux ?** Oui, sans engagement. Vous pouvez aussi supprimer votre compte et toutes vos données depuis les Paramètres.
6. **Qu'est-ce que le profil public ?** Une page à votre nom, `hellomywork.com/votre-nom`, avec votre profil, vos créneaux de rendez-vous et vos documents publics. Hors ligne par défaut, vous la mettez en ligne quand vous êtes prêt.
7. **Mes clients doivent-ils créer un compte pour réserver ?** Non. Ils choisissent un créneau, laissent leur nom, leur e-mail et un message, et rejoignent la visio depuis leur navigateur, sans rien installer.
8. **MyWork se synchronise-t-il avec Google Agenda ou Outlook ?** Non. Vos disponibilités se gèrent dans MyWork ; vous bloquez à la main les jours déjà pris.
9. **Combien d'espace de stockage ai-je ?** 10 Go pour tous vos fichiers, 50 Mo maximum par fichier.
10. **Où sont hébergées mes données ?** Dans l'Union européenne (Irlande), conformément au RGPD.
11. **Puis-je exporter mon CV ?** Oui, en PDF et en image PNG, depuis « Mon profil ».
12. **MyWork fonctionne-t-il sur mobile ?** Les pages publiques, oui. L'espace de gestion est pensé pour un ordinateur.
13. **MyWork est-il disponible en anglais ?** Pas encore : l'application et les profils sont en français pour l'instant.

### Appel final et pied de page

- Un dernier bloc sombre, « lumière de studio » : *Votre lien MyWork en cinq minutes.* et le bouton « Essayer 7 jours ».
- Pied de page : logo, liens « Mentions légales », « Confidentialité », « Conditions d'utilisation », contact, chaîne YouTube, interrupteur de thème.

## Ce qui manquait dans la demande

- **Pages légales**, obligatoires en France : **mentions légales** (éditeur, hébergeur), **politique de confidentialité** (RGPD : quelles données, pourquoi, combien de temps, chez quels prestataires), **conditions générales** (d'utilisation, et de vente avec l'abonnement). Adresses `/mentions-legales`, `/confidentialite`, `/cgu` : déjà dans les mots réservés des identifiants. Textes à faire relire (modèle ou juriste).
- **Le paiement à l'inscription** : l'abonnement se prend en créant son compte (voir *Tarif*). La landing peut être en ligne avant l'étape 6, mais l'inscription publique et la promotion attendent le paiement.
- **Mesure d'audience sans bandeau de cookies** : **Vercel Web Analytics** *(proposé)*, sans cookie, donc sans bandeau. Liens des vidéos avec `?utm_source=youtube&utm_campaign=<vidéo>` pour savoir quelle vidéo amène des inscriptions. La publicité (pixels Meta ou Google) imposera plus tard un bandeau de consentement : à décider à ce moment-là.
- **La boucle virale** : le pied de page de chaque profil public (« Créé avec MyWork ») devient un **lien vers la landing**, comme prévu ([public-profile.md](public-profile.md)). Chaque profil partagé fait connaître MyWork.
- **Référencement et IA** : titre et description de la page, image de partage (existante), `sitemap.xml`, `robots.txt` qui autorise les robots des IA, données structurées (`SoftwareApplication` avec son prix, `FAQPage`, `Organization`), `llms.txt` (résumé du produit en texte simple pour les IA). Note : Google n'affiche presque plus les FAQ en résultats enrichis, mais les données structurées aident toujours les IA à comprendre la page.
- **Avant d'ouvrir à des inconnus** (pas pour la landing elle-même, mais pour ce qu'elle promet) : passer Supabase et Vercel en Pro ; faire du quota de stockage un quota **par utilisateur** (il est aujourd'hui celui de toute l'application) ; changement d'e-mail et de mot de passe ; export des données (promis par le RGPD, voir [product.md](product.md)) ; surveiller la limite de 100 e-mails par jour de Resend.

## Hors périmètre (plus tard)

- Pages par métier ou par usage (« Alternative à Calendly pour freelances », « Pour les coachs »…), utiles au référencement.
- Version anglaise.
- Témoignages et nombre d'utilisateurs : quand il y en aura de vrais (jamais de faux).
- Blog, newsletter.
- Code promo pour les abonnés de la chaîne (coupons Stripe, étape 6).
- Origine de l'inscription enregistrée dans le compte (« Comment nous avez-vous connu ? »).

## Technique

- `src/app/(landing)/page.tsx` : la landing remplace la redirection ; `/` sort des chemins privés (`src/lib/auth/paths.ts`), le proxy ne renvoie plus vers la connexion. La connexion reste à `/login`.
- Page **statique** (générée à la construction) pour la vitesse et le référencement ; seul le bouton de l'en-tête dépend de la connexion : un petit composant lit la session dans le navigateur, sans appel au serveur.
- Composants du design system, thèmes clair et sombre, tokens de `globals.css` ; responsive dès le départ (un visiteur YouTube arrive souvent du téléphone).
- Fichiers : `src/app/sitemap.ts`, `src/app/robots.ts`, `public/llms.txt`, données structurées en JSON-LD dans la page ; FAQ écrite une seule fois (un tableau de questions) et utilisée pour l'affichage et pour le JSON-LD.
- Nouveau service à l'*Inventaire technique* : Vercel Web Analytics (`@vercel/analytics`).

## Mise en œuvre

Ossature en place le 2026-10-19 (`src/app/(landing)/`) ; les blocs se construisent un par un, chacun d'après sa maquette validée.

- **En-tête** (`landing-shell.tsx`) : logo, ancres « Fonctionnalités », « Tarif », « FAQ » (masquées sur mobile), « Se connecter » (masqué sur petit écran) et « Essayer 7 jours » ; « Ouvrir mon espace » pour un visiteur connecté (`header-actions.tsx`). Boutons de l'en-tête **à l'encre** : le rouge revient au bouton principal de chaque bloc (un seul rouge par écran).
- **Blocs** : liste ordonnée dans `sections.ts` (ancre en français, libellé, titre, présence dans l'en-tête). Les autres blocs affichent leur titre et « Bloc à construire » ; appel final sur fond `stage`.
- **Hero** (`hero.tsx`, 2026-10-20), d'après la maquette A · Vitrine : à gauche l'étiquette « Pour les freelances », le titre, le sous-titre, « Essayer 7 jours » (le seul bouton rouge) et les trois réassurances ; à droite (`hero-showcase.tsx`) le profil public fictif d'Inès Robert dans une fenêtre de navigateur, avec ses onglets « Profil », « Rendez-vous », « Ressources » cliquables (onglets Base UI, utilisables au clavier) et l'adresse qui suit l'onglet. Sur mobile, la vitrine passe sous le texte, sans la colonne « Offre freelance » ni « Me contacter ».
- **Fonctionnalités** (`features.tsx`, 2026-10-20), d'après la maquette B · Alternance : l'en-tête du bloc (étiquette, titre, chapeau), puis une rangée par module, texte et fenêtre alternant de côté ; le texte est écrit une seule fois, dans un tableau de quatre modules. Les fenêtres (`feature-windows.tsx`) montrent l'espace privé (`/app/profile`, `/app/booking`, `/app/boards`, `/app/drive`) avec des données fictives, cachées aux lecteurs d'écran : le texte à côté dit la même chose. Étiquettes Public ou Privé : composant `Badge`. Écarts avec la maquette : **sans ombre portée** (règle du design system) ; le menu « Exporter le CV » est placé au-dessus de la colonne « Offre freelance » au lieu de la recouvrir ; trois rendez-vous au lieu de quatre (le quatrième était coupé). Sur mobile, le texte passe au-dessus de sa fenêtre ; les fenêtres perdent le bouton « Exporter le CV », la colonne « Offre freelance », deux colonnes du tableau, la recherche et les tailles des fichiers.
- **Outils remplacés** (`replaced-tools.tsx`, 2026-10-20), d'après la maquette B · Tableau : en-tête centré, rangée des cinq logos qui mène au carré MyWork (décorative), tableau Besoin / Outil habituel / Prix courant / Dans MyWork avec la ligne du total, note sur les prix et « Essayer 7 jours » (le seul rouge de l'écran). Les cinq outils sont écrits une seule fois et servent au tableau et à sa version mobile. Écarts avec la maquette : colonne MyWork sur fond uni (`muted`) plutôt qu'en lumière de studio, qui faisait des taches cellule par cellule ; sur tablette, la colonne « Besoin » passe sous le nom de l'outil ; **sur téléphone, le tableau devient une liste** (outil, usage, prix, puis « Dans MyWork : … »), et le total deux cases « Séparément » et « Avec MyWork ».
- **Tarif** (`pricing.tsx`, 2026-10-20), d'après la maquette B · Deux formules : en-tête en deux colonnes, cartes « Mensuel » (bouton à contour) et « Annuel » (filet encre, lumière de studio, « 2 mois offerts », 60 € barré, le seul bouton rouge ; en premier sur mobile), « Inclus dans les deux formules », bandeau de l'essai. Les deux boutons mènent à `/signup` (libellés accessibles « Essayer 7 jours, formule mensuelle / annuelle ») ; la formule choisie sera transmise à l'inscription avec le paiement (étape 6).
- « Voir un profil en exemple » est **masqué** tant que l'adresse du profil public du porteur du projet n'est pas renseignée (`EXAMPLE_PROFILE_PATH` dans `hero.tsx`) : mieux vaut pas de bouton qu'un lien vers une page introuvable.
- **Pied de page** : logo, « © 2026 MyWork », interrupteur de thème. Pages légales, contact et chaîne YouTube viendront avec leurs blocs.
- Le pied de page « Créé avec MyWork » des pages publiques (profil, page introuvable, page de l'invité) mène désormais à la landing.
- Pas encore : `robots.txt`, `sitemap.xml`, `llms.txt`, données structurées (avec la FAQ), Vercel Web Analytics (au lancement).
- **Attention** : chaque push sur `main` part en production. Tant que les blocs ne sont pas construits, publier l'ossature affiche des « Bloc à construire » sur `hellomywork.com`.

## Tests

`e2e/landing.spec.ts` couvre les trois premiers points ci-dessous (2026-10-19), les onglets du hero, qui changent l'adresse affichée, le lien « Fonctionnalités » de l'en-tête, qui mène au bloc et à ses quatre modules, le tableau des outils remplacés (cinq logos, total, lien vers l'inscription) et le tarif (deux formules, essai, liens vers l'inscription) (2026-10-20).

- Un visiteur non connecté qui ouvre `/` voit la landing (plus de redirection vers `/login`) ; « Se connecter » mène à `/login`, « Essayer 7 jours » à `/signup`.
- Un utilisateur connecté voit « Ouvrir mon espace », qui mène à `/app`.
- Les ancres mènent aux bons blocs ; la page fonctionne au clavier.
- Le JSON-LD de la FAQ reprend exactement les questions affichées ; `robots.txt`, `sitemap.xml` et `llms.txt` répondent.
- Le lien du pied de page des profils publics mène à la landing.
- Les pages légales existent et sont liées depuis le pied de page.

## Décisions validées

Proposées le 2026-10-19 sans le porteur du projet, à sa demande, et validées par lui le même jour.

1. **Stockage : 10 Go** au lieu d'1 Go (coût maximal 0,21 $ par abonné et par mois ; 1 Go affaiblit l'argument face aux 15 Go gratuits de Google).
2. **Formule annuelle** à 50 € (deux mois offerts), en plus des 5 € par mois : moins de frais Stripe, abonnés plus fidèles.
3. ~~Essai gratuit de 30 jours, sans carte bancaire~~ : remplacé le 2026-10-19 par le porteur du projet par un **abonnement pris à l'inscription, avec 7 jours d'essai** avant le premier prélèvement (voir *Tarif*).
4. ~~Accès anticipé gratuit tant que le paiement n'existe pas~~ : retiré le 2026-10-19, sans paiement pas d'inscription publique.
5. **Ne pas compter LinkedIn Premium** dans les outils remplacés ; prix datés. ~~Noms des outils sans logos~~ : le porteur du projet veut les **vrais logos** (2026-10-20, voir *Logos des outils*).
6. Bouton « **Voir un profil en exemple** » vers le vrai profil public du porteur du projet.
7. ~~Bloc « Qui est derrière MyWork », avec photo et lien vers la chaîne YouTube~~ : retiré le 2026-10-20 par le porteur du projet.
8. **Vidéo de démonstration** dans le hero, chargée seulement au clic (pas de cookie, pas de bandeau).
9. **Vouvoiement**, comme dans l'application (le tutoiement, courant sur YouTube, reste possible).
10. FAQ **toujours dépliée** et tenue à jour à chaque changement du produit.
11. **Vercel Web Analytics** pour la mesure d'audience, sans cookie.
12. Visiteur connecté : la landing reste affichée à `/`, avec « Ouvrir mon espace », plutôt qu'une redirection automatique vers `/app`.
13. Le nom reste **MyWork** sur la page ; « hello » ne vit que dans l'adresse.
