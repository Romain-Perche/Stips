/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Forum » — candidat · design 4b
   Fils de discussion votés, façon Reddit.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, F } from '../tokens';
import { Mono, Card, ScreenHead, Pills, Screen, Hatch } from '../atoms';
import { DATA } from '../data';
import type { Fil, TabScreen } from '../types';

function ScreenForum() {
  const [filtre, setFiltre] = useState('Populaire');
  const [votes, setVotes] = useState<Record<string, number>>(() =>
    Object.fromEntries(DATA.fils.map(f => [f.id, f.votes])));

  const liste = useMemo(() => {
    const l = [...DATA.fils];
    if (filtre === 'Récent')  return l.sort((a, b) => a.heures - b.heures);
    if (filtre === 'Mes fils') return [];
    return l.sort((a, b) => votes[b.id] - votes[a.id]);
  }, [filtre, votes]);

  const voter = (id: string, n: number) => setVotes(v => ({ ...v, [id]: v[id] + n }));

  return (
    <Screen>
      <ScreenHead titre="Le forum" />
      <Pills items={['Populaire', 'Récent', 'Mes fils', '⚙']} active={filtre}
        onChange={p => p !== '⚙' && setFiltre(p)} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 14, paddingBottom: 96, gap: 12 }}>
          {liste.map(f => (
            <FilCard key={f.id} f={f} votes={votes[f.id]} onVote={n => voter(f.id, n)} />
          ))}
          {liste.length === 0 && <Mono>TU N'AS PAS ENCORE OUVERT DE FIL</Mono>}
        </View>
      </ScrollView>

      {/* Nouveau fil */}
      <Pressable style={{
        position: 'absolute', bottom: 88, right: 22, width: 52, height: 52,
        borderRadius: 26, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: F.uiRegular, fontWeight: '300', fontSize: 26, color: C.cream, marginTop: -2 }}>+</Text>
      </Pressable>
    </Screen>
  );
}

function FilCard({ f, votes, onVote }: { f: Fil; votes: number; onVote: (n: number) => void }) {
  const d = f.dark;
  return (
    <Card dark={d} radius={14} pad={14} style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ alignItems: 'center', gap: 3, paddingTop: 2 }}>
        <Pressable onPress={() => onVote(1)}>
          <Text style={{ fontFamily: F.uiRegular, fontSize: 15, color: d ? C.cream : C.ink }}>▲</Text>
        </Pressable>
        <Text style={{ fontFamily: F.monoMedium, fontSize: 14, color: d ? C.cream : C.ink }}>{votes}</Text>
        <Pressable onPress={() => onVote(-1)}>
          <Text style={{ fontFamily: F.uiRegular, fontSize: 15, color: d ? C.creamFai : C.faint }}>▼</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontFamily: F.monoMedium, fontSize: 11, color: d ? C.creamFai : C.muted2 }}>{f.meta}</Text>
        <Text style={{
          fontFamily: F.uiSemiBold, fontSize: 16, lineHeight: 21, color: d ? C.cream : C.ink, marginTop: 6,
        }}>{f.titre}</Text>

        {f.extrait && (
          <Text numberOfLines={1} ellipsizeMode="tail" style={{
            fontFamily: F.uiRegular, fontSize: 13, lineHeight: 18, color: C.muted, marginTop: 6,
          }}>{f.extrait}</Text>
        )}

        {f.piece && (
          <View style={{ marginTop: 10, height: 96, borderRadius: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <Hatch style={{ position: 'absolute', inset: 0 }} stripe={6} colors={{ a: '#efebdf', b: '#f6f3ea' }} />
            <Text style={{ fontFamily: F.monoMedium, fontSize: 11, color: C.muted2 }}>{f.piece}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
          <Text style={{ fontFamily: F.uiMedium, fontSize: 12, color: d ? C.creamMut : C.muted }}>
            💬 {f.reponses} réponses
          </Text>
        </View>
      </View>
    </Card>
  );
}

(ScreenForum as unknown as TabScreen).tab = { id: 'forum', label: 'Forum' };

export default ScreenForum as unknown as TabScreen;
