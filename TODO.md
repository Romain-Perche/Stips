# TODO — Stips

**Une seule numérotation, de 1 à 20, valable pour tout le fichier.** Les sections ne font que
regrouper — par urgence, puis par qui fait quoi (Romain, ou Claude dans une discussion dédiée :
voir `AGENTS.md`, une étape par conversation). Le numéro, lui, donne l'ordre à suivre de bout en
bout ; ce qui peut se recouvrir est dit en fin de fichier.

**Objectif actuel : le site web d'abord** (décidé le 20 septembre 2026), l'app store plus
tard. Le site est *mobile-first* : on retire le cadre téléphone de `frontend/`, l'app remplit
l'écran sur un téléphone et devient une colonne centrée sur ordinateur (comme threads.net).
Pas de refonte desktop des huit écrans — seules les pages du pro (invitation, talents)
pourront s'élargir plus tard, quand on saura qu'elles sont ouvertes depuis un bureau.

Pourquoi : le lent n'est pas les écrans, qui existent déjà des deux côtés, mais la chaîne
store (EAS, TestFlight, Play Console, revue) et le backend. Le web supprime la première et
garde la seconde, qui est de toute façon commune. `mobile/` reste dans le repo, en pause :
rien à y supprimer, rien à y porter tant que le site n'a pas de vrais utilisateurs.

Ce qui bloque une vraie mise en ligne est parqué dans [`backend/README.md`](backend/README.md)
§ avant la mise en ligne réelle, et n'apparaît pas ici.

---

## 🔴 Maintenant

| # | Tâche | Qui | Débloque |
|---|---|---|---|
| 19 | ~~Retirer le cadre téléphone du site~~ ✅ 27 sept. 2026 | Claude | le site est un vrai site |
| 1 | ~~Écrire le schéma Drizzle~~ ✅ 3 octobre 2026 | Claude | tout le backend |
| 2 | ~~Créer le projet Supabase (région **UE**)~~ ✅ 28 sept. 2026 | Romain | l'auth et le stockage des CV |
| 3 | ~~Prendre le nom de domaine~~ ✅ 4 octobre 2026 | Romain | la mise en ligne du site (20) |

Le domaine est `stips.club`, acheté chez Vercel (renouvellement automatique) et déjà rattaché
au projet `le-club`. Le bundle id est passé à `club.stips.app` ; il se fige le jour d'une TestFlight externe.

## 🟠 Ensuite

| # | Tâche | Qui |
|---|---|---|
| 4 | ~~Serveur Fastify + `GET /config`~~ ✅ 3 octobre 2026 | Claude |
| 5 | ~~`packages/api` — schémas zod et client HTTP~~ ✅ 3 octobre 2026 | Claude |
| 6 | ~~Renommer le modèle de rôles dans le code~~ ✅ 16 août 2026 | Claude |
| 7 | ~~Porter les deux écrans en React Native~~ ✅ 16 août 2026 | Claude |
| 8 | ~~Corriger le type `Offre`~~ ✅ 30 septembre 2026 | Claude |
| 9 | ~~Créer le projet Railway, région **EU West**~~ ✅ 6 octobre 2026 | Romain |
| 10 | Choisir le fournisseur d'e-mail | Romain |
| 20 | Mettre le site en ligne (hébergement statique + domaine) | Romain |

## ⚪ Plus tard

| # | Tâche | Qui |
|---|---|---|
| 11 | Auth par lien magique + flux de parrainage complet | Claude |
| 12 | Brancher les écrans sur l'API (retirer `DATA`) — `frontend/` d'abord, `mobile/` quand il reprendra | Claude |
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

### 19. ~~Retirer le cadre téléphone du site~~ · fait le 27 septembre 2026

`.ph` dans `frontend/src/styles.css` vaut `width: min(100vw, 480px)` et `height: 100dvh`,
sans rayon ni ombre : plein écran sur un téléphone, colonne centrée de 480 px sur un
ordinateur. `DevChrome` est passé en flottant, l'entrée « invitation » n'ayant pas encore de
lien. Un seul conteneur défile par écran (`.defile`), en-tête compris ; la barre d'onglets,
le bouton flottant et le CTA restent collés en bas, `.ph` pour repère. Les écrans n'ont pas
été élargis. Reste à vérifier sur un vrai iPhone que la barre d'onglets ne passe pas sous la
barre d'adresse de Safari.

### 1. ~~Écrire le schéma Drizzle~~ · fait le 3 octobre 2026

Les dix-huit tables sont dans `backend/src/db/schema.ts`, la première migration dans
`backend/drizzle/`, appliquée sur la base Supabase le 4 octobre 2026. Les contraintes vivent dans la base :
clés composites, paire ordonnée et unique sur `conversation`, `CHECK` sur les votes et les
dates, `ON DELETE` selon la règle 5.1.1(v). `fil.rang` est une colonne générée, fuseau écrit
dans l'expression. Le rang de liste d'attente est la vue `inscription_rang`. Vérifié sur une
base jetable : double vote refusé, liste d'attente qui promeut le suivant, cascades conformes.

Le client est `backend/src/db/client.ts` (driver `postgres`, même `casing` que le schéma) ;
personne ne l'importe encore. La migration s'applique depuis `backend/` avec
`node --env-file=.env ../node_modules/drizzle-kit/bin.cjs migrate` — `.env` n'est pas chargé
par défaut, exprès : viser la vraie base doit rester un geste délibéré.

### 4. ~~Serveur Fastify + `GET /config`~~ · fait le 3 octobre 2026

Le serveur est dans `backend/src/serveur.ts`, lancé par `npm start -w backend` depuis la racine
(Node 24 retire les types, pas de build). `/config` est à la racine, hors de `/v1`, typée par
`ConfigDistante`. Écoute sur `0.0.0.0` et `process.env.PORT` (3000 en local). `versionMinimale`
vaut `0.0.0` : ne bloque personne. `packages/core` est passé en `"type": "module"` pour que le
backend (résolution `nodenext`) puisse lire ses types. Vérifié en local : `/config` répond 200,
`/v1/config` 404. Reste à brancher le mobile, une fois l'URL Railway connue (tâche 9).

### 5. ~~`packages/api` — schémas zod et client HTTP~~ · fait le 3 octobre 2026

Tout est dans `packages/api/src/index.ts` : les schémas zod, les types inférés, et
`creerClient`, qui valide chaque réponse contre son schéma (`ErreurApi`, avec le statut HTTP —
426 compris). `PersonneAnnuaire` (partie 1) et `PersonneRecrutement` (+ partie 2, recos, URL
signée du CV) sont deux déclarations ; `z.object` retire les clés non déclarées, donc une route
d'annuaire qui parse une ligne complète n'en laisse sortir que la partie 1 — un test le garde.
zod vient de `zod/v4` (déjà installé par Expo, rien de téléchargé). Pas de « notes » : le
qualificatif les remplace. Pas de photo : aucune colonne en base. Expériences et en-tête d'auth
viendront avec la première route qui les sert. Personne ne l'importe encore.

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

### 8. ~~Corriger le type `Offre`~~ · fait le 30 septembre 2026

`Offre` a perdu `meta` et `pied` pour les champs de la table `offre` : `entreprise` (par
valeur, vers `Boite.nom`), `lieu`, `dureeMois`, `publieeLe`, `clotureeLe` (optionnelle), dates
en ISO. Les non-lues restent comptées depuis `DATA.candidatures`. `dateCourte` (core) écrit
« 2 sept. » à l'identique sur web et mobile. Le membre voit l'employeur et la date limite ; le
pro garde l'employeur implicite et voit la date de publication. Une offre dont la clôture est
passée reste affichée : aucune ne l'est dans les données factices.

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
- **La Data API de Supabase est coupée, et doit le rester.** Nos tables n'ont pas de RLS :
  la rallumer rendrait toute la base lisible avec l'URL du projet et la clé publique.

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
- **`stripe_customer_id` est sur `personne`** (`unique`, nullable), déplacé dans la tâche 1 :
  un `cus_…` identifie la personne à vie, pas une période payée. Le webhook retrouve la
  personne par cette colonne, puis insère une ligne `abonnement` par période.
- L'accès se teste en SQL local (`now() BETWEEN debut AND fin`), sans jamais rappeler l'API
  Stripe sur le chemin d'une requête.
- `sk_…` et le secret de webhook restent côté serveur ; seule `pk_…` peut entrer dans l'app.

---

# Pour Romain

Mêmes numéros, mêmes trous : ce qui manque est une tâche de Claude.

| # | Tâche | Pourquoi c'est toi | Quand |
|---|---|---|---|
| 2 | ~~Créer le projet Supabase, région UE~~ ✅ 28 sept. 2026 | il faut un compte et une carte | fait — plan gratuit, Data API coupée |
| 3 | ~~Prendre le nom de domaine~~ ✅ 4 oct. 2026 | pareil, et le site (20) comme le bundle id en dépendent | fait — `stips.club`, chez Vercel |
| 9 | ~~Créer le projet **Railway**, région **EU West**~~ ✅ 6 oct. 2026 | il faut un compte | fait — projet `Stips`, vide : ni service ni URL tant qu'on n'a pas déployé (se génère dans Settings → Networking) |
| 10 | Choisir le fournisseur d'e-mail (Resend, Postmark, Scaleway TEM) | décision + compte + DNS | 🟠 avant que de vraies personnes reçoivent des invitations |
| 20 | Mettre le site en ligne — hébergement statique du build Vite (Vercel, Netlify ou Cloudflare Pages), branché sur le domaine | il faut un compte et le DNS ; `GET /config` et l'API iront chez Railway (9), le site statique n'a pas besoin de serveur | 🟠 dès que 19 et 3 sont faits — un site en ligne avec des données factices est déjà une démo qu'on peut envoyer |
| 13 | Trancher IAP ou paiement web | décision business, 15 à 30 % de commission en jeu — et elle bloque la tâche 15, pas l'inverse | ⚪ avant la release qui introduit le paiement |
| 14 | Créer le compte Stripe, en mode test | il faut un compte, un IBAN et une vérification d'identité ; le mode test suffit pour que je construise le flux | ⚪ après avoir tranché 13 |
| 16 | ~~Cocher la CI comme check requis sur `main`~~ ✅ 21 août 2026 | ça vit dans les réglages GitHub, pas dans le repo | fait — un `git push origin main` direct est désormais refusé, tout passe par une PR dont `verifications` est vert |
| 17 | Valider les boîtes de remplissage | Deloitte, BNP et Sia Partners sont inventées | ⚪ quand tu veux |
| 18 | Trancher « Stipeur » ou « Stiper » | c'est un nom de marque, pas une décision technique — j'ai mis « Stipeur » en attendant, c'est une ligne de `ROLES` dans `packages/core/src/tokens.ts` et rien d'autre | ⚪ quand tu veux |

---

## Ce qui peut avancer en parallèle

L'ordre 1 → 20 est une file d'attente sûre, pas une contrainte : trois chantiers sont
indépendants, donc oui, ça se recouvre.

- **Le schéma Drizzle (1) est fait, et appliqué sur le projet Supabase (2).** La tâche 11
  peut commencer ; le domaine (3) reste à prendre avant que de vraies personnes la voient.
- **`GET /config` (4) et le cadre téléphone (19) sont faits.** Le site est montrable : la
  mise en ligne (20) n'attend plus que le domaine (3).

En revanche, **11 n'attend plus rien** (1 et 2 sont faits), et **12 attend 4, 5 et 11**.

**15 (Stripe) n'attend pas du code mais une décision** : tant que 13 (IAP ou paiement web) n'est
pas tranché, l'écrire revient peut-être à l'écrire pour rien. Le déplacement de
`stripe_customer_id`, qui ne dépendait d'aucune des deux options, est déjà fait dans la tâche 1.
