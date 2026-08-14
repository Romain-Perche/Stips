# TODO — Stips

Classé par urgence, puis réparti entre ce que **Romain** fait et ce que **Claude** fait dans
une discussion dédiée (une par ligne : voir `AGENTS.md`, une étape par conversation).

**Objectif actuel : une app de démo**, pas une mise en production. Ce qui bloque une vraie
mise en ligne est parqué dans [`backend/README.md`](backend/README.md) § avant la mise en
ligne réelle, et n'apparaît pas ici.

---

## 🔴 Maintenant

| Tâche | Qui | Débloque |
|---|---|---|
| Regarder les deux écrans (`cd frontend && npm run dev`) et dire ce qui ne va pas | Romain | le port React Native |
| **Écrire le schéma Drizzle** | Claude | tout le backend |
| Créer le projet Supabase (région **UE**) | Romain | l'auth et le stockage des CV |
| Prendre le nom de domaine | Romain | rien tout de suite, mais c'est le seul point qui a une horloge |

Le domaine gèle le bundle id à la première TestFlight externe — 10 à 15 €/an, à prendre avant
d'en avoir besoin plutôt qu'après.

## 🟠 Ensuite

| Tâche | Qui |
|---|---|
| Serveur Fastify + `GET /config` | Claude |
| `packages/api` — schémas zod et client HTTP | Claude |
| Renommer le modèle de rôles dans le code | Claude |
| Porter les deux écrans en React Native | Claude |
| Corriger le type `Offre` | Claude |
| Créer le projet Railway, région **EU West**, puis choisir le fournisseur d'e-mail | Romain |

## ⚪ Plus tard

| Tâche | Qui |
|---|---|
| Auth par lien magique + flux de parrainage complet | Claude |
| Brancher les écrans sur l'API (retirer `DATA`) | Claude |
| Trancher : in-app purchase ou paiement web | Romain |
| Cocher la CI comme check requis sur `main` (GitHub → Settings → Rules) | Romain |
| Valider les données de remplissage des boîtes | Romain |

---

# Pour Claude — une discussion par tâche

Dans l'ordre. Chaque bloc dit l'enjeu, ce qu'il faut lire avant, et le piège.

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
- Aucun compteur, sauf `fil.score` et `conversation.dernier_message_at` — et seulement parce que
  ce sont des clés de tri.
- Ne **pas** lancer la migration sur une base autre qu'une base locale jetable (`AGENTS.md`).
  Écrire le fichier, oui ; l'appliquer, non.
- Le rang de liste d'attente est une fonction fenêtre. Si Drizzle ne l'exprime pas, du SQL brut,
  pas un contournement en JavaScript.

### 2. Serveur Fastify + `GET /config`

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

### 3. `packages/api` — schémas zod et client HTTP

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

### 4. Renommer le modèle de rôles dans le code

**Enjeu.** Le code porte encore l'ancien modèle et contredit les docs. Purement mécanique, mais
ça touche les trois workspaces, donc autant le faire d'un coup.

**À lire d'abord.** [`Description projet.md`](Description%20projet.md) § les deux rôles, où la
cible de `TABS` est écrite telle quelle.

**Ce qu'il y a à faire.** `Role` passe de `'candidat' | 'entreprise'` à `'membre' | 'pro'`
(`packages/core/src/types.ts`) ; `TABS` donne cinq onglets aux deux rôles avec `ScreenChercher`
dedans et `ScreenTalents` dehors ; `RoleSwitcher` change ses libellés ; `DATA` perd ses `cats`
et l'Agenda sa rangée de filtres. Côté web **et** mobile.

**Le piège.** `ScreenTalents` cesse d'être un onglet mais `TalentDeck` reste : c'est
`ScreenOffres` qui le monte. Ne pas supprimer le fichier.

### 5. Porter les deux écrans en React Native

**Enjeu.** `mobile/` doit rester à parité avec `frontend/`. À faire seulement **après** que
Romain a validé le premier jet web, sinon on porte un dessin qui va changer.

**À lire d'abord.** `frontend/src/screens/ScreenStagesCandidat.tsx` et `ScreenOffres.tsx`, puis
[`mobile/AGENTS.md`](mobile/AGENTS.md).

**Les pièges.** Les deux vrais pièges du portage sont déjà documentés dans
[`Description projet.md`](Description%20projet.md) : pas de `transform-style: preserve-3d` en
RN, et en RN tout est flex. Le `TalentDeck` extrait côté web doit l'être aussi côté mobile —
même découpage, sinon les deux divergent.

### 6. Corriger le type `Offre`

**Enjeu.** `Offre` n'a **pas d'employeur** ni de date limite. Invisible tant que seul le pro
regardait ses propres offres ; l'écran Stages du membre laisse un trou visible à la place.

**Ce qu'il y a à faire.** Ajouter l'entreprise, le lieu, la durée en mois et une date de
clôture ; arrêter de mélanger une date de publication et un compteur de non-lues dans `pied`.
Puis reprendre les deux écrans qui l'affichent, web et mobile.

**Le piège.** Ça touche `packages/core`, donc le hook pre-commit relance les vérifications sur
`frontend` **et** `mobile` : les deux doivent compiler dans le même commit.

### 7. Auth par lien magique + flux de parrainage

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

### 8. Brancher les écrans sur l'API

**Enjeu.** Remplacer `DATA` par de vrais appels. C'est le moment où `packages/core/src/data.ts`
disparaît.

**Le piège.** **Valider toute donnée qui entre**, aux deux frontières. Un type TypeScript
décrit ce que le backend a promis, pas ce qu'il a envoyé. Le geste existe déjà en miniature
dans `mobile/src/config/miseAJour.ts` : une réponse malformée dégrade vers `null` au lieu de
lever.

---

# Pour Romain

| Tâche | Pourquoi c'est toi | Quand |
|---|---|---|
| Regarder les deux écrans et dire ce qui ne va pas | c'est ton dessin | 🔴 maintenant |
| Créer le projet Supabase, région UE | il faut un compte et une carte | 🔴 maintenant |
| Prendre le nom de domaine | pareil, et le bundle id en dépend | 🔴 maintenant |
| Créer le projet **Railway**, région **EU West** (elle ne l'est pas par défaut) | il faut un compte | 🟠 avant le premier build sur un téléphone qui n'est pas le tien |
| Choisir le fournisseur d'e-mail (Resend, Postmark, Scaleway TEM) | décision + compte + DNS | 🟠 avant que de vraies personnes reçoivent des invitations |
| Trancher IAP ou paiement web | décision business, 15 à 30 % de commission en jeu | ⚪ avant la release qui introduit le paiement |
| Cocher la CI comme check requis sur `main` | ça vit dans les réglages GitHub, pas dans le repo | ⚪ quand tu veux |
| Valider les boîtes de remplissage | Deloitte, BNP et Sia Partners sont inventées | ⚪ quand tu veux |

---

## Ce qui peut avancer en parallèle

Trois chantiers indépendants, donc oui, ça se recouvre :

- **Pendant que j'écris le schéma Drizzle (1)**, tu peux regarder les écrans, créer le projet
  Supabase et prendre le domaine. Aucun des trois ne me bloque, et les deux derniers me
  débloqueront pour la tâche 7.
- **`GET /config` (2) ne dépend de rien** — ni base, ni auth, ni schéma. Il peut se faire avant,
  pendant ou après le schéma, dans n'importe quel ordre.
- **Le renommage des rôles (4), le port mobile (5) et la correction d'`Offre` (6)** sont du
  travail front, sans aucun lien avec le backend. Ils peuvent s'intercaler n'importe où.

En revanche, **3 attend 1** (les schémas zod décrivent le schéma), **7 attend 1 et le projet
Supabase**, et **8 attend 2, 3 et 7**.
