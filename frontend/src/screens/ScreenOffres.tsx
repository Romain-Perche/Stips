/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Offres » — pro · design 6a, étendu

   Deux sections derrière une bascule :
     · Offres   — les miennes, par état ; « Voir » ouvre les candidatures
     · Talents  — le deck de cartes flip des membres en recherche

   Les candidatures ne sont pas une section : elles appartiennent à une
   offre, donc elles vivent derrière le « Voir » de cette offre. C'est un
   niveau de profondeur, pas un troisième onglet.

   Le deck vient de `ScreenTalents.tsx` (`TalentDeck`), importé et non
   recopié : la révision des rôles retire l'onglet Talents et ne garde
   que cette section.

   Les compteurs de candidatures sont **calculés** depuis
   `DATA.candidatures`, jamais lus dans `Offre.recues` — sinon la carte
   annonce 12 et le détail en montre 2. Voir `backend/README.md` § les
   valeurs qu'on ne stocke pas.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from 'react';
import { C, DATA } from '@stips/core';
import type { Candidature, Offre } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, Avatar, Segmented, Screen } from '../atoms';
import { TalentDeck } from './ScreenTalents';
import type { TabScreen } from '../types';

const SECTIONS = ['Offres', 'Talents'] as const;
type Section = (typeof SECTIONS)[number];

/** « il y a 3 h », « il y a 2 j » — la base garde un nombre d'heures,
    c'est l'écran qui écrit la phrase. Voir `backend/README.md`. */
const ilYA = (h: number) => (h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`);

const recuesPour = (titre: string) => DATA.candidatures.filter(c => c.offre === titre);

function ScreenOffres({ nav }: { nav: ReactNode }) {
  const [section, setSection] = useState<Section>('Offres');
  const [ouverte, setOuverte] = useState<string | null>(null);

  const offre = DATA.offres.liste.find(o => o.titre === ouverte);

  // ── Le détail d'une offre : ses candidatures ────────────────────────
  if (offre) {
    const recues = recuesPour(offre.titre);
    return (
      <Screen nav={nav}>
        <div style={{ flex: 'none', padding: '16px 22px 14px' }}>
          <div onClick={() => setOuverte(null)} style={{
            font: `500 12px ${F.ui}`, color: C.muted, cursor: 'pointer',
          }}>‹ Mes offres</div>
          <div style={{ font: `400 26px/1.15 ${F.serif}`, color: C.ink, marginTop: 10 }}>
            {offre.titre}
          </div>
          <Mono style={{ marginTop: 7 }}>{offre.meta}</Mono>
        </div>

        <div className="body">
          <div style={{ padding: '16px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Mono>{recues.length} CANDIDATURE{recues.length > 1 ? 'S' : ''}</Mono>
            {recues.map(c => <CandidatureCard key={c.talent} c={c} />)}
            {recues.length === 0 && (
              <Mono color={C.muted}>PERSONNE N'A ENCORE POSTULÉ</Mono>
            )}
          </div>
        </div>
      </Screen>
    );
  }

  // ── La liste, ou le deck ────────────────────────────────────────────
  const entetes: Record<Section, [string, string]> = {
    Offres: ['Mes offres',
      `${DATA.offres.liste.length} offres en ligne · ${DATA.candidatures.length} candidatures reçues`],
    Talents: ['Les talents', 'Les membres qui se sont déclarés en recherche'],
  };
  const [titre, sous] = entetes[section];

  return (
    <Screen nav={nav}>
      <div style={{ flex: 'none', padding: '16px 22px 14px' }}>
        <div style={{ font: `400 32px/1 ${F.serif}`, color: C.ink }}>{titre}</div>
        <div style={{ font: `400 13px ${F.ui}`, color: C.muted, marginTop: 4 }}>{sous}</div>
        <Segmented items={[...SECTIONS]} active={section}
          onChange={s => setSection(s as Section)} />
      </div>

      {section === 'Talents' ? <TalentDeck /> : (
        <>
          <div className="body">
            <div style={{ padding: '16px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DATA.offres.liste.map(o => (
                <OffreCard key={o.titre} o={o} onVoir={() => setOuverte(o.titre)} />
              ))}

              {/* Publier une offre */}
              <Card dark style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, cursor: 'pointer',
              }}>
                <div>
                  <div style={{ font: `600 17px ${F.ui}`, color: C.cream }}>Publier une offre</div>
                  <div style={{ font: `400 12px ${F.ui}`, color: C.creamMut, marginTop: 4 }}>
                    Visible par les {DATA.membresTotal} profils parrainés
                  </div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: C.cream, color: C.ink,
                  display: 'grid', placeItems: 'center', font: `300 24px ${F.ui}`, flex: 'none',
                }}>+</div>
              </Card>
            </div>
          </div>
        </>
      )}
    </Screen>
  );
}

/** Une offre du pro. Le gros chiffre est le nombre de candidatures, compté
    et non stocké ; « Voir » descend dans leur liste. */
function OffreCard({ o, onVoir }: { o: Offre; onVoir: () => void }) {
  const recues = recuesPour(o.titre);
  const nonLues = recues.filter(c => !c.lue).length;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <Mono>{o.meta}</Mono>
          <div style={{ font: `600 18px/1.25 ${F.ui}`, color: C.ink, marginTop: 6 }}>{o.titre}</div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          <div style={{ font: `400 30px/1 ${F.serif}`, color: C.ink }}>{recues.length}</div>
          <Mono>REÇUES</Mono>
        </div>
      </div>

      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ font: `400 12px ${F.ui}`, color: C.muted }}>
          {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est lu'}
        </div>
        <Stk size={13} pad="9px 16px" onClick={onVoir}>Voir</Stk>
      </div>
    </Card>
  );
}

/** Une candidature, dans le détail d'une offre : le candidat, le mot de son
    parrain, et depuis quand elle attend. */
function CandidatureCard({ c }: { c: Candidature }) {
  const t = DATA.talents.find(x => x.id === c.talent);
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <Avatar size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ font: `600 15px ${F.ui}`, color: C.ink }}>{t?.nom ?? c.talent}</div>
            {!c.lue && (
              <span style={{
                padding: '2px 7px', borderRadius: 5, background: C.ink, color: C.cream,
                font: `500 9px ${F.mono}`,
              }}>NOUVEAU</span>
            )}
          </div>
          <div style={{ font: `400 12px ${F.ui}`, color: C.muted, marginTop: 2 }}>{t?.ecole}</div>
        </div>
        {t && (
          <div style={{ textAlign: 'right', flex: 'none' }}>
            <div style={{ font: `400 16px/1.2 ${F.serif}`, color: C.ink }}>{t.qualificatif}</div>
            <Mono>QUALITÉ</Mono>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ font: `400 12px ${F.ui}`, color: C.muted }}>{ilYA(c.heures)}</div>
        <Stk size={13} pad="9px 16px">Voir le profil</Stk>
      </div>
    </Card>
  );
}

(ScreenOffres as TabScreen).tab = { id: 'offres', label: 'Offres' };

export default ScreenOffres as TabScreen;
