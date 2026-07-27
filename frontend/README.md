# Le Club — frontend

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

- `src/tokens.ts` — palette et polices, seul endroit pour changer la DA.
- `src/data.ts` — toutes les données factices, à remplacer par le futur backend.
- `src/atoms.tsx` — les briques communes à tous les écrans.
- `src/screens/` — un fichier par onglet (+ `ScreenInvitation.tsx`, l'écran d'entrée qui
  n'est pas un onglet).
- `src/App.tsx` — le routeur : quels onglets pour quel rôle.
