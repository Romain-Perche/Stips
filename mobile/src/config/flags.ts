/* ══════════════════════════════════════════════════════════════════════
   FEATURE FLAGS — permet de merger du code inachevé dans main sans
   l'exposer. `__DEV__` vaut true via `expo start`, false en build release.

   Un flag n'est pas éternel : dès qu'une fonctionnalité est livrée et
   stable, on retire le flag et la condition qui va avec.
   ══════════════════════════════════════════════════════════════════════ */

export const flags = {
  // Exemple. Remplacer par de vrais flags au fur et à mesure.
  ecransEnChantier: __DEV__,
} as const;
