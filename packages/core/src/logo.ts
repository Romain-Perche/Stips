/* ══════════════════════════════════════════════════════════════════════
   LOGO — le type du tracé, séparé des données.

   `logo-contours.ts` est généré par `scripts/logo/generer.mjs` (contours
   des deux moitiés du wordmark à une taille de police de 1000) ; ce
   fichier-ci décrit sa forme, et reste écrit à la main. Les deux sont
   séparés pour que régénérer les données n'écrase pas le type.

   Rien n'importe encore ces contours : ils ont servi à produire
   `frontend/public/logo.svg`, `logo-creme.svg`, `favicon.svg` et les PNG
   de `mobile/assets/`, où les tracés sont intégrés en dur. Le type existe
   pour que la donnée générée soit vérifiée, et pour le jour où un
   composant construira le logo à l'exécution.

   Ce n'est PAS ce que l'app utilise pour son en-tête : là, Outfit est
   chargée (mobile/App.tsx) et le wordmark se compose en <Text>. Les
   contours servent aux rendus où la police ne peut pas être supposée
   présente — favicon, page statique, image d'icône.
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
  /** « S » — Outfit 800. Seule moitié teintée, et seule à servir d'icône
      d'app (le nom s'affiche sous l'icône, pas dedans). */
  s: TraceLogo;
  /** « tips » — Outfit 500, en encre. Déjà décalé pour suivre le S dans le
      MÊME repère : dessiner les deux `d` l'un après l'autre suffit à
      obtenir le wordmark, sans transformation intermédiaire. */
  tips: TraceLogo;
  /** Boîte d'encre des deux tracés réunis, pour cadrer le wordmark
      entier. Plus haute que celle du S seul : la hampe du « p » descend
      sous la ligne de base. */
  encre: BoiteEncre;
}
