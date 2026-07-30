/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Agenda » — candidat · design 3a
   « A vos agendas » : les prochains rendez-vous du Club.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type ReactNode } from 'react';
import { C, DATA } from '@leclub/core';
import type { EventItem } from '@leclub/core';
import { F, hatch } from '../tokens';
import { Mono, Card, Stk, Pills, ScreenHead, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenEvents({ nav }: { nav: ReactNode }) {
  const [filtre, setFiltre] = useState('Tout');
  const liste = filtre === 'Tout' ? DATA.events : DATA.events.filter(e => e.cats.includes(filtre));

  return (
    <Screen nav={nav}>
      <ScreenHead titre="A vos agendas" />
      <Pills items={['Tout', 'Sport', 'Bar', 'Atelier']} active={filtre} onChange={setFiltre} />

      <div className="body">
        <div style={{ padding: '14px 22px 96px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {liste.map(e => <EventCard key={e.titre} e={e} />)}
          {liste.length === 0 && <Mono>AUCUN ÉVÉNEMENT</Mono>}
        </div>
      </div>
    </Screen>
  );
}

function EventCard({ e }: { e: EventItem }) {
  const d = e.dark;
  return (
    <Card dark={d} pad={16} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ textAlign: 'center', flex: 'none' }}>
          <div style={{ font: `400 34px/1 ${F.serif}`, color: d ? C.cream : C.ink }}>{e.jour}</div>
          <Mono color={d ? C.creamFai : C.muted2} style={{ marginTop: 2 }}>{e.mois}</Mono>
        </div>
        <div style={{ flex: 1 }}>
          <Mono color={d ? C.creamMut : C.muted2}>{e.meta}</Mono>
          <div style={{ font: `600 19px/1.2 ${F.ui}`, color: d ? C.cream : C.ink, marginTop: 5 }}>{e.titre}</div>
          <div style={{ font: `400 13px ${F.ui}`, color: d ? C.creamMut : C.muted, marginTop: 3 }}>{e.sous}</div>
        </div>
      </div>

      <div style={{
        marginTop: d ? 12 : 14, paddingTop: d ? 12 : 14,
        borderTop: `1px solid ${d ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {e.avatars && (
            <div style={{ display: 'flex' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: hatch(4), border: '1.5px solid #fff' }} />
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.muted2, border: '1.5px solid #fff', marginLeft: -8 }} />
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.ink, border: '1.5px solid #fff', marginLeft: -8 }} />
            </div>
          )}
          <div style={{ font: `400 12px ${F.ui}`, color: d ? C.creamMut : C.muted }}>{e.pied}</div>
        </div>

        {d ? (
          <div style={{
            padding: '9px 16px', borderRadius: 99, background: C.cream, color: C.ink,
            font: `600 13px ${F.ui}`, cursor: 'pointer', flex: 'none',
          }}>{e.cta}</div>
        ) : (
          <Stk size={13} pad="9px 16px">{e.cta}</Stk>
        )}
      </div>
    </Card>
  );
}

(ScreenEvents as TabScreen).tab = { id: 'events', label: 'Agenda' };

export default ScreenEvents as TabScreen;
