/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Offres » — entreprise · design 6a
   Mes offres publiées.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, DATA } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenOffres() {
  const [filtre, setFiltre] = useState('En ligne');

  return (
    <Screen>
      <ScreenHead titre="Mes offres" sous={DATA.offres.resume} />
      <Pills items={['En ligne', 'Brouillons', 'Clôturées']} active={filtre} onChange={setFiltre} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 96, gap: 12 }}>
          {filtre === 'En ligne' ? DATA.offres.liste.map(o => (
            <Card key={o.titre}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Mono>{o.meta}</Mono>
                  <Text style={{ fontFamily: F.uiSemiBold, fontSize: 18, lineHeight: 22, color: C.ink, marginTop: 6 }}>{o.titre}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <Text style={{ fontFamily: F.serif, fontSize: 30, lineHeight: 30, color: C.ink }}>{o.recues}</Text>
                  <Mono>REÇUES</Mono>
                </View>
              </View>
              <View style={{
                marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted }}>{o.pied}</Text>
                <Stk size={13} padV={9} padH={16}>Voir</Stk>
              </View>
            </Card>
          )) : (
            <Mono>RIEN DANS « {filtre.toUpperCase()} »</Mono>
          )}

          {/* Publier une offre */}
          <Pressable>
            <Card dark style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <View>
                <Text style={{ fontFamily: F.uiSemiBold, fontSize: 17, color: C.cream }}>Publier une offre</Text>
                <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.creamMut, marginTop: 4 }}>
                  Visible par les {DATA.membresTotal} profils parrainés
                </Text>
              </View>
              <View style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: C.cream,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text style={{ fontFamily: F.uiRegular, fontWeight: '300', fontSize: 24, color: C.ink, marginTop: -2 }}>+</Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

(ScreenOffres as unknown as TabScreen).tab = { id: 'offres', label: 'Offres' };

export default ScreenOffres as unknown as TabScreen;
