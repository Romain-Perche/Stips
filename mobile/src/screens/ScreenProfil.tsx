/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Qui suis-je ? » — les deux rôles · design 5b

   En deux parties, et c'est la seule différence entre les deux rôles sur
   cet écran :
     · partie 1, pour tout le monde — photo et description ; c'est tout ce
       que l'annuaire montre d'une personne ;
     · partie 2, réservée au membre — stage recherché, disponibilités,
       expériences, CV et LinkedIn.

   La remplir est ce qui met un membre dans le deck des pros : un seul
   interrupteur, pas deux notions à synchroniser. Un pro n'a pas de partie
   2 du tout — il ne cherche pas de stage.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { C, DATA, type MoiProfile } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar, Stk, ScreenHead, Screen, RondPiece } from '../atoms';
import { useRole } from '../role';
import type { TabScreen } from '../types';

function ScreenProfil() {
  const role = useRole();
  const membre = role === 'membre';

  return (
    <Screen>
      <ScreenHead titre="Qui suis-je ?" right={<Stk>Aperçu</Stk>} />
      {/* `key={role}` : repart à zéro sur le profil de l'autre rôle (nom,
          bio, brouillon d'édition) plutôt que de continuer à éditer le
          même état — les deux rôles n'ont pas la même personne. */}
      <Form key={role} membre={membre} profil={membre ? DATA.moi : DATA.moiPro} />
    </Screen>
  );
}

function Form({ membre, profil }: { membre: boolean; profil: MoiProfile }) {
  const [p, setP] = useState(profil);
  const set = <K extends keyof typeof p>(k: K, v: (typeof p)[K]) =>
    setP(o => ({ ...o, [k]: v }));

  return (
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

        {/* ── Partie 2 : le membre seulement ────────────────────────── */}
        {membre && (
          <>
            <View style={{ paddingTop: 4 }}>
              <Mono>CE QUE LES PROS VERRONT SI TU CHERCHES</Mono>
            </View>

            <Champ label="STAGE RECHERCHÉ" valeur={p.stage ?? ''} />
            <Champ label="DISPONIBILITÉS" valeur={p.dispo ?? ''} />

            {/* Expériences */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Mono>EXPÉRIENCES PRINCIPALES</Mono>
                <Text style={{
                  fontFamily: F.uiMedium, fontSize: 11, color: C.ink, textDecorationLine: 'underline',
                }}>{(p.experiences ?? []).length} / 3</Text>
              </View>
              <View style={{ marginTop: 7, gap: 7 }}>
                {(p.experiences ?? []).map(e => (
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
          </>
        )}

        {/* Pièces (partie 2) + enregistrer */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 }}>
          {membre && <RondPiece tooltip="Remplacer mon CV">CV</RondPiece>}
          {membre && <RondPiece tooltip="Lier LinkedIn">IN</RondPiece>}
          <Pressable style={{
            marginLeft: 'auto', paddingVertical: 13, paddingHorizontal: 22, borderRadius: 99,
            backgroundColor: C.ink,
          }}>
            <Text style={{ fontFamily: F.uiSemiBold, fontSize: 14, color: C.cream }}>Enregistrer</Text>
          </Pressable>
        </View>

      </View>
    </ScrollView>
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
