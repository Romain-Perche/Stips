/* ══════════════════════════════════════════════════════════════════════
   TOKENS — la palette du design validé, partagée par web et mobile.
   Les polices (F) ne le sont pas : React Native n'a pas de raccourci
   `font: "500 12px X"`, chaque graisse y est un fichier de police chargé
   séparément. Voir frontend/src/tokens.ts et mobile/src/tokens.ts.
   ══════════════════════════════════════════════════════════════════════ */

export const C = {
  bg:        '#f7f5ef',   // fond de l'app
  ink:       '#14140f',   // noir de Stips
  ink2:      '#2b2a24',
  ink3:      '#3c3a33',
  ink4:      '#4a483f',
  muted:     '#77746a',   // texte secondaire
  muted2:    '#8a877c',   // micro-labels mono
  faint:     '#a5a296',   // texte très clair / icônes inactives
  card:      '#ffffff',
  cream:     '#f7f5ef',   // texte sur fond noir
  creamMut:  '#a5a296',
  creamFai:  '#8d8a7e',
  line:      'rgba(0,0,0,.1)',
  lineSoft:  'rgba(0,0,0,.07)',
  lineFaint: 'rgba(0,0,0,.06)',
  fieldLine: 'rgba(0,0,0,.14)',
  wash:      'rgba(0,0,0,.05)',
} as const;

/** La teinte du S du wordmark, une par variante de build.

    C'est le seul écart de couleur entre les trois apps, et il est
    délibéré : trois binaires peuvent être installés côte à côte sur le
    même téléphone (bundle ids distincts, voir mobile/app.config.ts), et
    la teinte est ce qui dit lequel on ouvre — sur l'icône, sur l'écran
    de démarrage et dans l'en-tête de chaque écran.

    `production` est donc AUSSI la teinte de la marque tout court : c'est
    elle que porte le web, qui n'a pas de variantes.

    Ces trois valeurs sont recopiées dans `scripts/logo/generer.mjs`, qui
    ne peut pas importer ce module (il tourne avant toute compilation,
    sur du TypeScript non transpilé). Les changer ici impose de les
    changer là-bas et de relancer le générateur. */
export const TEINTES_VARIANTE = {
  production: '#8C7B6B',   // taupe — 6a
  preview: '#1B3A6B',      // bleu foncé — 6b
  development: '#B3382C',  // rouge — 6c
} as const;

/** Les deux tons du motif hachuré (avatars, pièces jointes, en attendant
    les photos). Web les interpole dans un gradient CSS (hatch(), dans
    frontend/src/tokens.ts) ; mobile les passe à un <Pattern> SVG
    (<Hatch>, dans mobile/src/atoms.tsx). */
export const HATCH_COLORS = { a: '#e6e1d3', b: '#efebdf' } as const;
export const HATCH_STRIPE = 5;
