# Le Club — conventions de travail

Trois composants dans un seul repo : `backend/` (rien d'implémenté encore), `frontend/`
(Vite + React, données factices), `mobile/` (Expo SDK 54). Chacun a son propre cycle de
version. Voir aussi `mobile/AGENTS.md` pour les contraintes Expo.

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
- Le tag `mobile-vX.Y.Z` doit correspondre au champ `version` de `mobile/app.json`.
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
# 1. main est verte, on met à jour version dans mobile/app.json, on commite
git tag -a mobile-v0.3.0 -m "Onglet stages, fix flip de carte"
git push origin main mobile-v0.3.0
cd mobile && eas build --profile production && eas submit
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
| DSN Sentry | secret d'un provider OAuth |
| identifiants de build (bundle id, variante) | jeton d'API d'un tiers |

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
cd mobile   && npm run typecheck && npm run lint
cd frontend && npm run typecheck && npm run lint
```

Un hook `pre-commit` versionné dans `.githooks/` les lance automatiquement sur les
composants touchés. **À activer une fois par clone** (les hooks ne se transmettent pas
avec le repo) :

```bash
git config core.hooksPath .githooks
```

`git commit --no-verify` contourne le hook — pour un cas d'urgence réel, pas par habitude.

## Ce que Claude ne fait pas sans qu'on le demande explicitement

- `git push`, merge dans `main`, création ou suppression de tag, `git push --force`.
- Lancer un build ou une soumission EAS.
- Remonter la version d'`expo` au-delà de `~54.x` (voir `mobile/AGENTS.md`).
- Choisir la stack du `backend/` : décision d'architecture à prendre ensemble
  (voir `backend/README.md`).
