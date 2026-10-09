import type { Qualificatif } from './types';

/** Le code en base → le mot affiché. Le fil transporte le code (`curiosite`),
    les apps écrivent le mot (« Curiosité ») : voir packages/api. */
export const QUALIFICATIFS = {
  autonomie:  'Autonomie',
  rigueur:    'Rigueur',
  curiosite:  'Curiosité',
  fiabilite:  'Fiabilité',
  methode:    'Méthode',
  tenacite:   'Ténacité',
  creativite: 'Créativité',
  initiative: 'Initiative',
} as const satisfies Record<string, Qualificatif>;

export type CodeQualificatif = keyof typeof QUALIFICATIFS;
