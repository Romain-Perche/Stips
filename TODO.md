# TODO — Stips

**Une seule numérotation, de 1 à 18, valable pour tout le fichier.** Les sections ne font que
regrouper — par urgence, puis par qui fait quoi (Romain, ou Claude dans une discussion dédiée :
voir `AGENTS.md`, une étape par conversation). Le numéro, lui, donne l'ordre à suivre de bout en
bout ; ce qui peut se recouvrir est dit en fin de fichier.

**Objectif actuel : une app de démo**, pas une mise en production. Ce qui bloque une vraie
mise en ligne est parqué dans [`backend/README.md`](backend/README.md) § avant la mise en
ligne réelle, et n'apparaît pas ici.

---

## 🔴 Maintenant

| # | Tâche | Qui | Débloque |
|---|---|---|---|
| 1 | **Écrire le schéma Drizzle** | Claude | tout le backend |
| 2 | Créer le projet Supabase (région **UE**) | Romain | l'auth et le stockage des CV |
| 3 | Prendre le nom de domaine | Romain | rien tout de suite, mais c'est le seul point qui a une horloge |

Le domaine gèle le bundle id à la première TestFlight externe — 10 à 15 €/an, à prendre avant
d'en avoir besoin plutôt qu'après.

## 🟠 Ensuite

| # | Tâche | Qui |
|---|---|---|
| 4 | Serveur Fastify + `GET /config` | Claude |
| 5 | `packages/api` — schémas zod et client HTTP | Claude |
| 6 | ~~Renommer le modèle de rôles dans le code~~ ✅ 16 août 2026 | Claude |
| 7 | ~~Porter les deux écrans en React Native~~ ✅ 16 août 2026 | Claude |
| 8 | Corriger le type `Offre` | Claude |
| 9 | Créer le projet Railway, région **EU West** | Romain |
| 10 | Choisir le fournisseur d'e-mail | Romain |

## ⚪ Plus tard

| # | Tâche | Qui |
|---|---|---|
| 11 | Auth par lien magique + flux de parrainage complet | Claude |
| 12 | Brancher les écrans sur l'API (retirer `DATA`) | Claude |
| 13 | Trancher : in-app purchase ou paiement web | Romain |
| 14 | Créer le compte Stripe (mode test d'abord) | Romain |
| 15 | Brancher Stripe : Checkout + webhook `invoice.paid` | Claude |
| 16 | ~~Cocher la CI comme check requis sur `main`~~ ✅ 21 août 2026 | Romain |
| 17 | Valider les données de remplissage des boîtes | Romain |
| 18 | Trancher le nom d'un membre : « Stipeur » ou « Stiper » | Romain |

---

# Pour Claude — une discussion par tâche

Les numéros sont ceux des tableaux ci-dessus, d'où les trous : ce qui manque est une tâche de
Romain. Chaque bloc dit l'enjeu, ce qu'il faut lire avant, et le piège.

### 1. Écrire le schéma Drizzle

**Enjeu.** C'est la traduction en code des dix-huit tables décidées. Une migration appliquée
ne se défait pas : ce qui est mal nommé ou mal typé ici se paie pendant des mois.

**À lire d'abord.** [`backend/SCHEMA.md`](backend/SCHEMA.md) pour la carte,
[`backend/README.md`](backend/README.md) § le schéma pour le raisonnement derrière chaque
choix.

**Les pièges.**
- Les contraintes doivent être **dans la base**, pas dans le code : clé primaire composite sur
  `vote` et sur `inscription`, index unique sur la paire de `conversation`, `ON DELETE` différent
  selon la table (voir la règle 5.1.1(v) dans le README).
- Aucun compteur, sauf `fil.score`, `fil.rang` et `conversation.dernier_message_at` — et
  seulement parce que ce sont des clés de tri.
- **`fil.rang` est une colonne générée** (`GENERATED ALWAYS AS … STORED`), pas une valeur que le
  code met à jour : c'est ce qui rend impossible de l'oublier après un vote. Index sur
  `(forum_id, rang DESC)`. Le fuseau doit être **écrit dans l'expression**
  (`created_at AT TIME ZONE 'UTC'`) et non réglé sur la base : une colonne générée exige une
  expression `IMMUTABLE`, et `extract(epoch FROM timestamptz)` ne l'est pas tant que le fuseau
  vient de la session. Voir le § du forum dans `backend/README.md`.
- **Déplacer `stripe_customer_id` de `abonnement` vers `personne`** (`unique`, nullable). Un
  `cus_…` identifie la personne à vie, pas une période payée : laissé sur `abonnement`, il se
  recopie à chaque renouvellement. C'est maintenant qu'on le corrige, une migration appliquée
  ne se défait pas. Voir la tâche 15.
- Ne **pas** lancer la migration sur une base autre qu'une base locale jetable (`AGENTS.md`).
  Écrire le fichier, oui ; l'appliquer, non.
- Le rang de liste d'attente (`inscription`, sans rapport avec `fil.rang`) est une fonction
  fenêtre. Si Drizzle ne l'exprime pas, du SQL brut, pas un contournement en JavaScript.

### 4. Serveur Fastify + `GET /config`

**Enjeu.** La première route, et la seule dont le contrat est immortel : c'est elle qui dit aux
vieux binaires d'aller se mettre à jour. Elle n'a besoin ni de base ni d'auth, donc elle peut
partir avant tout le reste.

**À lire d'abord.** [`backend/README.md`](backend/README.md) § `GET /config` et § versionner
l'API. Le client existe déjà : `mobile/src/config/miseAJour.ts`, désactivé par un flag.

**Les pièges.**
- `/config` reste **à la racine**, jamais sous `/v1` — sinon `/v1` ne pourra jamais être éteint.
  Sa forme est fixée par `ConfigDistante` dans `packages/core/src/version.ts` : on n'y retire
  jamais un champ, on n'en change jamais le type.
- **Écouter sur `0.0.0.0` et `process.env.PORT`** dès la première ligne, pas au moment du
  déploiement : Fastify écoute `localhost` par défaut et Railway renverra un 502 sans rien
  expliquer.
- `backend/` devient un workspace npm : l'installation reste à la racine (hoisting), donc les
  commandes Railway ciblent `-w backend`. Voir `backend/README.md` § Railway.

### 5. `packages/api` — schémas zod et client HTTP

**Enjeu.** C'est la frontière entre le backend et les deux apps. Une seule déclaration par
forme de réponse, et la validation à l'exécution vient avec.

**À lire d'abord.** [`backend/README.md`](backend/README.md) § d'où viennent les types, et
§ deux projections d'une même personne.

**Les pièges.**
- **Les types Drizzle ne sont pas le contrat.** Renvoyer un type de ligne recolle le format de
  fil à la forme des tables, ce qui est exactement ce qu'on refuse un niveau plus bas.
- **Deux schémas distincts** pour une personne : `PersonneAnnuaire` (partie 1) et
  `PersonneRecrutement` (partie 2 + notes + recos + CV). Le jour où une route d'annuaire renvoie
  le second, les recos fuient. C'est le risque de fuite principal de tout le produit.
- Va dans `packages/api`, **pas** dans `packages/core` : core est pur, sans dépendance runtime,
  `fetch` n'y est même pas typé.

### 6. ~~Renommer le modèle de rôles dans le code~~ · fait le 16 août 2026

`Role` vaut `'membre' | 'pro'` ; les deux rôles ont cinq onglets et un seul écran de
différence (`ScreenStagesCandidat` contre `ScreenOffres`) ; `ScreenTalents` n'est plus un
onglet mais le seul `TalentDeck` que monte `ScreenOffres` ; la partie 2 de « Qui suis-je ? »
est réservée au membre ; `DATA` a perdu ses `cats`, l'Agenda ses filtres, et `offres.resume`
son incohérence. Web et mobile dans le même commit.

Le rôle courant passe par un **contexte** (`frontend/src/role.ts`, `mobile/src/role.ts`) et
non par une prop : deux consommateurs seulement, mais profondément enfouis, et côté mobile
React Navigation ne transmet que ses propres props. Sa valeur `null` (personne n'est
connecté) est ce qui laisse l'écran d'invitation sans badge.

### 7. ~~Porter les deux écrans en React Native~~ · fait le 16 août 2026

`ScreenOffres` (bascule Offres / Talents, détail des candidatures d'une offre, compteurs
calculés) et `ScreenStagesCandidat` (filtre, candidature) existent des deux côtés, avec le
même découpage `TalentDeck` qu'en web.

### 8. Corriger le type `Offre`

**Enjeu.** `Offre` n'a **pas d'employeur** ni de date limite. Invisible tant que seul le pro
regardait ses propres offres ; l'écran Stages du membre laisse un trou visible à la place.

**Ce qu'il y a à faire.** Ajouter l'entreprise, le lieu, la durée en mois et une date de
clôture ; arrêter de mélanger une date de publication et un compteur de non-lues dans `pied`.
Puis reprendre les deux écrans qui l'affichent, web et mobile.

**Le piège.** Ça touche `packages/core`, donc le hook pre-commit relance les vérifications sur
`frontend` **et** `mobile` : les deux doivent compiler dans le même commit.

### 11. Auth par lien magique + flux de parrainage

**Enjeu.** La plus grosse pièce, et le cœur du produit : on n'entre que parrainé. Deux origines,
une seule table, une machine à états, et un formulaire web pour un pro qui n'a pas de compte.

**À lire d'abord.** [`backend/README.md`](backend/README.md) § le flux d'inscription et § auth,
puis [`Description projet.md`](Description%20projet.md) § entrée dans Stips.

**Les pièges.**
- **Le formulaire du pro est une page web** dans `frontend/`, jamais l'app ni un PDF : c'est le
  point de conversion le plus critique du produit.
- Le mécanisme du lien magique **ne s'écrit pas à la main** — celui de Supabase. Entropie,
  usage unique, expiration, rejeu : le seul endroit de la pile où le faire soi-même est un
  mauvais calcul.
- Pas de login social, jamais : c'est ce qui dispense de « Sign in with Apple » (règle 4.8).
- `parrainage` porte des identités en **texte** aux premières étapes, et `parrain_nom` ne
  s'efface jamais.

### 12. Brancher les écrans sur l'API

**Enjeu.** Remplacer `DATA` par de vrais appels. C'est le moment où `packages/core/src/data.ts`
disparaît.

**Le piège.** **Valider toute donnée qui entre**, aux deux frontières. Un type TypeScript
décrit ce que le backend a promis, pas ce qu'il a envoyé. Le geste existe déjà en miniature
dans `mobile/src/config/miseAJour.ts` : une réponse malformée dégrade vers `null` au lieu de
lever.

### 15. Brancher Stripe

**Enjeu.** Les 100 €/an. Techniquement la pièce la plus simple du backend — Stripe héberge le
formulaire, donc aucune donnée de carte ne traverse notre serveur et le périmètre PCI-DSS
disparaît. Le risque est ailleurs, entièrement dans l'ordre des opérations.

**Bloqué par une décision, pas par du code.** Ne rien écrire avant que Romain ait tranché
IAP ou paiement web (tâche 13) : la règle 3.1.1 d'Apple impose l'achat intégré, et sa
commission, pour un service numérique consommé dans l'app. L'adhésion conditionne le forum,
la messagerie et le deck — donc l'exception 3.1.3(e) sur les services consommés hors de l'app
ne va pas de soi. Construire le flux Stripe avant cette décision, c'est risquer de le jeter.

**À lire d'abord.** [`backend/SCHEMA.md`](backend/SCHEMA.md) § table `abonnement`, et la
répartition des secrets dans [`AGENTS.md`](AGENTS.md).

**Les pièges.**
- **Le webhook est la source de vérité, jamais l'`success_url`.** Accorder l'accès au retour de
  redirection est le bug classique : la personne peut fermer l'onglet avant qu'elle parte, ou
  appeler l'URL à la main. On insère la ligne `abonnement` sur `invoice.paid`, pas au retour.
- **Vérifier la signature `Stripe-Signature`** avec le secret de webhook, sinon n'importe qui
  poste un faux `invoice.paid` et s'offre l'adhésion.
- **`stripe_customer_id` est sur la mauvaise table** dans le schéma actuel : un `cus_…`
  identifie la personne à vie, pas une période payée. Sur `abonnement`, il se recopie à chaque
  renouvellement — autant d'occasions de diverger. À déplacer vers `personne` (`unique`,
  nullable) **au moment d'écrire le schéma Drizzle** (tâche 1), pas après la première migration.
- L'accès se teste en SQL local (`now() BETWEEN debut AND fin`), sans jamais rappeler l'API
  Stripe sur le chemin d'une requête.
- `sk_…` et le secret de webhook restent côté serveur ; seule `pk_…` peut entrer dans l'app.

---

# Pour Romain

Mêmes numéros, mêmes trous : ce qui manque est une tâche de Claude.

| # | Tâche | Pourquoi c'est toi | Quand |
|---|---|---|---|
| 2 | Créer le projet Supabase, région UE | il faut un compte et une carte | 🔴 maintenant |
| 3 | Prendre le nom de domaine | pareil, et le bundle id en dépend | 🔴 maintenant |
| 9 | Créer le projet **Railway**, région **EU West** (elle ne l'est pas par défaut) | il faut un compte | 🟠 avant le premier build sur un téléphone qui n'est pas le tien |
| 10 | Choisir le fournisseur d'e-mail (Resend, Postmark, Scaleway TEM) | décision + compte + DNS | 🟠 avant que de vraies personnes reçoivent des invitations |
| 13 | Trancher IAP ou paiement web | décision business, 15 à 30 % de commission en jeu — et elle bloque la tâche 15, pas l'inverse | ⚪ avant la release qui introduit le paiement |
| 14 | Créer le compte Stripe, en mode test | il faut un compte, un IBAN et une vérification d'identité ; le mode test suffit pour que je construise le flux | ⚪ après avoir tranché 13 |
| 16 | ~~Cocher la CI comme check requis sur `main`~~ ✅ 21 août 2026 | ça vit dans les réglages GitHub, pas dans le repo | fait — un `git push origin main` direct est désormais refusé, tout passe par une PR dont `verifications` est vert |
| 17 | Valider les boîtes de remplissage | Deloitte, BNP et Sia Partners sont inventées | ⚪ quand tu veux |
| 18 | Trancher « Stipeur » ou « Stiper » | c'est un nom de marque, pas une décision technique — j'ai mis « Stipeur » en attendant, c'est une ligne de `ROLES` dans `packages/core/src/tokens.ts` et rien d'autre | ⚪ quand tu veux |

---

## Ce qui peut avancer en parallèle

L'ordre 1 → 18 est une file d'attente sûre, pas une contrainte : trois chantiers sont
indépendants, donc oui, ça se recouvre.

- **Pendant que j'écris le schéma Drizzle (1)**, tu peux créer le projet Supabase (2) et prendre
  le domaine (3). Aucun des deux ne me bloque, et les deux me débloqueront pour la tâche 11.
- **`GET /config` (4) ne dépend de rien** — ni base, ni auth, ni schéma. Il peut se faire avant,
  pendant ou après le schéma, dans n'importe quel ordre.
- **La correction d'`Offre` (8)** est du travail front, sans aucun lien avec le backend (comme
  l'étaient 6 et 7, faites). Elle peut s'intercaler n'importe où.

En revanche, **5 attend 1** (les schémas zod décrivent le schéma), **11 attend 1 et 2**, et
**12 attend 4, 5 et 11**.

**15 (Stripe) n'attend pas du code mais une décision** : tant que 13 (IAP ou paiement web) n'est
pas tranché, l'écrire revient peut-être à l'écrire pour rien. Seul le déplacement de
`stripe_customer_id` est à faire tout de suite, dans la tâche 1 — il ne dépend d'aucune des
deux options.
