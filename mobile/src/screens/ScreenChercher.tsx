/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Chercher » — les deux rôles · design 8a / 8b
   Partie 1 des profils SEULEMENT — ni note, ni commentaire de parrain, ni
   CV : tout ça vit dans le deck de l'onglet Offres du pro.
   L'annuaire de Stips, avec la bascule Personnes / Boîtes.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { C, DATA } from '@stips/core';
import type { Boite } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, PersonRow, SearchField, Segmented, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenChercher() {
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
    <Screen>
      <View style={{ flexShrink: 0, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 32, lineHeight: 34, color: C.ink }}>
          {personnes ? "Trouver quelqu'un" : 'Trouver une boîte'}
        </Text>
        {!personnes && (
          <Text style={{ fontFamily: F.uiRegular, fontSize: 13, color: C.muted, marginTop: 4 }}>
            Vois qui de Stips y est passé avant de postuler
          </Text>
        )}
        <SearchField value={q} onChange={setQ}
          placeholder={personnes ? 'Une boîte, un métier, une école…' : 'Le nom d’une boîte…'} />
        <Segmented items={['Personnes', 'Boîtes']} active={onglet}
          onChange={t => { setOnglet(t as 'Personnes' | 'Boîtes'); setQ(''); }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {personnes ? (
          <View style={{ paddingHorizontal: 22, paddingBottom: 96 }}>
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
          </View>
        ) : (
          <View style={{ paddingHorizontal: 22, paddingBottom: 96, gap: 12 }}>
            {boites.map(b => <BoiteBloc key={b.nom} b={b} />)}
            {boites.length === 0 && <Mono style={{ marginTop: 18 }}>AUCUNE BOÎTE</Mono>}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

/** Le bloc « une boîte » : carte noire de stats + qui y est passé */
function BoiteBloc({ b }: { b: Boite }) {
  return (
    <View style={{ gap: 12 }}>
      <Card dark radius={16} pad={16}>
        <Mono color={C.creamMut}>{b.secteur}</Mono>
        <Text style={{ fontFamily: F.serif, fontSize: 25, lineHeight: 27, color: C.cream, marginTop: 7 }}>{b.nom}</Text>
        <View style={{ flexDirection: 'row', gap: 26, marginTop: 14 }}>
          <View>
            <Text style={{ fontFamily: F.serif, fontSize: 25, lineHeight: 25, color: C.cream }}>{b.passes}</Text>
            <Mono color={C.creamMut} style={{ marginTop: 2 }}>MEMBRES PASSÉS</Mono>
          </View>
          <View>
            <Text style={{ fontFamily: F.serif, fontSize: 25, lineHeight: 25, color: C.cream }}>{b.parrains}</Text>
            <Mono color={C.creamMut} style={{ marginTop: 2 }}>PARRAINS ACTIFS</Mono>
          </View>
        </View>
      </Card>

      <View>
        <Mono>CEUX QUI Y SONT PASSÉS</Mono>
        <View style={{ marginTop: 9 }}>
          {b.gens.map((g, i) => (
            <PersonRow key={g.nom} p={g} size={40} last={i === b.gens.length - 1} />
          ))}
        </View>
      </View>
    </View>
  );
}

(ScreenChercher as unknown as TabScreen).tab = { id: 'chercher', label: 'Chercher' };

export default ScreenChercher as unknown as TabScreen;
