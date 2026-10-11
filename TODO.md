# TODO — Stips

**Objectif : le site web d'abord** (décidé le 20 septembre 2026), l'app store plus tard. Le
site est *mobile-first* : plein écran sur un téléphone, colonne centrée sur ordinateur (comme
threads.net). `mobile/` reste dans le repo, en pause : rien à y porter tant que le site n'a
pas de vrais utilisateurs.

Pourquoi : le lent n'est pas les écrans, qui existent des deux côtés, mais la chaîne store
(EAS, TestFlight, Play Console, revue) et le backend. Le web supprime la première et garde la
seconde, qui est de toute façon commune.

Ce qui bloque une vraie mise en ligne est parqué dans [`backend/README.md`](backend/README.md)
§ avant la mise en ligne réelle, et n'apparaît pas ici.

**Un numéro ne change jamais** : des commits et d'autres fichiers citent « tâche 9 ». D'où les
trous et l'ordre non trié. Une tâche finie descend dans § Fait, avec son numéro.

---

## À faire

Dans l'ordre où les prendre. Claude : une discussion par tâche (voir `AGENTS.md`).

| # | Tâche | Qui | Attend | Quand |
|---|---|---|---|---|
| 22 | Ajouter un code à 6 chiffres au lien de connexion | Claude | — | 🟠 maintenant |
| 23 | Rassembler les textes des e-mails et des écrans dans un seul fichier | Claude | — | ⚪ ensuite |
| 12 | Brancher les écrans sur l'API (retirer `DATA`) — `frontend/` d'abord, `mobile/` quand il reprendra | Claude | — | ⚪ ensuite |
| 13 | Trancher : in-app purchase ou paiement web | Romain | — | ⏸ fin de la bêta |
| 14 | Créer le compte Stripe (mode test d'abord) | Romain | 13 | ⏸ fin de la bêta |
| 15 | Brancher Stripe : Checkout + webhook `invoice.paid` | Claude | 13, 14 | ⏸ fin de la bêta |
| 17 | Valider les données de remplissage des boîtes | Romain | — | ⚪ quand tu veux |
| 18 | Trancher le nom d'un membre : « Stipeur » ou « Stiper » | Romain | — | ⚪ quand tu veux |

**Ce qui se recouvre.** 15 n'attend pas du code mais une décision (13) : l'écrire avant,
c'est peut-être l'écrire pour rien.

**La bêta est gratuite, sans date de fin fixée** (décidé le 8 octobre 2026). 13, 14 et 15
attendent sa fin : d'ici là, un parrainage accepté suffit et rien ne regarde `abonnement`. Voir
[`Description projet.md`](Description%20projet.md) § modèle économique.

---

## Pour Claude

Chaque bloc dit l'enjeu, ce qu'il faut lire avant, et le piège.

### 12. Brancher les écrans sur l'API

**Enjeu.** Remplacer `DATA` par de vrais appels. C'est le moment où `packages/core/src/data.ts`
disparaît. Le serveur tourne sur Railway (`https://api.stips.club`) ; il n'a encore que les
routes d'auth et de parrainage : celles des offres, de l'annuaire et du deck sont à écrire.

**Le piège.** **Valider toute donnée qui entre**, aux deux frontières. Un type TypeScript
décrit ce que le backend a promis, pas ce qu'il a envoyé. `creerClient` (`packages/api`) le
fait déjà ; côté mobile, `mobile/src/config/miseAJour.ts` montre le geste en miniature : une
réponse malformée dégrade vers `null` au lieu de lever.

### 22. Un code à 6 chiffres dans l'e-mail de connexion

**Enjeu.** Le lien magique connecte le navigateur qui l'ouvre, pas celui qui l'a demandé : lien
ouvert sur le téléphone alors qu'on attendait sur l'ordinateur, ou dans le navigateur intégré de
l'app Gmail sur iPhone — la session y reste, Safari n'en sait rien. Un code tapé sur la page de
`/connexion` règle les deux (comme Slack ou Notion). Les invitations restent en lien seul : on y
arrive depuis l'e-mail de toute façon.

**À lire d'abord.** `backend/src/routes/auth.ts` (`/v1/auth/verifier`), `frontend/src/pages/PageConnexion.tsx`.
Côté Supabase, `{{ .Token }}` dans le gabarit « Magic Link », et
`verifyOtp({ email, token, type: 'email' })`.

**Les pièges.**
- **Six chiffres valables 24 h se devinent** s'il n'y a pas de plafond d'essais. Limiter les
  essais par e-mail côté serveur.
- **Tous les appels à Supabase partent de l'IP de Railway** : la limite de Supabase sur les
  vérifications de jeton (par IP) vaut donc pour tous les membres à la fois, liens compris.
  À regarder dans Authentication → Rate Limits avant d'en dépendre.
- Le code et le lien sont le même jeton : utiliser l'un consomme l'autre.
- Mettre à jour le gabarit « Magic Link » dans Supabase en même temps que le déploiement.

### 23. Les textes dans un seul fichier

**Enjeu.** Romain veut voir et changer les textes sans fouiller le code. Un seul fichier (lu par
`backend/` et `frontend/`) qu'il modifie depuis GitHub ; en ligne deux minutes après le merge.
Une page d'admin avec les textes en base viendra peut-être après 12, si un fichier ne suffit plus.

**Le piège.** Les deux e-mails d'auth (« Invite user », « Magic Link ») ne peuvent pas y entrer :
Supabase les envoie, leur texte vit dans son dashboard (Authentication → Email Templates).

### 15. Brancher Stripe

**Enjeu.** Les 100 €/an. Techniquement la pièce la plus simple du backend — Stripe héberge le
formulaire, donc aucune donnée de carte ne traverse notre serveur et le périmètre PCI-DSS
disparaît. Le risque est ailleurs, entièrement dans l'ordre des opérations.

**Bloqué par une décision, pas par du code.** Ne rien écrire avant que Romain ait tranché
IAP ou paiement web (13) : la règle 3.1.1 d'Apple impose l'achat intégré, et sa commission,
pour un service numérique consommé dans l'app. L'adhésion conditionne le forum, la messagerie
et le deck — donc l'exception 3.1.3(e) sur les services consommés hors de l'app ne va pas de
soi.

**À lire d'abord.** [`backend/SCHEMA.md`](backend/SCHEMA.md) § table `abonnement`, et la
répartition des secrets dans [`AGENTS.md`](AGENTS.md).

**Les pièges.**
- **Le webhook est la source de vérité, jamais l'`success_url`.** Accorder l'accès au retour de
  redirection est le bug classique : la personne peut fermer l'onglet avant qu'elle parte, ou
  appeler l'URL à la main. On insère la ligne `abonnement` sur `invoice.paid`, pas au retour.
- **Vérifier la signature `Stripe-Signature`** avec le secret de webhook, sinon n'importe qui
  poste un faux `invoice.paid` et s'offre l'adhésion.
- **`stripe_customer_id` est sur `personne`** (`unique`, nullable) : un `cus_…` identifie la
  personne à vie, pas une période payée. Le webhook retrouve la personne par cette colonne,
  puis insère une ligne `abonnement` par période.
- L'accès se teste en SQL local (`now() BETWEEN debut AND fin`), sans jamais rappeler l'API
  Stripe sur le chemin d'une requête.
- `sk_…` et le secret de webhook restent côté serveur ; seule `pk_…` peut entrer dans l'app.

---

## Pour Romain

| # | Tâche | Pourquoi c'est toi, et ce qu'il faut savoir |
|---|---|---|
| 13 | Trancher IAP ou paiement web | décision business, 15 à 30 % de commission en jeu — et elle bloque 15, pas l'inverse |
| 14 | Créer le compte Stripe, en mode test | il faut un compte, un IBAN et une vérification d'identité ; le mode test suffit pour construire le flux |
| 17 | Valider les boîtes de remplissage | Deloitte, BNP et Sia Partners sont inventées |
| 18 | Trancher « Stipeur » ou « Stiper » | c'est un nom de marque. « Stipeur » en attendant : une ligne de `ROLES` dans `packages/core/src/tokens.ts`, rien d'autre |

---

## Restes

Petites choses laissées ouvertes par des tâches finies (numéro d'origine entre parenthèses).

- [ ] Vérifier sur un vrai iPhone que la barre d'onglets ne passe pas sous la barre d'adresse
  de Safari (19).
- [ ] Brancher le mobile sur `GET /config`, servi par `https://api.stips.club/config` (4) —
  quand `mobile/` reprendra.
- [ ] Renouveler la clé API de l'application IAM Scaleway `stips-backend` avant le
  **10 oct. 2027** au plus tard (un an, plafond de l'organisation) : sans elle, la demande au
  pro, la demande à valider et la notification ne partent plus (21).
- [ ] Renouveler la clé SMTP de `supabase-auth` avant le **8 oct. 2027** : elle expire au bout
  d'un an (plafond de l'organisation Scaleway), et Supabase cesse alors d'envoyer les liens
  magiques sans prévenir (10).
- [ ] Tester la réception d'une invitation chez Outlook (10).
- [ ] Passer le DMARC de `mail.stips.club` de `p=none` à `p=quarantine` après quelques semaines
  d'envoi propre (10).

---

## Fait

| # | Tâche | Le | À retenir |
|---|---|---|---|
| 1 | Écrire le schéma Drizzle | 3 oct. 2026 | 18 tables dans `backend/src/db/schema.ts`, contraintes dans la base, vérifiées sur une base jetable. Migration appliquée sur Supabase le 4 oct., depuis `backend/` : `node --env-file=.env ../node_modules/drizzle-kit/bin.cjs migrate` — `.env` n'est pas chargé par défaut, exprès. Client : `backend/src/db/client.ts`, encore importé par personne |
| 2 | Créer le projet Supabase, région UE | 28 sept. 2026 | plan gratuit, **Data API coupée** (voir 11) |
| 3 | Prendre le nom de domaine | 4 oct. 2026 | `stips.club`, chez Vercel, renouvellement automatique, rattaché au projet `le-club`. Bundle id `club.stips.app`, figé à la première TestFlight externe |
| 4 | Serveur Fastify + `GET /config` | 3 oct. 2026 | `backend/src/serveur.ts`, `npm start -w backend`. `/config` hors de `/v1`. Écoute `0.0.0.0` et `PORT`. `versionMinimale` vaut `0.0.0` |
| 5 | `packages/api` — schémas zod et client HTTP | 3 oct. 2026 | `creerClient` valide chaque réponse (`ErreurApi`, 426 compris). `z.object` retire les clés non déclarées : c'est ce qui sépare `PersonneAnnuaire` de `PersonneRecrutement`, un test le garde. Encore importé par personne |
| 6 | Renommer le modèle de rôles | 16 août 2026 | `Role` vaut `'membre' \| 'pro'`, passé par contexte (`role.ts`), `null` = personne de connecté |
| 7 | Porter les deux écrans en React Native | 16 août 2026 | `ScreenOffres` et `ScreenStagesCandidat`, même découpage `TalentDeck` qu'en web |
| 8 | Corriger le type `Offre` | 30 sept. 2026 | champs de la table `offre`, dates en ISO, `dateCourte` dans core |
| 9 | Créer le projet Railway, région EU West | 6 oct. 2026 | projet `Stips`, vide (voir § Restes) |
| 10 | Choisir le fournisseur d'e-mail | 8 oct. 2026 | **Scaleway TEM** (Paris, données en France), plan Essential, projet `production`. Domaine d'envoi `mail.stips.club` — un sous-domaine, pour qu'une mauvaise réputation ne touche pas `stips.club` — avec SPF, DKIM, DMARC et MX dans le DNS Vercel. Supabase Auth envoie par SMTP (`smtp.tem.scaleway.com`, expéditeur `bonjour@mail.stips.club`) avec la clé de l'application IAM `supabase-auth`, limitée à `TransactionalEmailEmailSmtpCreate`. Premier envoi en spam chez Gmail (voir 11) |
| 11 | Auth par lien magique + flux de parrainage | 9 oct. 2026 | `backend/src/routes/`, `frontend/src/pages/`. Deux origines, une table, une machine à états ; le pro remplit une page web sans compte ; l'admin valide par deux liens à jeton HMAC ; l'invitation est le lien magique de Supabase ; cookie de session signé, site et API sous une seule origine (`/api` réécrit). Vérifié sur une base jetable PGlite ; reste à brancher pour de vrai (21) |
| 16 | Cocher la CI comme check requis sur `main` | 21 août 2026 | un push direct sur `main` est refusé : tout passe par une PR dont `verifications` est vert |
| 19 | Retirer le cadre téléphone du site | 27 sept. 2026 | `.ph` vaut `min(100vw, 480px)` × `100dvh` ; un seul conteneur défile par écran (`.defile`) ; écrans non élargis |
| 20 | Mettre le site en ligne | 8 oct. 2026 | `https://www.stips.club`, servi par le projet Vercel `le-club` ; `stips.club` redirige vers `www`. Chaque merge dans `main` part en production tout seul. Données factices : une démo, pas encore un vrai service |
| 21 | Brancher le flux d'inscription | 11 oct. 2026 | Testé de bout en bout sur `www.stips.club`, depuis un téléphone. Serveur sur Railway (service du projet `Stips`, EU West), branche `main`, Auto deploy + « Wait for CI », Healthcheck Path `/config`, build vide, start `npm start -w backend` ; variables = `backend/.env` avec `SITE_URL=https://stips.club`, `NODE_ENV=production`, sans `PORT`. `api.stips.club` en CNAME dans le DNS Vercel, certificat Let's Encrypt renouvelé par Railway. Supabase : Site URL + Redirect URLs, deux gabarits en français, OTP à 24 h. Scaleway : application `stips-backend`, permission `TransactionalEmailEmailApiCreate` seule. La session se renouvelle à chaque ouverture du site |
