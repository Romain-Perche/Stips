/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Offres » — entreprise · design 6a
   Mes offres publiées.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from 'react';
import { C, F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen } from '../atoms';
import { DATA } from '../data';
import type { TabScreen } from '../types';

function ScreenOffres({ nav }: { nav: ReactNode }) {
  const [filtre, setFiltre] = useState('En ligne');

  return (
    <Screen nav={nav}>
      <ScreenHead titre="Mes offres" sous={DATA.offres.resume} />
      <Pills items={['En ligne', 'Brouillons', 'Clôturées']} active={filtre} onChange={setFiltre} />

      <div className="body">
        <div style={{ padding: '16px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtre === 'En ligne' ? DATA.offres.liste.map(o => (
            <Card key={o.titre}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Mono>{o.meta}</Mono>
                  <div style={{ font: `600 18px/1.25 ${F.ui}`, color: C.ink, marginTop: 6 }}>{o.titre}</div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none' }}>
                  <div style={{ font: `400 30px/1 ${F.serif}`, color: C.ink }}>{o.recues}</div>
                  <Mono>REÇUES</Mono>
                </div>
              </div>
              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ font: `400 12px ${F.ui}`, color: C.muted }}>{o.pied}</div>
                <Stk size={13} pad="9px 16px">Voir</Stk>
              </div>
            </Card>
          )) : (
            <Mono>RIEN DANS « {filtre.toUpperCase()} »</Mono>
          )}

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
    </Screen>
  );
}

(ScreenOffres as TabScreen).tab = { id: 'offres', label: 'Offres' };

export default ScreenOffres as TabScreen;
