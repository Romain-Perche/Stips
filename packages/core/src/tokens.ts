/* ══════════════════════════════════════════════════════════════════════
   TOKENS — la palette du design validé, partagée par web et mobile.
   Les polices (F) ne le sont pas : React Native n'a pas de raccourci
   `font: "500 12px X"`, chaque graisse y est un fichier de police chargé
   séparément. Voir frontend/src/tokens.ts et mobile/src/tokens.ts.
   ══════════════════════════════════════════════════════════════════════ */

export const C = {
  bg:        '#f7f5ef',   // fond de l'app
  ink:       '#14140f',   // noir du Club
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

/** Les deux tons du motif hachuré (avatars, pièces jointes, en attendant
    les photos). Web les interpole dans un gradient CSS (hatch(), dans
    frontend/src/tokens.ts) ; mobile les passe à un <Pattern> SVG
    (<Hatch>, dans mobile/src/atoms.tsx). */
export const HATCH_COLORS = { a: '#e6e1d3', b: '#efebdf' } as const;
export const HATCH_STRIPE = 5;
