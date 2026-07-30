/* ══════════════════════════════════════════════════════════════════════
   TYPES — le seul type qui ne peut pas être partagé avec mobile : côté
   web l'écran reçoit sa propre barre d'onglets en prop (`nav`), alors
   que mobile la laisse à React Navigation. Les formes de données (les
   interfaces qui composent DATA) vivent dans @leclub/core.
   ══════════════════════════════════════════════════════════════════════ */

import type { ComponentType, ReactNode } from 'react';
import type { TabMeta } from '@leclub/core';

/** Un écran qui a sa place dans la barre d'onglets : il reçoit sa propre
    barre en prop (`nav`) et porte son nom sur lui-même (`.tab`). */
export type TabScreen = ComponentType<{ nav: ReactNode }> & { tab: TabMeta };
