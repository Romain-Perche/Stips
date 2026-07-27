/* ══════════════════════════════════════════════════════════════════════
   TOKENS — la palette et les polices du design validé.
   Seul fichier à toucher pour changer l'identité visuelle de l'app.

   Contrairement au web, React Native n'a pas de raccourci `font: "500 12px
   X"` : chaque graisse est une police chargée séparément (voir App.tsx,
   useFonts). F référence directement le nom de la police chargée pour
   chaque usage — un seul endroit à changer si une graisse change.
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
  serif:        'InstrumentSerif_400Regular',
  serifItalic:  'InstrumentSerif_400Regular_Italic',
  uiRegular:    'Outfit_400Regular',
  uiMedium:     'Outfit_500Medium',
  uiSemiBold:   'Outfit_600SemiBold',
  monoMedium:   'JetBrainsMono_500Medium',
} as const;

/** Les deux tons du motif hachuré (avatars, pièces jointes, en attendant
    les photos). Utilisé par le composant <Hatch> dans atoms.tsx — une
    grille SVG ne peut pas vivre dans un fichier .ts sans JSX. */
export const HATCH_COLORS = { a: '#e6e1d3', b: '#efebdf' } as const;
export const HATCH_STRIPE = 5;
