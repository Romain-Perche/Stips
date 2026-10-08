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
| 20 | Mettre le site en ligne sur `stips.club` | Romain | — | 🟠 maintenant |
| 11 | Auth par lien magique + flux de parrainage complet | Claude | — | 🟠 maintenant |
| 12 | Brancher les écrans sur l'API (retirer `DATA`) — `frontend/` d'abord, `mobile/` quand il reprendra | Claude | 11 | ⚪ ensuite |
| 13 | Trancher : in-app purchase ou paiement web | Romain | — | ⏸ fin de la bêta |
| 14 | Créer le compte Stripe (mode test d'abord) | Romain | 13 | ⏸ fin de la bêta |
| 15 | Brancher Stripe : Checkout + webhook `invoice.paid` | Claude | 13, 14 | ⏸ fin de la bêta |
| 17 | Valider les données de remplissage des boîtes | Romain | — | ⚪ quand tu veux |
| 18 | Trancher le nom d'un membre : « Stipeur » ou « Stiper » | Romain | — | ⚪ quand tu veux |

**Ce qui se recouvre.** 20 et 11 sont indépendants et peuvent avancer en même temps.
15 n'attend pas du code mais une décision (13) : l'écrire avant, c'est peut-être l'écrire pour
rien.

**La bêta est gratuite, sans date de fin fixée** (décidé le 8 octobre 2026). 13, 14 et 15
attendent sa fin : d'ici là, un parrainage accepté suffit et rien ne regarde `abonnement`. Voir
[`Description projet.md`](Description%20projet.md) § modèle économique.

---

## Pour Claude

Chaque bloc dit l'enjeu, ce qu'il faut lire avant, et le piège.

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
- **Le premier e-mail de test est tombé en spam chez Gmail**, avec SPF, DKIM et DMARC valides
  (10). En cause : un domaine neuf en `.club`, le texte par défaut de Supabase en anglais, et
  un lien vers `<projet>.supabase.co`. Les gabarits s'écrivent en français, et le lien pointe
  vers une page de `stips.club` qui échange le `token_hash` — jamais vers le domaine Supabase.
- Le backend envoie ses e-mails (demande au pro, notification de validation) avec **sa propre**
  application IAM Scaleway, pas avec la clé de `supabase-auth` : une clé par usage, révocable
  seule.

### 12. Brancher les écrans sur l'API

**Enjeu.** Remplacer `DATA` par de vrais appels. C'est le moment où `packages/core/src/data.ts`
disparaît. Le site en ligne a besoin du serveur déployé sur Railway (voir § Restes).

**Le piège.** **Valider toute donnée qui entre**, aux deux frontières. Un type TypeScript
décrit ce que le backend a promis, pas ce qu'il a envoyé. `creerClient` (`packages/api`) le
fait déjà ; côté mobile, `mobile/src/config/miseAJour.ts` montre le geste en miniature : une
réponse malformée dégrade vers `null` au lieu de lever.

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
| 20 | Mettre le site en ligne | il faut un compte et le DNS. Le projet Vercel `le-club` construit déjà le site à chaque PR et porte déjà `stips.club` : reste sans doute à servir la production sur le domaine. Le site statique n'a pas besoin de serveur ; l'API ira chez Railway. Un site en ligne avec des données factices est déjà une démo qu'on peut envoyer |
| 13 | Trancher IAP ou paiement web | décision business, 15 à 30 % de commission en jeu — et elle bloque 15, pas l'inverse |
| 14 | Créer le compte Stripe, en mode test | il faut un compte, un IBAN et une vérification d'identité ; le mode test suffit pour construire le flux |
| 17 | Valider les boîtes de remplissage | Deloitte, BNP et Sia Partners sont inventées |
| 18 | Trancher « Stipeur » ou « Stiper » | c'est un nom de marque. « Stipeur » en attendant : une ligne de `ROLES` dans `packages/core/src/tokens.ts`, rien d'autre |

---

## Restes

Petites choses laissées ouvertes par des tâches finies (numéro d'origine entre parenthèses).

- [ ] Vérifier sur un vrai iPhone que la barre d'onglets ne passe pas sous la barre d'adresse
  de Safari (19).
- [ ] Déployer le serveur sur Railway : le projet `Stips` est vide, l'URL se génère dans
  Settings → Networking (9). Puis pointer `api.stips.club` dessus (`mobile/RELEASE.md`).
- [ ] Brancher le mobile sur `GET /config` une fois l'URL connue (4) — quand `mobile/` reprendra.
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
| 16 | Cocher la CI comme check requis sur `main` | 21 août 2026 | un push direct sur `main` est refusé : tout passe par une PR dont `verifications` est vert |
| 19 | Retirer le cadre téléphone du site | 27 sept. 2026 | `.ph` vaut `min(100vw, 480px)` × `100dvh` ; un seul conteneur défile par écran (`.defile`) ; écrans non élargis |
