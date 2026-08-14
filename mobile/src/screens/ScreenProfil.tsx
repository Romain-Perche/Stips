/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Qui suis-je ? » — candidat · design 5b
   Modifier mon profil : ce que les entreprises verront.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { C, DATA } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar, Stk, ScreenHead, Screen, RondPiece } from '../atoms';
import type { TabScreen } from '../types';

function ScreenProfil() {
  const [p, setP] = useState(DATA.moi);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) =>
    setP(o => ({ ...o, [k]: v }));

  return (
    <Screen>
      <ScreenHead titre="Qui suis-je ?" right={<Stk>Aperçu</Stk>} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 96, gap: 14 }}>

          {/* Photo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar size={66} />
            <View>
              <Text style={{ fontFamily: F.uiSemiBold, fontSize: 19, color: C.ink }}>{p.nom}</Text>
              <Text style={{
                fontFamily: F.monoMedium, fontSize: 11, color: C.muted2, marginTop: 4,
                textDecorationLine: 'underline',
              }}>CHANGER LA PHOTO</Text>
            </View>
          </View>

          {/* Bio */}
          <View>
            <Mono>EN DEUX LIGNES</Mono>
            <View style={{
              marginTop: 7, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(0,0,0,.12)',
              borderRadius: 11, padding: 13,
            }}>
              <TextInput
                multiline numberOfLines={3} value={p.bio} onChangeText={v => set('bio', v)}
                style={{ fontFamily: F.uiRegular, fontSize: 14, lineHeight: 20, color: C.ink, padding: 0 }}
              />
            </View>
          </View>

          <Champ label="STAGE RECHERCHÉ" valeur={p.stage} />
          <Champ label="DISPONIBILITÉS" valeur={p.dispo} />

          {/* Expériences */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Mono>EXPÉRIENCES PRINCIPALES</Mono>
              <Text style={{
                fontFamily: F.uiMedium, fontSize: 11, color: C.ink, textDecorationLine: 'underline',
              }}>{p.experiences.length} / 3</Text>
            </View>
            <View style={{ marginTop: 7, gap: 7 }}>
              {p.experiences.map(e => (
                <View key={e.titre} style={{
                  backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(0,0,0,.12)', borderRadius: 11,
                  paddingVertical: 12, paddingHorizontal: 13, flexDirection: 'row',
                  justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <Text style={{ fontFamily: F.uiMedium, fontSize: 14, color: C.ink }}>
                    {e.titre} <Text style={{ color: C.muted2, fontFamily: F.uiRegular }}>· {e.duree}</Text>
                  </Text>
                  <Text style={{ color: C.faint }}>⋮</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pièces + enregistrer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 }}>
            <RondPiece tooltip="Remplacer mon CV">CV</RondPiece>
            <RondPiece tooltip="Lier LinkedIn">IN</RondPiece>
            <Pressable style={{
              marginLeft: 'auto', paddingVertical: 13, paddingHorizontal: 22, borderRadius: 99,
              backgroundColor: C.ink,
            }}>
              <Text style={{ fontFamily: F.uiSemiBold, fontSize: 14, color: C.cream }}>Enregistrer</Text>
            </Pressable>
          </View>

        </View>
      </ScrollView>
    </Screen>
  );
}

function Champ({ label, valeur }: { label: string; valeur: string }) {
  return (
    <View>
      <Mono>{label}</Mono>
      <Pressable style={{
        marginTop: 7, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(0,0,0,.12)',
        borderRadius: 11, padding: 13, flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Text style={{ fontFamily: F.uiMedium, fontSize: 14, color: C.ink }}>{valeur}</Text>
        <Text style={{ color: C.faint }}>›</Text>
      </Pressable>
    </View>
  );
}

(ScreenProfil as unknown as TabScreen).tab = { id: 'profil', label: 'Qui suis-je ?' };

export default ScreenProfil as unknown as TabScreen;
