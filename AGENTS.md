# Stips — conventions de travail

Trois composants dans un seul repo : `backend/` (Fastify + Drizzle + Postgres sur Supabase —
stack arrêtée, rien d'implémenté encore), `frontend/` (Vite + React, données factices),
`mobile/` (Expo SDK 57). Chacun a son propre cycle de version. Voir aussi `mobile/AGENTS.md`
pour les contraintes Expo, et `backend/README.md` pour le schéma et le contrat d'API.

Le repo est un workspace npm (`workspaces` dans le `package.json` racine) : une seule
installation, à la racine (`npm install`), pas une par composant. `packages/core`
(`@stips/core`) porte ce qui est réellement identique entre `frontend/` et `mobile/` —
les types de données, `DATA`, la palette — pour que ça ne puisse plus diverger en silence.
Ce qui reste propre à chaque plateforme (polices, composants RN vs DOM) reste dans son
composant ; ne pas chercher à tout faire monter dans `core`.

## Branches

- **`main` est la seule branche longue.** Elle doit toujours passer `typecheck` et `lint`
  sur les composants touchés.
- Branches de travail : `feat/<sujet>`, `fix/<sujet>`, `chore/<sujet>`. Durée de vie visée :
  1 à 3 jours. Au-delà, on scinde le travail.
- **Ne jamais créer de branche `dev` ou `prod`.** En mobile, ce qui part chez les
  utilisateurs est un build soumis au store, pas un commit sur une branche : « la prod »
  est un tag, pas un pointeur mutable.
- `release/X.Y.x` : **uniquement** pour patcher une version déjà soumise au store alors que
  `main` a avancé. Créée depuis le tag correspondant, jamais depuis `main`, jamais à
  l'avance, supprimée quand le patch est livré et remonté dans `main`.

Pour développer sans exposer : un feature flag (`mobile/src/config/flags.ts`) ou un profil
de build EAS, pas une branche longue.

## Tags

- Un tag **annoté** par release, préfixé par composant : `mobile-v0.2`, `web-v0.5.0`,
  `api-v1.2.0`. Toujours `git tag -a`, jamais un tag léger.
- Le tag mobile **reprend le champ `version` de `mobile/app.config.ts` telle quelle** :
  `version: '0.2'` → `mobile-v0.2`. Pas de zéro de complément — ce qui compte est que le
  numéro affiché dans le store se retrouve à l'identique dans `git tag`, sinon retrouver le
  commit d'un binaire depuis sa fiche store demande une traduction mentale, exactement là
  où on la fait mal (en cherchant d'où vient un crash).
- **Deux segments sont un format valide**, pas un oubli. Apple accepte 1 à 3 entiers dans
  `CFBundleShortVersionString`, `versionName` est une chaîne libre côté Play, et
  `comparerVersions` (`packages/core/src/version.ts`) complète les segments absents par 0 —
  `0.2` et `0.2.0` s'y comparent égaux. Sortir un correctif en `0.2.1` après un `0.2` est
  donc licite : mélanger les deux longueurs ne casse ni les stores ni le verrou de version.
- `version` est le **seul** numéro qu'un humain édite : avec `appVersionSource: "remote"`
  dans `eas.json`, le `buildNumber` iOS et le `versionCode` Android appartiennent à EAS et
  s'auto-incrémentent. Ne jamais redescendre `version` — les stores le refusent.
- **Un tag poussé est immuable.** Jamais de `git tag -f` ni de force-push de tag : si un
  tag a été fetché par quelqu'un d'autre, le déplacer crée deux vérités sous le même nom.
  Erreur de version → on tagge la version suivante, un numéro brûlé ne coûte rien.
  C'est pourquoi `mobile-v0.1.0`, posé avant cette règle alors que `version` valait `0.1`,
  reste tel quel : on ne le renomme pas, on applique la règle à partir du suivant.
- Les tags ne partent pas avec un `git push` nu : `git push origin mobile-v0.2`.

Un tag marque le commit **depuis lequel** un build a été fabriqué. Ce n'est pas 1:1 avec
les builds : un même tag peut donner plusieurs builds (rejet store pour un motif non
technique → rebuild du même commit, `buildNumber` incrémenté), et les builds
`development`/`preview` ne sont taggés par rien. On tagge au moment où on décide « ceci
est la version qui part ».

Ordre d'une release mobile — tagger **avant** de builder, pour que le binaire soit garanti
issu du commit taggé :

```bash
# 1. main est verte, on met à jour version dans mobile/app.config.ts, on commite
git tag -a mobile-v0.2 -m "Onglet stages, fix flip de carte"
git push origin main mobile-v0.2
cd mobile && npx eas-cli build --profile production && npx eas-cli submit
```

## Commits

- Impératif présent, en français, préfixé par le composant :
  `mobile: corrige le flip de carte`, `frontend: ajoute l'écran parrainage`.
- Un commit = un changement cohérent. Pas de `wip` sur `main`.

## Config et secrets

**Tout ce qui est dans le bundle JS est public.** Un `.ipa` ou un `.apk` se décompresse en
trente secondes et le bundle se lit. Il n'existe pas d'endroit discret dans une app mobile :
l'obfuscation, un nom de variable anodin ou un encodage base64 ne changent rien.

| Autorisé dans l'app | Jamais dans l'app |
| --- | --- |
| URL de l'API | clé Stripe secrète (`sk_…`), secret de webhook |
| clé publishable Stripe (`pk_…`) | clé de service de la base (rôle service) |
| DSN Sentry (il autorise l'envoi, pas la lecture) | jeton d'auth Sentry (`SENTRY_AUTH_TOKEN`) |
| identifiants de build (bundle id, variante) | secret d'un provider OAuth, jeton d'API d'un tiers |

La colonne de droite vit côté backend (voir `backend/README.md`) : l'app parle au backend, le
backend parle aux tiers avec ses secrets. C'est la seule répartition qui tient — si l'app a
besoin d'un secret pour faire quelque chose, c'est le backend qui doit le faire à sa place.

### Comment une valeur publique arrive dans l'app

- **`extra` dans `mobile/app.config.ts`** — ce qu'on utilise. Une entrée par variante, relue à
  l'exécution par `mobile/src/config/env.ts`. La valeur est visible dans un fichier committé :
  son caractère public est assumé, pas subi.
- **`EXPO_PUBLIC_*`** — inliné par Metro dans le bundle. Le préfixe est un aveu, pas une
  protection : il n'existe pas d'`EXPO_PRIVATE_`. Évité ici, précisément parce qu'il laisse
  croire le contraire.

`mobile/app.config.ts` refuse de s'évaluer si une valeur de `extra` ou une variable
`EXPO_PUBLIC_*` ressemble à un secret, et si `apiUrl` n'est pas en `https` en production.
`expo start` comme `eas build` échouent donc avant qu'un binaire existe.

### Variables d'environnement EAS

Une variable EAS de visibilité *secret* est protégée **sur les serveurs EAS** : illisible
depuis le dashboard et la CLI. Ça ne la rend pas secrète dans l'app. Si `app.config.ts` la
recopie dans `extra`, elle est en clair dans le bundle comme n'importe quelle autre. Ces
variables servent à changer *comment* un build se fabrique, pas à embarquer un secret.

`SENTRY_AUTH_TOKEN` en est l'exemple exact : il sert à **uploader les source maps pendant le
build**, rien dans l'app ne le voit, et il ne doit jamais passer par `extra`. Le DSN, lui,
fait le trajet inverse — public, écrit en clair dans `app.config.ts`. Voir
`mobile/RELEASE.md` § observabilité.

### Fichiers

- `mobile/.env` n'est pas committé ; `mobile/.env.example` documente les variables attendues.
- Clés de signature (`.p8`, `.jks`, `.p12`, `.mobileprovision`, `.pem`) : couvertes par le
  `.gitignore` **racine**, qui vaut pour tout le repo. Celui d'un composant ne protège que son
  dossier — une clé posée à la racine ou dans `backend/` passerait à travers.
- Le hook `pre-commit` refuse un fichier de clé ou un `.env` mis en scène, et une ligne ajoutée
  contenant un motif de secret connu. Une ligne qui doit légitimement en citer un porte le
  marqueur `secret-ok`.

Un secret déjà poussé ne s'efface pas d'un `revert` : l'objet reste dans l'historique et dans
les clones. La seule réponse est de le **révoquer** chez le fournisseur.

Côté `frontend/`, même règle avec le préfixe `VITE_` : Vite inline ces variables dans le
bundle servi au navigateur.

## Logo et icônes

Le logo est le wordmark « Stips » : S en Outfit 800 teinté, « tips » en Outfit 500 encre.
Il existe en trois teintes, **une par variante de build** — taupe `#8C7B6B` en production,
bleu `#1B3A6B` en preview, rouge `#B3382C` en dev. Trois binaires peuvent être installés
côte à côte sur le même téléphone : la teinte est ce qui dit lequel on ouvre.

Tout ce qui porte ce dessin est **généré** par un seul script, à relancer après toute
modification du dessin ou d'une teinte :

```bash
npm run logo        # node scripts/logo/generer.mjs
```

Il produit `packages/core/src/logo-contours.ts`, les PNG de `mobile/assets/` (icônes,
écrans de démarrage, premier plan Android, favicon) et les SVG de `frontend/public/`.
**Ne pas éditer ces fichiers à la main** : le prochain passage les écrase. Le script est
idempotent — le relancer sans rien changer ne modifie aucun fichier — et il refuse de
tourner si les trois teintes ont divergé entre `packages/core/src/tokens.ts`
(`TEINTES_VARIANTE`), `mobile/app.config.ts` (`fondIcone`) et sa propre constante.

Deux façons de dessiner le logo, et il faut choisir la bonne :

- **Dans l'app**, Outfit est chargée (`mobile/App.tsx`, `useFonts`) : le wordmark se
  compose en `<Text>` (voir `AppHeader`). Pas d'image à redimensionner.
- **Partout ailleurs** — favicon, page statique de `frontend/public/`, icône d'app — la
  police ne peut pas être supposée présente, et un logo qui retombe sur la sans-serif du
  système n'est plus le logo. D'où les contours, et les fichiers générés.

## Vérifications

```bash
npm run typecheck --workspaces --if-present
npm run lint      --workspaces --if-present
npm run test      --workspaces --if-present
```

(équivalent à lancer `npm run typecheck && npm run lint && npm run test` dans `mobile/`,
`frontend/` et `packages/core/` séparément.) Seul `packages/core` a des tests aujourd'hui ;
`--if-present` fait que la commande sort en 0 sur les deux autres, sans qu'il faille toucher
au hook ou à la CI le jour où ils en auront.

### Les tests

`packages/core` tourne sur le **runner natif de Node** (`node --test`), sans aucune
dépendance : Node 24 retire les types lui-même, d'où `erasableSyntaxOnly` dans le tsconfig
et l'extension explicite à l'import (`from './version.ts'`), qu'exige son résolveur ESM.

Ça ne marche que parce que core est pur. `mobile/` et `frontend/` ont besoin de JSX, de
Metro et des modules natifs : quand ils auront des tests, ce sera avec Vitest ou
`jest-expo`, pas avec ce runner. Ne pas chercher à leur appliquer la même recette.

Deux tsconfig, et c'est délibéré. `tsconfig.json` compile core **sans DOM et sans Node**
(`lib: ["ES2023"]`, `types: []`) : `document` comme `process` y sont des erreurs de
compilation, ce qui garantit que rien de spécifique à une plateforme n'entre dans le code
partagé entre React Native et le navigateur. `tsconfig.test.json` n'ajoute `types: ["node"]`
qu'aux fichiers `*.test.ts` — les tests ont accès à `node:test` et `node:assert`, le code de
production non. Le `typecheck` de core lance les deux, dans cet ordre.

Ce qui mérite un test ici : la logique pure et **load-bearing**. `comparerVersions`
(`src/version.ts`) est le cas type — c'est elle qui décide si un binaire se bloque lui-même,
et une erreur de signe y afficherait « mets à jour » à des gens déjà à jour, sans aucun
moyen de les débloquer à distance. `DATA` et les tokens, eux, sont des constantes : les
tester ne ferait que recopier leur valeur.

Le lint tourne avec `--deny-warnings` : un warning casse le build, exactement comme une
erreur. C'est voulu — un warning qui ne bloque rien n'est jamais lu ni corrigé. Le socle de
règles oxlint est à la racine (`.oxlintrc.json` : plugins `react`/`typescript`/`oxc`,
`rules-of-hooks` en erreur) ; chaque composant l'étend avec `extends` et n'ajoute que ce qui
lui est propre — par exemple `react/only-export-components` n'est activée que sur
`frontend/`, voir le commentaire dans `mobile/.oxlintrc.json` pour pourquoi.

Un hook `pre-commit` versionné dans `.githooks/` lance ces trois commandes automatiquement
sur les composants touchés — et sur `mobile` et `frontend` en plus, si c'est `packages/core`
qui a changé, puisque les deux en dépendent. **À activer une fois par clone** (les hooks ne
se transmettent pas avec le repo) :

```bash
git config core.hooksPath .githooks
```

`git commit --no-verify` contourne le hook — pour un cas d'urgence réel, pas par habitude.

Une GitHub Action (`.github/workflows/ci.yml`) relance les mêmes trois commandes sur chaque
pull request et sur chaque `push` vers `main`, sur tous les workspaces — c'est le filet qui
existe même quand le hook local a été contourné ou n'a jamais été activé dans un clone. Le
job s'appelle `verifications` ; pour qu'une CI rouge bloque effectivement le merge, il doit
être coché comme check requis dans les réglages de protection de branche de `main` sur
GitHub (Settings → Rules), une configuration qui vit côté GitHub et non dans ce repo.

## Ce que Claude ne fait pas sans qu'on le demande explicitement

- `git push`, merge dans `main`, création ou suppression de tag, `git push --force`.
- Lancer un build ou une soumission EAS.
- Changer de SDK Expo majeur (`~57.x` aujourd'hui) : ça entraîne `react-native`, `react` et
  toutes les bibliothèques à code natif, et impose de refabriquer le development build.
  Voir `mobile/AGENTS.md`.
- Appliquer une migration Drizzle (`drizzle-kit push`, `migrate`) sur une base autre qu'une
  base locale jetable : une migration appliquée se défait à peu près aussi bien qu'un tag
  poussé. Écrire le fichier de migration, oui ; le lancer sur une base qui contient des
  données, non.
- Revenir sur la stack du `backend/` ou sur le schéma déjà arrêté (voir `backend/README.md`).
- Changer le bundle id une fois qu'une app a été soumise à TestFlight externe ou à Play
  Console : à ce moment-là il est figé, en changer crée une deuxième app.
- Remonter `versionMinimale` (la version minimale servie par `GET /config`) : ça bloque
  définitivement tous les binaires plus anciens. Voir `mobile/RELEASE.md`.
- Retirer un champ d'une réponse d'API déjà servie, en changer le type, ou en changer le
  sens à nom constant. Voir `backend/README.md`.
- Modifier les réglages de protection de branche sur GitHub, ou désactiver/contourner un
  check requis.
