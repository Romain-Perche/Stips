/* ══════════════════════════════════════════════════════════════════════
   API — le client HTTP du site. `/api` est réécrit vers le serveur par
   Vercel en production (vercel.json) et par Vite en local (vite.config.ts) :
   même origine, donc le cookie de session part tout seul.
   ══════════════════════════════════════════════════════════════════════ */

import { creerClient } from '@stips/api';

export const api = creerClient('/api');
