/* ══════════════════════════════════════════════════════════════════════
   ÉCRAN BLOQUANT — pas un onglet, et pas un écran dont on sort.

   Aucune issue : pas de bouton « plus tard », pas de retour, pas de croix.
   C'est tout le point — un écran qu'on peut ignorer ne permet pas de casser
   un contrat d'API. Il est rendu à la place de TOUT le reste, invitation
   comprise (voir App.tsx).

   Ne fetch rien : c'est src/config/miseAJour.ts qui décide, et un futur
   426 Upgrade Required renvoyé par n'importe quelle route pourra piloter le
   même écran avec les mêmes props.

   La copie ne mentionne ni prix ni paiement (règle 3.1.1 d'Apple — voir
   « À trancher » §6 dans la description du projet), et ne promet aucun
   numéro de version : le binaire ne connaît pas celle qui le remplacera.
   Seul le backend peut en citer un, via `message`.
   ══════════════════════════════════════════════════════════════════════ */

import { Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '@leclub/core';
import { F } from '../tokens';
import { BoutonPlein, Mono, Screen } from '../atoms';

export default function ScreenMiseAJour({ url, message }: { url?: string; message?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 26, gap: 14 }}>
        <Mono>MISE À JOUR REQUISE</Mono>
        <Text style={{ fontFamily: F.serif, fontSize: 34, lineHeight: 37, color: C.ink }}>
          Cette version du Club n'est plus à jour.
        </Text>
        <Text style={{ fontFamily: F.uiRegular, fontSize: 14, lineHeight: 21, color: C.muted }}>
          {message ?? 'Installe la dernière version depuis le store pour continuer.'}
        </Text>
      </View>

      {/* Pas de bouton sans lien : l'identifiant App Store n'existe pas avant
          la première soumission, et un bouton qui ne mène nulle part est pire
          que pas de bouton. Le texte ci-dessus suffit à dire quoi faire. */}
      {url && (
        <View style={{
          paddingHorizontal: 22, paddingTop: 16, paddingBottom: 22 + insets.bottom,
          borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
        }}>
          <BoutonPlein onPress={() => void Linking.openURL(url)}>Mettre à jour</BoutonPlein>
        </View>
      )}
    </Screen>
  );
}
