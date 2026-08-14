/* ══════════════════════════════════════════════════════════════════════
   TOKENS — les polices, propres au web (voir @stips/core pour la
   palette, partagée). Seul fichier à toucher pour changer les polices.
   ══════════════════════════════════════════════════════════════════════ */

import { HATCH_COLORS as H, HATCH_STRIPE } from '@stips/core';

export const F = {
  serif: 'Instrument Serif, serif',
  ui:    'Outfit, sans-serif',
  mono:  'JetBrains Mono, monospace',
} as const;

/** Motif hachuré qui sert d'avatar et de pièce jointe dans tout le design.
    Les couleurs et le pas viennent de @stips/core, partagés avec le
    <Hatch> SVG de mobile. */
export const hatch = (s: number = HATCH_STRIPE): string =>
  `repeating-linear-gradient(45deg,${H.a},${H.a} ${s}px,${H.b} ${s}px,${H.b} ${s * 2}px)`;
