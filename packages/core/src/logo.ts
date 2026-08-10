/* ══════════════════════════════════════════════════════════════════════
   LOGO — le type du tracé, séparé des données.

   `logo-contours.ts` est généré (contours des deux mots à une taille de
   police de 1000) ; ce fichier-ci décrit sa forme, et reste écrit à la main.
   Les deux sont séparés pour que régénérer les données n'écrase pas le type.

   Rien n'importe encore ces contours : ils ont servi à produire
   `frontend/public/logo.svg` et `logo-creme.svg`, où les tracés sont
   intégrés en dur. Le type existe pour que la donnée générée soit vérifiée,
   et pour le jour où un composant construira le logo à l'exécution.
   ══════════════════════════════════════════════════════════════════════ */

/** Boîte d'encre d'un tracé : l'aire réellement couverte, qui n'est pas la
    boîte de la police — c'est elle qui permet de centrer sur le dessin et
    non sur les métriques. Repère SVG, donc `y` croît vers le bas et les
    ordonnées d'un tracé posé sur la ligne de base sont négatives. */
export interface BoiteEncre {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Un mot converti en contours : l'attribut `d` d'un `<path>` SVG, plus la
    boîte d'encre correspondante. */
export interface TraceLogo {
  d: string;
  encre: BoiteEncre;
}

export interface ContoursLogo {
  /** Taille de police à laquelle les contours ont été générés. Toutes les
      coordonnées sont dans cette unité : diviser par `em` pour obtenir une
      échelle indépendante de la taille de rendu. */
  em: number;
  /** « Le » — Instrument Serif italique. */
  serif: TraceLogo;
  /** « CLUB » — Outfit 600, interlettrage 0.2 em déjà intégré au tracé. */
  capitales: TraceLogo;
}
