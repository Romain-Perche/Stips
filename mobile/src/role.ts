/* ══════════════════════════════════════════════════════════════════════
   LE RÔLE COURANT — un contexte, et pas une prop qui descend.

   Même raisonnement que côté web (`frontend/src/role.ts`), avec une raison
   de plus ici : les écrans sont montés par React Navigation, qui ne
   transmet que ses propres props — leur passer le rôle demanderait de
   ré-encapsuler chaque <Tab.Screen>.

   `null` = personne n'est connecté — c'est le cas de l'écran d'invitation,
   qui précède la création de compte et n'affiche donc aucun badge.
   ══════════════════════════════════════════════════════════════════════ */

import { createContext, useContext } from 'react';
import type { Role } from '@stips/core';

export const RoleCtx = createContext<Role | null>(null);

export const useRole = () => useContext(RoleCtx);
