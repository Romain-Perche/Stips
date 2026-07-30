/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Agenda » — candidat · design 3a
   « A vos agendas » : les prochains rendez-vous du Club.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, DATA } from '@leclub/core';
import type { EventItem } from '@leclub/core';
import { F } from '../tokens';
import { Mono, Card, Stk, Pills, ScreenHead, Screen, Hatch } from '../atoms';
import type { TabScreen } from '../types';

function ScreenEvents() {
  const [filtre, setFiltre] = useState('Tout');
  const liste = filtre === 'Tout' ? DATA.events : DATA.events.filter(e => e.cats.includes(filtre));

  return (
    <Screen>
      <ScreenHead titre="A vos agendas" />
      <Pills items={['Tout', 'Sport', 'Bar', 'Atelier']} active={filtre} onChange={setFiltre} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 96, gap: 10 }}>
          {liste.map(e => <EventCard key={e.titre} e={e} />)}
          {liste.length === 0 && <Mono>AUCUN ÉVÉNEMENT</Mono>}
        </View>
      </ScrollView>
    </Screen>
  );
}

function EventCard({ e }: { e: EventItem }) {
  const d = e.dark;
  return (
    <Card dark={d} pad={16}>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View style={{ alignItems: 'center', flexShrink: 0 }}>
          <Text style={{ fontFamily: F.serif, fontSize: 34, lineHeight: 34, color: d ? C.cream : C.ink }}>{e.jour}</Text>
          <Mono color={d ? C.creamFai : C.muted2} style={{ marginTop: 2 }}>{e.mois}</Mono>
        </View>
        <View style={{ flex: 1 }}>
          <Mono color={d ? C.creamMut : C.muted2}>{e.meta}</Mono>
          <Text style={{ fontFamily: F.uiSemiBold, fontSize: 19, lineHeight: 23, color: d ? C.cream : C.ink, marginTop: 5 }}>{e.titre}</Text>
          <Text style={{ fontFamily: F.uiRegular, fontSize: 13, color: d ? C.creamMut : C.muted, marginTop: 3 }}>{e.sous}</Text>
        </View>
      </View>

      <View style={{
        marginTop: d ? 12 : 14, paddingTop: d ? 12 : 14,
        borderTopWidth: 1, borderTopColor: d ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.08)',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {e.avatars && (
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#fff' }}>
                <Hatch stripe={4} />
              </View>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.muted2, borderWidth: 1.5, borderColor: '#fff', marginLeft: -8 }} />
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.ink, borderWidth: 1.5, borderColor: '#fff', marginLeft: -8 }} />
            </View>
          )}
          <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: d ? C.creamMut : C.muted }}>{e.pied}</Text>
        </View>

        {d ? (
          <Pressable style={{
            paddingVertical: 9, paddingHorizontal: 16, borderRadius: 99, backgroundColor: C.cream, flexShrink: 0,
          }}>
            <Text style={{ fontFamily: F.uiSemiBold, fontSize: 13, color: C.ink }}>{e.cta}</Text>
          </Pressable>
        ) : (
          <Stk size={13} padV={9} padH={16}>{e.cta}</Stk>
        )}
      </View>
    </Card>
  );
}

(ScreenEvents as unknown as TabScreen).tab = { id: 'events', label: 'Agenda' };

export default ScreenEvents as unknown as TabScreen;
