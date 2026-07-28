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
