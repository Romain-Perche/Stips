# Le Club — conventions de travail

Trois composants dans un seul repo : `backend/` (rien d'implémenté encore), `frontend/`
(Vite + React, données factices), `mobile/` (Expo SDK 57). Chacun a son propre cycle de
version. Voir aussi `mobile/AGENTS.md` pour les contraintes Expo.

Le repo est un workspace npm (`workspaces` dans le `package.json` racine) : une seule
installation, à la racine (`npm install`), pas une par composant. `packages/core`
(`@leclub/core`) porte ce qui est réellement identique entre `frontend/` et `mobile/` —
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

- Un tag **annoté** par release, préfixé par composant : `mobile-v0.3.0`, `web-v0.5.0`,
  `api-v1.2.0`. Toujours `git tag -a`, jamais un tag léger.
- Le tag `mobile-vX.Y.Z` doit correspondre au champ `version` de `mobile/app.config.ts`.
  C'est le **seul** numéro de version qu'un humain édite : avec `appVersionSource: "remote"`
  dans `eas.json`, le `buildNumber` iOS et le `versionCode` Android appartiennent à EAS et
  s'auto-incrémentent. Ne jamais redescendre `version` — les stores le refusent.
- **Un tag poussé est immuable.** Jamais de `git tag -f` ni de force-push de tag : si un
  tag a été fetché par quelqu'un d'autre, le déplacer crée deux vérités sous le même nom.
  Erreur de version → on tagge la version suivante, un numéro brûlé ne coûte rien.
- Les tags ne partent pas avec un `git push` nu : `git push origin mobile-v0.3.0`.

Un tag marque le commit **depuis lequel** un build a été fabriqué. Ce n'est pas 1:1 avec
les builds : un même tag peut donner plusieurs builds (rejet store pour un motif non
technique → rebuild du même commit, `buildNumber` incrémenté), et les builds
`development`/`preview` ne sont taggés par rien. On tagge au moment où on décide « ceci
est la version qui part ».

Ordre d'une release mobile — tagger **avant** de builder, pour que le binaire soit garanti
issu du commit taggé :

```bash
# 1. main est verte, on met à jour version dans mobile/app.config.ts, on commite
git tag -a mobile-v0.3.0 -m "Onglet stages, fix flip de carte"
git push origin main mobile-v0.3.0
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

## Vérifications

```bash
npm run typecheck --workspaces --if-present
npm run lint      --workspaces --if-present
npm run test      --workspaces --if-present
```

(équivalent à lancer `npm run typecheck && npm run lint && npm run test` dans `mobile/`,
`frontend/` et `packages/core/` séparément.) Aucun composant n'a de script `test`
aujourd'hui : la commande ne fait rien et sort en 0 — elle est câblée pour que le premier
`test` ajouté soit lancé sans qu'il faille toucher au hook ou à la CI.

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
- Choisir la stack du `backend/` : décision d'architecture à prendre ensemble
  (voir `backend/README.md`).
- Changer le bundle id une fois qu'une app a été soumise à TestFlight externe ou à Play
  Console : à ce moment-là il est figé, en changer crée une deuxième app.
- Remonter `versionMinimale` (la version minimale servie par `GET /config`) : ça bloque
  définitivement tous les binaires plus anciens. Voir `mobile/RELEASE.md`.
- Retirer un champ d'une réponse d'API déjà servie, en changer le type, ou en changer le
  sens à nom constant. Voir `backend/README.md`.
- Modifier les réglages de protection de branche sur GitHub, ou désactiver/contourner un
  check requis.
