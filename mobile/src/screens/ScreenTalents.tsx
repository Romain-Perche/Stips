/* ══════════════════════════════════════════════════════════════════════
   LE DECK DE TALENTS — design 2a · plus un onglet

   Les membres qui se sont déclarés en recherche, une carte flip par
   personne. C'était l'onglet « Talents » du pro ; la révision des rôles
   en fait la section « Talents » de l'onglet Offres — seul endroit de
   l'app où la note et le commentaire d'un parrain se lisent. Le fichier
   n'exporte donc plus que `TalentDeck`, monté par `ScreenOffres.tsx`
   (même découpage que côté web, sinon les deux divergent).

   La carte flip du web repose sur `transform-style: preserve-3d` : un seul
   conteneur tourne, et la face B contre-tournée de 180° devient le *dos* de
   la même carte. React Native n'a PAS d'équivalent de preserve-3d — les
   enfants ne partagent pas l'espace 3D du parent, chaque transform est
   aplati dans son propre plan. Contre-tourner la face B n'y produit donc
   pas un dos mais une face indépendante posée par-dessus, et
   `backfaceVisibility` ne peut plus arbitrer laquelle est visible.

   On fait donc tourner CHAQUE face séparément — A de 0→180°, B de 180→360°
   — sur une seule progression partagée. À mi-course les deux sont de profil
   (donc invisibles), ce qui rend la bascule de visibilité imperceptible.
   ══════════════════════════════════════════════════════════════════════ */

import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useState } from 'react';
import { C, DATA } from '@stips/core';
import type { Talent } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar, RondPiece } from '../atoms';

/** Une carte par talent, à la suite, qu'on parcourt en scrollant — pas de
    filtres ni de pagination par bouton. */
export function TalentDeck() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={{ padding: 22, paddingBottom: 96, gap: 12 }}>
        {DATA.talents.map(t => <TalentCard key={t.id} t={t} />)}
      </View>
    </ScrollView>
  );
}

/** Une carte du deck, avec sa propre animation de flip indépendante des
    autres cartes. */
function TalentCard({ t }: { t: Talent }) {
  // `flipped` double la progression animée : il pilote `pointerEvents`, qui
  // n'est pas animable. Sans ça la face cachée, dernière dans l'arbre,
  // continuerait d'intercepter les taps destinés à la face visible.
  const [flipped, setFlipped] = useState(false);
  const progress = useSharedValue(0);

  const animer = (v: 0 | 1) => {
    progress.value = withTiming(v, { duration: 620, easing: Easing.bezier(0.22, 1.1, 0.36, 1) });
  };
  const toggleFlip = () => { const next = !flipped; setFlipped(next); animer(next ? 1 : 0); };
  const retourner = () => { setFlipped(false); animer(0); };

  // Chaque face porte sa propre rotation, décalée d'un demi-tour. L'opacité
  // bascule net à mi-course : à 90°/270° les deux faces sont de profil, donc
  // de largeur nulle — le saut est invisible. `backfaceVisibility` (dans
  // FACE) fait le même travail là où la plateforme le respecte ; l'opacité
  // garantit le résultat là où elle ne le fait pas.
  const faceAStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${interpolate(progress.value, [0, 1], [0, 180])}deg` }],
    opacity: progress.value < 0.5 ? 1 : 0,
  }));
  const faceBStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1400 }, { rotateY: `${interpolate(progress.value, [0, 1], [180, 360])}deg` }],
    opacity: progress.value < 0.5 ? 0 : 1,
  }));

  return (
    <Pressable onPress={toggleFlip} style={{ height: 350 }}>
      <Animated.View style={[FACE, faceAStyle]} pointerEvents={flipped ? 'none' : 'auto'}>
        <TalentFaceA t={t} />
      </Animated.View>
      <Animated.View style={[FACE, faceBStyle]} pointerEvents={flipped ? 'auto' : 'none'}>
        <TalentFaceB t={t} onRetourner={retourner} />
      </Animated.View>
    </Pressable>
  );
}

/** Le gabarit commun aux deux faces. Porté par les Animated.View parentes,
    pas par les composants de face : c'est ce qui tourne. */
const FACE = {
  position: 'absolute' as const, top: 0, left: 0, right: 0, height: 350,
  backfaceVisibility: 'hidden' as const,
  backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 16,
  padding: 24,
};

/** Face A : le qualificatif, le parrain, le commentaire */
function TalentFaceA({ t }: { t: Talent }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Avatar size={64} />
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontFamily: F.serif, fontSize: 30, lineHeight: 34, color: C.ink }}>{t.qualificatif}</Text>
          <Mono>LE MOT DE SON PARRAIN</Mono>
        </View>
      </View>
      <Text style={{ fontFamily: F.uiSemiBold, fontSize: 26, lineHeight: 30, color: C.ink, marginTop: 18 }}>{t.nom}</Text>
      <Text style={{ fontFamily: F.uiRegular, fontSize: 14, color: C.muted, marginTop: 3 }}>{t.ecole}</Text>

      <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.09)' }}>
        <Mono>PARRAINÉ(E) PAR</Mono>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Avatar size={32} />
          <View>
            <Text style={{ fontFamily: F.uiSemiBold, fontSize: 14, color: C.ink }}>{t.parrain}</Text>
            <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted2 }}>{t.parrainRole}</Text>
          </View>
        </View>
      </View>

      <Text style={{
        marginTop: 16, fontFamily: F.serifItalic, fontSize: 16, lineHeight: 23, color: C.ink3,
      }}>{t.reco}</Text>

      <View style={{ marginTop: 'auto' }}>
        <Text style={{ fontFamily: F.monoMedium, fontSize: 11, color: C.faint }}>TAPE POUR RETOURNER ↻</Text>
      </View>
    </View>
  );
}

/** Face B : stage recherché, disponibilités, expériences + accès aux pièces */
function TalentFaceB({ t, onRetourner }: { t: Talent; onRetourner: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Mono>CE QU'IL/ELLE CHERCHE</Mono>
      <Text style={{ marginTop: 10, fontFamily: F.serif, fontSize: 28, lineHeight: 32, color: C.ink }}>{t.cherche}</Text>

      <View style={{ marginTop: 22, gap: 16 }}>
        <View>
          <Mono>DISPONIBILITÉS</Mono>
          <Text style={{ fontFamily: F.uiMedium, fontSize: 17, color: C.ink, marginTop: 4 }}>{t.dispo}</Text>
        </View>
        <View>
          <Mono>EXPÉRIENCES PRINCIPALES</Mono>
          <View style={{ gap: 6, marginTop: 7 }}>
            {t.experiences.map(e => (
              <Text key={e.titre} style={{ fontFamily: F.uiMedium, fontSize: 15, lineHeight: 19, color: C.ink }}>
                {e.titre} <Text style={{ color: C.muted2, fontFamily: F.uiRegular }}>· {e.duree}</Text>
              </Text>
            ))}
          </View>
        </View>
      </View>

      <View style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RondPiece tooltip="Voir le CV">CV</RondPiece>
        <RondPiece tooltip="LinkedIn">IN</RondPiece>
        <RondPiece tooltip="Lettre de reco du parrain" fontFamily={F.serif} fontSize={17}>℞</RondPiece>
        <View style={{ marginLeft: 'auto' }}>
          <RondPiece fontFamily={F.uiRegular} fontSize={15} onPress={onRetourner}>↻</RondPiece>
        </View>
      </View>
    </View>
  );
}
