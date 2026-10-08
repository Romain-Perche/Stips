/* ══════════════════════════════════════════════════════════════════════
   FORMULAIRES — les briques des pages hors app (demande, reco du pro,
   validation, connexion). Un champ, un bouton plein, une note d'état.
   Les atomes de l'app (Mono, Card, Screen) restent dans atoms.tsx.
   ══════════════════════════════════════════════════════════════════════ */

import type { ReactNode } from 'react';
import { C } from '@stips/core';
import { F } from '../tokens';
import { Mono, Screen } from '../atoms';

const styleChamp = {
  display: 'block', width: '100%', marginTop: 6, padding: '12px 14px',
  background: C.card, border: `1px solid ${C.fieldLine}`, borderRadius: 11,
  font: `400 15px/1.4 ${F.ui}`, color: C.ink, outline: 'none',
} as const;

/** Champ étiqueté. `textarea` pour le commentaire de la reco. */
export function Champ({ libelle, textarea, ...props }: {
  libelle: string; textarea?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label style={{ display: 'block' }}>
      <Mono>{libelle}</Mono>
      {textarea
        ? <textarea rows={4} style={{ ...styleChamp, resize: 'vertical' }} {...props} />
        : <input style={styleChamp} {...props} />}
    </label>
  );
}

/** Liste fermée étiquetée (le qualificatif). */
export function Selection({ libelle, options, ...props }: {
  libelle: string; options: Record<string, string>;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label style={{ display: 'block' }}>
      <Mono>{libelle}</Mono>
      <select required defaultValue="" style={styleChamp} {...props}>
        <option value="" disabled>Choisis un mot</option>
        {Object.entries(options).map(([valeur, mot]) => <option key={valeur} value={valeur}>{mot}</option>)}
      </select>
    </label>
  );
}

export function Bouton({ children, secondaire, ...props }: {
  children: ReactNode; secondaire?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{
      width: '100%', padding: 15, borderRadius: 99, cursor: 'pointer',
      background: secondaire ? 'transparent' : C.ink,
      color: secondaire ? C.ink : C.cream,
      border: secondaire ? `1px solid ${C.stroke}` : 'none',
      font: `600 15px ${F.ui}`, opacity: props.disabled ? .5 : 1,
    }}>{children}</button>
  );
}

/** Note d'état sous un formulaire : erreur en rouge, le reste en gris. */
export function Note({ children, erreur }: { children: ReactNode; erreur?: boolean }) {
  return (
    <div style={{ font: `400 13px/1.45 ${F.ui}`, color: erreur ? '#b3382c' : C.muted, textWrap: 'pretty' }}>
      {children}
    </div>
  );
}

/** Le cadre d'une page hors app : la colonne de l'app, un titre serif, le
    contenu. `sous` est la phrase sous le titre. */
export function Page({ sur, titre, sous, children }: {
  sur: string; titre: string; sous?: ReactNode; children?: ReactNode;
}) {
  return (
    <div className="ph">
      <div className="defile">
        <Screen>
          <div style={{ padding: '26px 22px 60px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <Mono>{sur}</Mono>
              <div style={{ font: `400 32px/1.08 ${F.serif}`, color: C.ink, marginTop: 10, textWrap: 'pretty' }}>{titre}</div>
              {sous && <div style={{ font: `400 15px/1.45 ${F.ui}`, color: C.ink3, marginTop: 12, textWrap: 'pretty' }}>{sous}</div>}
            </div>
            {children}
          </div>
        </Screen>
      </div>
    </div>
  );
}
