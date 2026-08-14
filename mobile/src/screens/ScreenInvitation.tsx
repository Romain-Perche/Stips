/* ══════════════════════════════════════════════════════════════════════
   ÉCRAN D'ENTRÉE — pas un onglet · design 5a2
   L'invitation nominative envoyée par le parrain. C'est la première chose
   qu'un candidat voit, avant même d'avoir un compte.

   Le parrainage en 3 temps (5a) a été retiré : accepter l'invitation mène
   directement à l'app.
   ══════════════════════════════════════════════════════════════════════ */

import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, DATA } from '@stips/core';
import { F } from '../tokens';
import { Mono, Avatar, BoutonPlein, Card, Screen } from '../atoms';

export default function ScreenInvitation({ onAccepter }: { onAccepter: () => void }) {
  const inv = DATA.invitation;
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 26, paddingBottom: 140, gap: 18 }}>

          <View>
            <Mono>INVITATION NOMINATIVE · VALABLE 7 JOURS</Mono>
            <Text style={{
              fontFamily: F.serif, fontSize: 34, lineHeight: 37, color: C.ink, marginTop: 10,
            }}>{inv.parrain} te fait entrer dans Stips, {inv.prenom}.</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar size={52} />
            <View>
              <Text style={{ fontFamily: F.uiSemiBold, fontSize: 15, color: C.ink }}>{inv.parrain}</Text>
              <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted }}>{inv.role}</Text>
            </View>
          </View>

          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Mono>CE QU'IL/ELLE A DÉJÀ ÉCRIT SUR TOI</Mono>
              <Text style={{ fontFamily: F.serif, fontSize: 26, lineHeight: 26, color: C.ink }}>{inv.note}</Text>
            </View>
            <Text style={{
              marginTop: 10, fontFamily: F.serifItalic, fontSize: 17, lineHeight: 25, color: C.ink2,
            }}>{inv.reco}</Text>
            <Text style={{
              marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
              fontFamily: F.uiRegular, fontSize: 12, color: C.muted2,
            }}>{inv.signee}</Text>
          </Card>

          <View style={{ gap: 11 }}>
            <Mono>CE QUE ÇA T'OUVRE</Mono>
            {inv.avantages.map((a, i) => (
              <View key={a} style={{ flexDirection: 'row', gap: 11, alignItems: 'baseline' }}>
                <Text style={{ fontFamily: F.monoMedium, fontSize: 12, color: C.ink }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={{ fontFamily: F.uiRegular, fontSize: 14, lineHeight: 20, color: C.ink3, flex: 1 }}>{a}</Text>
              </View>
            ))}
          </View>

        </View>
      </ScrollView>

      {/* CTA collé en bas */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 22, paddingTop: 16, paddingBottom: 22 + insets.bottom, backgroundColor: C.bg,
        borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
      }}>
        <BoutonPlein onPress={onAccepter}>Accepter l'invitation</BoutonPlein>
        {/* ⚠ Cette ligne change quel que soit l'arbitrage IAP / paiement web
            (voir « À trancher » §6 dans la description du projet) : c'est la
            seule mention de paiement de toute l'app, donc la seule exposition
            à la règle 3.1.1 d'Apple. */}
        <Text style={{ textAlign: 'center', fontFamily: F.uiRegular, fontSize: 12, color: C.muted, marginTop: 10 }}>
          100 € / an, tout compris · <Text style={{ color: C.ink, textDecorationLine: 'underline' }}>C'est quoi Stips ?</Text>
        </Text>
      </View>
    </Screen>
  );
}
