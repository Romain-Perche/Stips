/* ══════════════════════════════════════════════════════════════════════
   LE RÔLE COURANT — un contexte, et pas une prop qui descend.

   Deux consommateurs seulement, mais tous les deux à trois niveaux de
   profondeur du seul endroit qui connaît le rôle (App) : la barre d'état
   (`StatusBar`, dans atoms.tsx) et la partie 2 de « Qui suis-je ? ». Le
   faire descendre imposerait de traverser les sept écrans, dont cinq qui
   n'en ont aucun usage.

   `null` = personne n'est connecté — c'est le cas de l'écran d'invitation,
   qui précède la création de compte et n'affiche donc aucun badge.
   ══════════════════════════════════════════════════════════════════════ */

import { createContext, useContext } from 'react';
import type { Role } from '@stips/core';

export const RoleCtx = createContext<Role | null>(null);

export const useRole = () => useContext(RoleCtx);
