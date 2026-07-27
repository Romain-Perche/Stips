/* ══════════════════════════════════════════════════════════════════════
   DevChrome — barre de navigation de développement, HORS du téléphone.

   Ce n'est pas de l'app : c'est un échafaudage pour atteindre les deux
   points d'entrée qui n'ont pas encore de lien dans le design (la bascule
   de rôle candidat/entreprise, et l'écran d'invitation qui précède la
   création de compte). À supprimer quand ces liens existeront dans l'app.
   ══════════════════════════════════════════════════════════════════════ */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Role } from './types';

function Chip({ on, children, ...p }: { on: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={'chip' + (on ? ' on' : '')} {...p}>{children}</button>
  );
}

export default function DevChrome({ role, horsNav, onRole, onHorsNav }: {
  role: Role;
  horsNav: 'invitation' | null;
  onRole: (r: Role) => void;
  onHorsNav: (h: 'invitation' | null) => void;
}) {
  return (
    <div className="chrome">
      <span className="chrome-label">rôle</span>
      <Chip on={role === 'candidat' && !horsNav}   onClick={() => onRole('candidat')}>CANDIDAT</Chip>
      <Chip on={role === 'entreprise' && !horsNav} onClick={() => onRole('entreprise')}>ENTREPRISE</Chip>

      <span className="chrome-label" style={{ marginLeft: 12 }}>entrée</span>
      <Chip on={horsNav === 'invitation'} onClick={() => onHorsNav('invitation')}>5a2 · INVITATION</Chip>
    </div>
  );
}
