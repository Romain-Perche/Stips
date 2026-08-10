/* ══════════════════════════════════════════════════════════════════════
   FEATURE FLAGS — permet de merger du code inachevé dans main sans
   l'exposer. `__DEV__` vaut true via `expo start`, false en build release.

   Un flag n'est pas éternel : dès qu'une fonctionnalité est livrée et
   stable, on retire le flag et la condition qui va avec.
   ══════════════════════════════════════════════════════════════════════ */

/* `as boolean` sur les littéraux false : sans ça `as const` réduit le type à
   `false`, TypeScript considère la branche gardée comme morte et on perd la
   vérification du code derrière le flag. */
export const flags = {
  // Exemple. Remplacer par de vrais flags au fur et à mesure.
  ecransEnChantier: __DEV__,

  /** Verrou de version minimale (src/config/miseAJour.ts). À false tant que
      rien ne répond sur /config : sinon un appel réseau part à chaque
      démarrage pour rien. À passer à true le jour où la route existe. */
  verrouVersion: false as boolean,

  /** Affiche l'écran bloquant sans backend, pour le voir en développement.
      Court-circuite tout : ni appel réseau, ni comparaison de version. */
  verrouVersionForce: false as boolean,

  /** Envoie les erreurs à Sentry même en développement, et allume ses logs
      verbeux. À false par défaut : le bruit de dev n'a aucune valeur et
      consomme le quota (5 000 erreurs/mois offertes).

      À passer à true une fois, sur un build dev-client, pour vérifier que le
      tuyau marche de bout en bout — puis à remettre à false avant de
      commiter. C'est le seul interrupteur qui décide si Sentry démarre en
      développement (voir src/observabilite/sentry.ts). */
  sentryEnDev: false as boolean,
} as const;
