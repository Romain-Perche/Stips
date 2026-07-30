/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Chercher » — candidat · design 8a / 8b
   L'annuaire du Club, avec la bascule Personnes / Boîtes.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState, type ReactNode } from 'react';
import { C, DATA } from '@leclub/core';
import type { Boite } from '@leclub/core';
import { F } from '../tokens';
import { Mono, Card, PersonRow, SearchField, Segmented, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenChercher({ nav }: { nav: ReactNode }) {
  const [onglet, setOnglet] = useState<'Personnes' | 'Boîtes'>('Personnes');
  const [q, setQ] = useState('');

  const membres = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return DATA.membres;
    return DATA.membres.filter(m =>
      (m.nom + ' ' + m.sous).toLowerCase().includes(t));
  }, [q]);

  const boites = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return DATA.boites;
    return DATA.boites.filter(b =>
      (b.nom + ' ' + b.secteur).toLowerCase().includes(t));
  }, [q]);

  const personnes = onglet === 'Personnes';

  return (
    <Screen nav={nav}>
      <div style={{ flex: 'none', padding: '16px 22px 14px' }}>
        <div style={{ font: `400 32px/1 ${F.serif}`, color: C.ink }}>
          {personnes ? "Trouver quelqu'un" : 'Trouver une boîte'}
        </div>
        {!personnes && (
          <div style={{ font: `400 13px ${F.ui}`, color: C.muted, marginTop: 4 }}>
            Vois qui du Club y est passé avant de postuler
          </div>
        )}
        <SearchField value={q} onChange={setQ}
          placeholder={personnes ? 'Une boîte, un métier, une école…' : 'Le nom d’une boîte…'} />
        <Segmented items={['Personnes', 'Boîtes']} active={onglet}
          onChange={t => { setOnglet(t as 'Personnes' | 'Boîtes'); setQ(''); }} />
      </div>

      <div className="body">
        {personnes ? (
          <div style={{ padding: '0 22px 96px' }}>
            <Mono style={{ marginBottom: 2 }}>
              {q.trim() ? `${membres.length} RÉSULTAT${membres.length > 1 ? 'S' : ''}`
                        : `${DATA.membresTotal} MEMBRES`}
            </Mono>
            {membres.map((m, i) => (
              <PersonRow key={m.nom} p={m} last={i === membres.length - 1} />
            ))}
            {membres.length === 0 && (
              <Mono style={{ marginTop: 18 }}>AUCUN MEMBRE</Mono>
            )}
          </div>
        ) : (
          <div style={{ padding: '0 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {boites.map(b => <BoiteBloc key={b.nom} b={b} />)}
            {boites.length === 0 && <Mono style={{ marginTop: 18 }}>AUCUNE BOÎTE</Mono>}
          </div>
        )}
      </div>
    </Screen>
  );
}

/** Le bloc « une boîte » : carte noire de stats + qui y est passé */
function BoiteBloc({ b }: { b: Boite }) {
  return (
    <>
      <Card dark radius={16} pad={16}>
        <Mono color={C.creamMut}>{b.secteur}</Mono>
        <div style={{ font: `400 25px/1.1 ${F.serif}`, color: C.cream, marginTop: 7 }}>{b.nom}</div>
        <div style={{ display: 'flex', gap: 26, marginTop: 14 }}>
          <div>
            <div style={{ font: `400 25px/1 ${F.serif}`, color: C.cream }}>{b.passes}</div>
            <Mono color={C.creamMut} style={{ marginTop: 2 }}>MEMBRES PASSÉS</Mono>
          </div>
          <div>
            <div style={{ font: `400 25px/1 ${F.serif}`, color: C.cream }}>{b.parrains}</div>
            <Mono color={C.creamMut} style={{ marginTop: 2 }}>PARRAINS ACTIFS</Mono>
          </div>
        </div>
      </Card>

      <div>
        <Mono>CEUX QUI Y SONT PASSÉS</Mono>
        <div style={{ marginTop: 9, display: 'flex', flexDirection: 'column' }}>
          {b.gens.map((g, i) => (
            <PersonRow key={g.nom} p={g} size={40} last={i === b.gens.length - 1} />
          ))}
        </div>
      </div>
    </>
  );
}

(ScreenChercher as TabScreen).tab = { id: 'chercher', label: 'Chercher' };

export default ScreenChercher as TabScreen;
