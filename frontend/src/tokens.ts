/* ══════════════════════════════════════════════════════════════════════
   TOKENS — la palette et les polices du design validé.
   Seul fichier à toucher pour changer l'identité visuelle de l'app.
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

export const F = {
  serif: 'Instrument Serif, serif',
  ui:    'Outfit, sans-serif',
  mono:  'JetBrains Mono, monospace',
} as const;

/** Motif hachuré qui sert d'avatar et de pièce jointe dans tout le design */
export const hatch = (s: number = 5): string =>
  `repeating-linear-gradient(45deg,#e6e1d3,#e6e1d3 ${s}px,#efebdf ${s}px,#efebdf ${s * 2}px)`;
