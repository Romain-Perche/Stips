/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Offres » — pro · design 6a, étendu

   Deux sections derrière une bascule :
     · Offres   — les miennes ; « Voir » ouvre les candidatures reçues
     · Talents  — le deck de cartes flip des membres en recherche

   Les candidatures ne sont pas une section : elles appartiennent à une
   offre, donc elles vivent derrière le « Voir » de cette offre. C'est un
   niveau de profondeur, pas un troisième onglet.

   Le deck vient de `ScreenTalents.tsx` (`TalentDeck`), importé et non
   recopié — même découpage que côté web.

   Les compteurs de candidatures sont **calculés** depuis
   `DATA.candidatures`, jamais lus dans `Offre.recues` — sinon la carte
   annonce 12 et le détail en montre 2. Voir `backend/README.md` § les
   valeurs qu'on ne stocke pas.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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

function ScreenOffres() {
  const [section, setSection] = useState<Section>('Offres');
  const [ouverte, setOuverte] = useState<string | null>(null);

  const offre = DATA.offres.liste.find(o => o.titre === ouverte);

  // ── Le détail d'une offre : ses candidatures ────────────────────────
  if (offre) {
    const recues = recuesPour(offre.titre);
    return (
      <Screen>
        <View style={{ flexShrink: 0, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 }}>
          <Pressable onPress={() => setOuverte(null)}>
            <Text style={{ fontFamily: F.uiMedium, fontSize: 12, color: C.muted }}>‹ Mes offres</Text>
          </Pressable>
          <Text style={{
            fontFamily: F.serif, fontSize: 26, lineHeight: 30, color: C.ink, marginTop: 10,
          }}>{offre.titre}</Text>
          <Mono style={{ marginTop: 7 }}>{offre.meta}</Mono>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 96, gap: 12 }}>
            <Mono>{recues.length} CANDIDATURE{recues.length > 1 ? 'S' : ''}</Mono>
            {recues.map(c => <CandidatureCard key={c.talent} c={c} />)}
            {recues.length === 0 && <Mono color={C.muted}>PERSONNE N'A ENCORE POSTULÉ</Mono>}
          </View>
        </ScrollView>
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
    <Screen>
      <View style={{ flexShrink: 0, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 14 }}>
        <Text style={{ fontFamily: F.serif, fontSize: 32, lineHeight: 34, color: C.ink }}>{titre}</Text>
        <Text style={{ fontFamily: F.uiRegular, fontSize: 13, color: C.muted, marginTop: 4 }}>{sous}</Text>
        <Segmented items={[...SECTIONS]} active={section}
          onChange={s => setSection(s as Section)} />
      </View>

      {section === 'Talents' ? <TalentDeck /> : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 96, gap: 12 }}>
            {DATA.offres.liste.map(o => (
              <OffreCard key={o.titre} o={o} onVoir={() => setOuverte(o.titre)} />
            ))}

            {/* Publier une offre */}
            <Pressable>
              <Card dark style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Mono>{o.meta}</Mono>
          <Text style={{
            fontFamily: F.uiSemiBold, fontSize: 18, lineHeight: 22, color: C.ink, marginTop: 6,
          }}>{o.titre}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
          <Text style={{ fontFamily: F.serif, fontSize: 30, lineHeight: 30, color: C.ink }}>{recues.length}</Text>
          <Mono>REÇUES</Mono>
        </View>
      </View>

      <View style={{
        marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted }}>
          {nonLues > 0 ? `${nonLues} non lue${nonLues > 1 ? 's' : ''}` : 'Tout est lu'}
        </Text>
        <Stk size={13} padV={9} padH={16} onPress={onVoir}>Voir</Stk>
      </View>
    </Card>
  );
}

/** Une candidature, dans le détail d'une offre : le membre, le mot de son
    parrain, et depuis quand elle attend. */
function CandidatureCard({ c }: { c: Candidature }) {
  const t = DATA.talents.find(x => x.id === c.talent);
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
        <Avatar size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Text style={{ fontFamily: F.uiSemiBold, fontSize: 15, color: C.ink }}>{t?.nom ?? c.talent}</Text>
            {!c.lue && (
              <Text style={{
                paddingVertical: 2, paddingHorizontal: 7, borderRadius: 5,
                backgroundColor: C.ink, color: C.cream, fontFamily: F.monoMedium, fontSize: 9,
                overflow: 'hidden',
              }}>NOUVEAU</Text>
            )}
          </View>
          <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted, marginTop: 2 }}>{t?.ecole}</Text>
        </View>
        {t && (
          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={{ fontFamily: F.serif, fontSize: 16, lineHeight: 20, color: C.ink }}>{t.qualificatif}</Text>
            <Mono>QUALITÉ</Mono>
          </View>
        )}
      </View>

      <View style={{
        marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted }}>{ilYA(c.heures)}</Text>
        <Stk size={13} padV={9} padH={16}>Voir le profil</Stk>
      </View>
    </Card>
  );
}

(ScreenOffres as unknown as TabScreen).tab = { id: 'offres', label: 'Offres' };

export default ScreenOffres as unknown as TabScreen;
