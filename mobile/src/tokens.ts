/* ══════════════════════════════════════════════════════════════════════
   TOKENS — les polices, propres à mobile (voir @leclub/core pour la
   palette et le motif hachuré, partagés avec le web).

   Contrairement au web, React Native n'a pas de raccourci `font: "500
   12px X"` : chaque graisse est une police chargée séparément (voir
   App.tsx, useFonts). F référence directement le nom de la police
   chargée pour chaque usage — un seul endroit à changer si une graisse
   change.
   ══════════════════════════════════════════════════════════════════════ */

export const F = {
  serif:        'InstrumentSerif_400Regular',
  serifItalic:  'InstrumentSerif_400Regular_Italic',
  uiRegular:    'Outfit_400Regular',
  uiMedium:     'Outfit_500Medium',
  uiSemiBold:   'Outfit_600SemiBold',
  monoMedium:   'JetBrainsMono_500Medium',
} as const;
