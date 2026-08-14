/* ══════════════════════════════════════════════════════════════════════
   TYPES — le seul type qui ne peut pas être partagé avec le web : côté
   mobile l'écran ne reçoit aucune prop, c'est React Navigation qui rend
   la barre d'onglets. Les formes de données (les interfaces qui composent
   DATA) vivent dans @stips/core.
   ══════════════════════════════════════════════════════════════════════ */

import type { ComponentType } from 'react';
import type { TabMeta } from '@stips/core';

/** Un écran qui a sa place dans la barre d'onglets : il porte son nom
    sur lui-même (`.tab`), lu par la navigation (React Navigation). */
export type TabScreen = ComponentType<Record<string, never>> & { tab: TabMeta };
