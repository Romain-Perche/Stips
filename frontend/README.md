# Stips — frontend

React + TypeScript, scaffoldé avec Vite. Voir `../Description projet.md` pour le projet
dans son ensemble, et les commentaires en tête de chaque fichier de `src/` pour ce qu'il
fait.

## Lancer en local

```
npm install
npm run dev
```

puis ouvrir l'URL affichée (`http://localhost:5173` par défaut).

## Où toucher quoi

- `src/tokens.ts` — la palette et les polices, ré-exportées de `@stips/core` : c'est là-bas
  qu'on change la DA.
- `src/atoms.tsx` — les briques communes à tous les écrans.
- `src/screens/` — un fichier par onglet (+ `ScreenInvitation.tsx`, l'écran d'entrée qui
  n'est pas un onglet).
- `src/App.tsx` — le routeur : quels onglets pour quel rôle, et les quatre pages hors app.
- `src/pages/` — les pages hors app, par leur chemin : `/demande` (le stagiaire demande),
  `/parrainage/:id` (**le formulaire du pro, sans compte** — une page web, jamais un PDF ni
  un détour par l'app), `/parrainage/:id/validation` (l'admin) et `/connexion`. Voir
  `../backend/README.md` § flux d'inscription.
- `src/api.ts` — le client HTTP ; `/api` est réécrit vers le serveur (`vercel.json` en
  production, `vite.config.ts` en local). Pour tout voir marcher en local : `npm run dev -w
  backend` d'un côté, `npm run dev` ici de l'autre.
- `public/` — les pages statiques hors app (confidentialité, support).

Les données factices (`DATA`) et les types qui la composent ne sont plus ici : ils vivent
dans `packages/core`, partagés avec `mobile/`.
