/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Qui suis-je ? » — candidat · design 5b
   Modifier mon profil : ce que les entreprises verront.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from 'react';
import { C, DATA } from '@leclub/core';
import { F } from '../tokens';
import { Mono, Avatar, Stk, ScreenHead, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenProfil({ nav }: { nav: ReactNode }) {
  const [p, setP] = useState(DATA.moi);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) =>
    setP(o => ({ ...o, [k]: v }));

  return (
    <Screen nav={nav}>
      <ScreenHead titre="Qui suis-je ?" right={<Stk>Aperçu</Stk>} />

      <div className="body">
        <div style={{ padding: '18px 22px 96px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar size={66} />
            <div>
              <div style={{ font: `600 19px ${F.ui}`, color: C.ink }}>{p.nom}</div>
              <div style={{
                font: `500 11px ${F.mono}`, color: C.muted2, marginTop: 4,
                textDecoration: 'underline', cursor: 'pointer',
              }}>CHANGER LA PHOTO</div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <Mono>EN DEUX LIGNES</Mono>
            <div style={{
              marginTop: 7, background: C.card, border: '1px solid rgba(0,0,0,.12)',
              borderRadius: 11, padding: 13,
            }}>
              <textarea className="bare" rows={3} value={p.bio}
                onChange={e => set('bio', e.target.value)} />
            </div>
          </div>

          <Champ label="STAGE RECHERCHÉ" valeur={p.stage} />
          <Champ label="DISPONIBILITÉS" valeur={p.dispo} />

          {/* Expériences */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Mono>EXPÉRIENCES PRINCIPALES</Mono>
              <div style={{
                font: `500 11px ${F.ui}`, color: C.ink, textDecoration: 'underline', cursor: 'pointer',
              }}>{p.experiences.length} / 3</div>
            </div>
            <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {p.experiences.map(e => (
                <div key={e.titre} style={{
                  background: C.card, border: '1px solid rgba(0,0,0,.12)', borderRadius: 11,
                  padding: '12px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ font: `500 14px ${F.ui}`, color: C.ink }}>
                    {e.titre} <span style={{ color: C.muted2, fontWeight: 400 }}>· {e.duree}</span>
                  </span>
                  <span style={{ color: C.faint, cursor: 'pointer' }}>⋮</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pièces + enregistrer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2 }}>
            <RondPiece code="CV" tooltip="Remplacer mon CV" />
            <RondPiece code="IN" tooltip="Lier LinkedIn" />
            <div style={{
              marginLeft: 'auto', padding: '13px 22px', borderRadius: 99,
              background: C.ink, color: C.cream, font: `600 14px ${F.ui}`, cursor: 'pointer',
            }}>Enregistrer</div>
          </div>

        </div>
      </div>
    </Screen>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <Mono>{label}</Mono>
      <div style={{
        marginTop: 7, background: C.card, border: '1px solid rgba(0,0,0,.12)',
        borderRadius: 11, padding: 13, display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
      }}>
        <span style={{ font: `500 14px ${F.ui}`, color: C.ink }}>{valeur}</span>
        <span style={{ color: C.faint }}>›</span>
      </div>
    </div>
  );
}

function RondPiece({ code, tooltip }: { code: string; tooltip: string }) {
  return (
    <div className="stk" style={{
      position: 'relative', width: 60, height: 60, borderRadius: '50%',
      border: '1px solid rgba(0,0,0,.16)', color: C.ink,
      display: 'grid', placeItems: 'center', font: `500 11px ${F.mono}`, cursor: 'pointer',
    }}>
      {code}
      <span style={{
        position: 'absolute', bottom: 'calc(100% + 9px)', left: '50%',
        transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: '5px 10px',
        borderRadius: 5, background: C.ink, color: C.cream, font: `500 11px ${F.ui}`,
        opacity: 0, pointerEvents: 'none', transition: 'opacity .18s',
      }}>{tooltip}</span>
    </div>
  );
}

(ScreenProfil as TabScreen).tab = { id: 'profil', label: 'Qui suis-je ?' };

export default ScreenProfil as TabScreen;
