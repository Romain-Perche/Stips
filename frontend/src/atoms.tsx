/* ══════════════════════════════════════════════════════════════════════
   ATOMES — les briques réutilisées par tous les écrans.
   ══════════════════════════════════════════════════════════════════════ */

import type { CSSProperties, ReactNode } from 'react';
import { C, F, hatch } from './tokens';
import type { Membre, Role, TabScreen } from './types';

/** Micro-label mono en capitales : « NOTE GLOBALE », « DISPONIBILITÉS »… */
export function Mono({ children, color = C.muted2, size = 10, style }: {
  children: ReactNode; color?: string; size?: number; style?: CSSProperties;
}) {
  return (
    <div style={{ font: `500 ${size}px ${F.mono}`, color, letterSpacing: '.08em', ...style }}>
      {children}
    </div>
  );
}

/** Barre d'état du téléphone : l'heure à gauche, « Le Club » à droite */
export function StatusBar({ color = C.ink }: { color?: string }) {
  return (
    <div style={{
      height: 54, flex: 'none', display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', padding: '0 22px 6px',
      color, font: `500 13px ${F.mono}`,
    }}>
      <span>9:41</span>
      <span style={{ font: `italic 400 20px/1 ${F.serif}`, letterSpacing: '.01em' }}>Le Club</span>
    </div>
  );
}

/** Titre d'écran en Instrument Serif, avec sous-titre optionnel */
export function ScreenHead({ titre, sous, right, border = true, pad = '16px 22px 12px' }: {
  titre: string; sous?: string; right?: ReactNode; border?: boolean; pad?: string;
}) {
  return (
    <div style={{
      flex: 'none', padding: pad,
      borderBottom: border ? `1px solid rgba(0,0,0,.08)` : 'none',
      display: right ? 'flex' : 'block',
      alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ font: `400 32px/1 ${F.serif}`, color: C.ink }}>{titre}</div>
        {sous && (
          <div style={{ font: `400 13px ${F.ui}`, color: C.muted, marginTop: 4 }}>{sous}</div>
        )}
      </div>
      {right}
    </div>
  );
}

/** Avatar hachuré */
export function Avatar({ size = 44, r = 5 }: { size?: number; r?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: hatch(r), flex: 'none',
    }} />
  );
}

/** Bouton contour → noir au survol. Sert à « Écrire », « Voir », « Je viens »… */
export function Stk({ children, onClick, size = 12, pad = '8px 14px', style }: {
  children: ReactNode; onClick?: () => void; size?: number; pad?: string; style?: CSSProperties;
}) {
  return (
    <div className="stk" onClick={onClick} style={{
      padding: pad, borderRadius: 99, border: '1px solid rgba(0,0,0,.16)',
      color: C.ink, font: `600 ${size}px ${F.ui}`, cursor: 'pointer', flex: 'none',
      ...style,
    }}>
      {children}
    </div>
  );
}

/** Rangée de filtres carrés (Tous / 4.5+ / Dispo été / ⚙) */
export function Pills({ items, active, onChange, border = true }: {
  items: string[]; active: string; onChange?: (p: string) => void; border?: boolean;
}) {
  return (
    <div style={{
      flex: 'none', padding: '12px 22px', display: 'flex', gap: 7,
      borderBottom: border ? `1px solid ${C.lineFaint}` : 'none',
    }}>
      {items.map(p => {
        const on = p === active;
        return (
          <div key={p} onClick={() => onChange && onChange(p)} style={{
            padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
            background: on ? C.ink : C.wash,
            color: on ? C.cream : C.ink4,
            font: `500 12px ${F.ui}`,
          }}>{p}</div>
        );
      })}
    </div>
  );
}

/** Bascule à deux états, façon segmented control (Personnes / Boîtes) */
export function Segmented({ items, active, onChange }: {
  items: string[]; active: string; onChange: (i: string) => void;
}) {
  return (
    <div style={{
      marginTop: 12, display: 'flex', background: C.wash,
      borderRadius: 10, padding: 3,
    }}>
      {items.map(i => {
        const on = i === active;
        return (
          <div key={i} onClick={() => onChange(i)} style={{
            flex: 1, padding: 9, borderRadius: 8, cursor: 'pointer',
            background: on ? C.ink : 'transparent',
            color: on ? C.cream : C.ink4,
            font: `600 13px ${F.ui}`, textAlign: 'center',
          }}>{i}</div>
        );
      })}
    </div>
  );
}

/** Le choix candidat / entreprise : bandeau plein, en haut de l'app,
    toujours visible. Provisoire tant que le compte entreprise n'est pas
    distinct du compte candidat (voir « À trancher » dans la description
    du projet) — remplace l'ancien sélecteur caché dans la barre de dev. */
export function RoleSwitcher({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div style={{ flex: 'none', background: C.ink, padding: '14px 16px 10px' }}>
      <div style={{ display: 'flex', background: 'rgba(255,255,255,.12)', borderRadius: 14, padding: 4 }}>
        {(['candidat', 'entreprise'] as const).map(r => {
          const on = r === role;
          return (
            <div key={r} onClick={() => onChange(r)} style={{
              flex: 1, padding: '15px 0', borderRadius: 11, textAlign: 'center', cursor: 'pointer',
              background: on ? C.cream : 'transparent',
              color: on ? C.ink : C.creamMut,
              font: `600 15px ${F.ui}`, letterSpacing: '.02em',
            }}>{r === 'candidat' ? 'CANDIDAT' : 'ENTREPRISE'}</div>
          );
        })}
      </div>
    </div>
  );
}

/** Champ de recherche */
export function SearchField({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const rempli = value.length > 0;
  return (
    <div style={{
      marginTop: 14, background: C.card, borderRadius: 11,
      border: rempli ? `1.5px solid ${C.ink}` : `1px solid ${C.fieldLine}`,
      padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ font: `400 15px ${F.ui}`, color: rempli ? C.ink : C.faint }}>⌕</span>
      <input className="bare" value={value} placeholder={placeholder}
             onChange={e => onChange(e.target.value)} />
      {rempli && (
        <span onClick={() => onChange('')} style={{
          font: `400 15px ${F.ui}`, color: C.faint, cursor: 'pointer',
        }}>×</span>
      )}
    </div>
  );
}

/** Rangée « une personne » : avatar, nom (+ badge PARRAIN), sous-titre, action */
export function PersonRow({ p, size = 44, last, onWrite }: {
  p: Membre; size?: number; last?: boolean; onWrite?: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0',
      borderBottom: last ? 'none' : `1px solid ${C.lineSoft}`,
    }}>
      <Avatar size={size} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ font: `600 15px ${F.ui}`, color: C.ink }}>{p.nom}</div>
          {p.parrain && (
            <span style={{
              padding: '2px 7px', borderRadius: 5, background: C.ink, color: C.cream,
              font: `500 9px ${F.mono}`,
            }}>PARRAIN</span>
          )}
        </div>
        <div style={{ font: `400 12px ${F.ui}`, color: C.muted, marginTop: 2 }}>{p.sous}</div>
      </div>
      <Stk onClick={onWrite}>Écrire</Stk>
    </div>
  );
}

/** Carte blanche standard */
export function Card({ children, style, dark, radius = 16, pad = 18 }: {
  children: ReactNode; style?: CSSProperties; dark?: boolean; radius?: number; pad?: number;
}) {
  return (
    <div style={{
      background: dark ? C.ink : C.card,
      border: dark ? 'none' : `1px solid ${C.line}`,
      borderRadius: radius, padding: pad, ...style,
    }}>{children}</div>
  );
}

/** État vide, pour les écrans pas encore dessinés */
export function Placeholder({ label, texte }: { label: string; texte: string }) {
  return (
    <div style={{ padding: '18px 22px 96px' }}>
      <div style={{
        height: 220, borderRadius: 16, background: hatch(6),
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center',
      }}>
        <Mono color={C.muted2}>{label}</Mono>
        <div style={{ font: `400 13px/1.5 ${F.ui}`, color: C.muted, maxWidth: 240 }}>{texte}</div>
      </div>
    </div>
  );
}


/* ── La barre d'onglets ─────────────────────────────────────────────────
   Elle ne connaît aucun nom d'onglet en dur : elle reçoit la liste des
   écrans de la navigation courante et lit le nom de chacun sur son
   propre composant (`Ecran.tab.label`). Renommer un onglet se fait donc
   à un seul endroit : dans le fichier de l'écran concerné.
   ──────────────────────────────────────────────────────────────────── */
export function TabBar({ screens, active, onChange }: {
  screens: TabScreen[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 74,
      background: C.card, borderTop: '1px solid rgba(0,0,0,.09)',
      display: 'flex', alignItems: 'flex-start', paddingTop: 12,
    }}>
      {screens.map(Ecran => {
        const { id, label } = Ecran.tab;
        const on = id === active;
        return (
          <div key={id} onClick={() => onChange(id)} style={{
            flex: 1, textAlign: 'center', cursor: 'pointer',
            font: `500 11px ${F.ui}`, color: on ? C.ink : C.faint,
          }}>
            {on ? '◈' : '◇'}
            <div style={{ marginTop: 3 }}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Coquille d'un écran : barre d'état + contenu + onglets (ou CTA fixe).
    Le conteneur est positionné : c'est lui qui sert de repère aux éléments
    collés en bas (barre d'onglets, bouton flottant, CTA fixe). */
export function Screen({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      {children}
      {nav}
    </div>
  );
}
