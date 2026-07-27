/* ══════════════════════════════════════════════════════════════════════
   DevChrome — barre de navigation de développement, HORS du téléphone.

   Ce n'est pas de l'app : c'est un échafaudage pour atteindre le seul
   point d'entrée qui n'a pas encore de lien dans le design (l'écran
   d'invitation qui précède la création de compte). À supprimer quand cet
   accès existera dans l'app (lien e-mail one-shot).

   La bascule de rôle candidat/entreprise, elle, vit désormais dans l'app
   elle-même — voir <RoleSwitcher> dans atoms.tsx.
   ══════════════════════════════════════════════════════════════════════ */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

function Chip({ on, children, ...p }: { on: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={'chip' + (on ? ' on' : '')} {...p}>{children}</button>
  );
}

export default function DevChrome({ horsNav, onHorsNav }: {
  horsNav: 'invitation' | null;
  onHorsNav: (h: 'invitation' | null) => void;
}) {
  return (
    <div className="chrome">
      <span className="chrome-label">entrée</span>
      <Chip on={horsNav === 'invitation'} onClick={() => onHorsNav('invitation')}>5a2 · INVITATION</Chip>
      <Chip on={horsNav === null} onClick={() => onHorsNav(null)}>APP</Chip>
    </div>
  );
}
