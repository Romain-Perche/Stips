/* ══════════════════════════════════════════════════════════════════════
   LE DECK DE TALENTS — design 2a · plus un onglet

   Les membres qui se sont déclarés en recherche, une carte flip par
   personne. C'était l'onglet « Talents » du pro ; la révision des rôles
   en fait la section « Talents » de l'onglet Offres — seul endroit de
   l'app où la note et le commentaire d'un parrain se lisent.

   Le fichier reste, sans coquille d'écran ni métadonnées d'onglet : il
   n'exporte plus que `TalentDeck`, monté par `ScreenOffres.tsx`.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { C, DATA } from '@stips/core';
import type { Talent } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar } from '../atoms';

/** Une carte par talent, à la suite, qu'on parcourt en scrollant — pas de
    filtres ni de pagination par bouton. */
export function TalentDeck() {
  return (
    <div className="body">
      <div style={{
        padding: '18px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {DATA.talents.map(t => <TalentCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}

/** Une carte du deck, avec son propre flip indépendant des autres. */
function TalentCard({ t }: { t: Talent }) {
  const [flip, setFlip] = useState(false);
  return (
    <div className={'flip' + (flip ? ' on' : '')}
      onClick={() => setFlip(f => !f)} style={{ height: 350 }}>
      <div className="flipin">
        <TalentFaceA t={t} />
        <TalentFaceB t={t} onRetourner={() => setFlip(false)} />
      </div>
    </div>
  );
}

const FACE: CSSProperties = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 16,
  padding: 24, display: 'flex', flexDirection: 'column', height: 350,
};

/** Face A : le qualificatif, le parrain, le commentaire */
function TalentFaceA({ t }: { t: Talent }) {
  return (
    <div className="face" style={FACE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Avatar size={64} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: `400 30px/1.15 ${F.serif}`, color: C.ink }}>{t.qualificatif}</div>
          <Mono>LE MOT DE SON PARRAIN</Mono>
        </div>
      </div>
      <div style={{ marginTop: 18, font: `600 26px/1.15 ${F.ui}`, color: C.ink }}>{t.nom}</div>
      <div style={{ font: `400 14px ${F.ui}`, color: C.muted, marginTop: 3 }}>{t.ecole}</div>

      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(0,0,0,.09)' }}>
        <Mono>PARRAINÉ(E) PAR</Mono>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Avatar size={32} r={4} />
          <div>
            <div style={{ font: `600 14px ${F.ui}`, color: C.ink }}>{t.parrain}</div>
            <div style={{ font: `400 12px ${F.ui}`, color: C.muted2 }}>{t.parrainRole}</div>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 16, font: `italic 400 16px/1.45 ${F.serif}`,
        color: C.ink3, textWrap: 'pretty',
      }}>{t.reco}</div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ font: `500 11px ${F.mono}`, color: C.faint }}>TAPE POUR RETOURNER ↻</div>
      </div>
    </div>
  );
}

/** Face B : stage recherché, disponibilités, expériences + accès aux pièces */
function TalentFaceB({ t, onRetourner }: { t: Talent; onRetourner: () => void }) {
  const rond = (contenu: ReactNode, tooltip: string | null, font?: string) => (
    <div className="stk" style={{
      position: 'relative', width: 48, height: 48, borderRadius: '50%',
      border: '1px solid rgba(0,0,0,.16)', color: C.ink,
      display: 'grid', placeItems: 'center', cursor: 'pointer',
      font: font || `500 11px ${F.mono}`, letterSpacing: '.04em',
    }}>
      {contenu}
      {tooltip && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 9px)', left: '50%',
          transform: 'translateX(-50%)', whiteSpace: 'nowrap',
          padding: '5px 10px', borderRadius: 5, background: C.ink, color: C.cream,
          font: `500 11px ${F.ui}`, opacity: 0, pointerEvents: 'none',
          transition: 'opacity .18s',
        }}>{tooltip}</span>
      )}
    </div>
  );

  return (
    <div className="face back" style={FACE}>
      <Mono>CE QU'IL/ELLE CHERCHE</Mono>
      <div style={{ marginTop: 10, font: `400 28px/1.15 ${F.serif}`, color: C.ink }}>{t.cherche}</div>

      <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Mono>DISPONIBILITÉS</Mono>
          <div style={{ font: `500 17px ${F.ui}`, color: C.ink, marginTop: 4 }}>{t.dispo}</div>
        </div>
        <div>
          <Mono>EXPÉRIENCES PRINCIPALES</Mono>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 7 }}>
            {t.experiences.map(e => (
              <div key={e.titre} style={{ font: `500 15px/1.3 ${F.ui}`, color: C.ink }}>
                {e.titre} <span style={{ color: C.muted2, fontWeight: 400 }}>· {e.duree}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {rond('CV', 'Voir le CV')}
        {rond('IN', 'LinkedIn')}
        {rond('℞', 'Lettre de reco du parrain', `400 17px ${F.serif}`)}
        <div onClick={e => { e.stopPropagation(); onRetourner(); }}
          style={{ marginLeft: 'auto' }}>
          {rond('↻', null, `400 15px ${F.ui}`)}
        </div>
      </div>
    </div>
  );
}
