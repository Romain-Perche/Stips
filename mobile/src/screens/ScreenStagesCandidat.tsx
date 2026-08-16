/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — membre · pas dans le design doc, premier jet

   Le pendant membre de « Offres » : les stages publiés par les pros, et
   la candidature. Même grammaire que l'onglet Offres — micro-label mono,
   titre, filet, action en pilule — pour que les deux faces du même objet
   se ressemblent. Porté du web (`frontend/src/screens/ScreenStagesCandidat.tsx`).

   ⚠️ Deux champs manquent à `Offre` pour cet écran, et ça se voit :
   **l'employeur** et **la date limite**. `meta` ne porte que
   « M&A · PARIS · 6 MOIS », et `pied` (« Publiée le 2 sept. · 4 non
   lues ») mélange une date avec un compteur réservé au pro. Tant que
   c'est le pro qui regarde ses propres offres, l'employeur est implicite ;
   dès qu'un membre les parcourt, il manque. À reprendre côté schéma —
   `offre.entreprise_id` et une date de clôture (`backend/README.md`).
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, DATA } from '@stips/core';
import type { Offre } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenStagesCandidat() {
  const [filtre, setFiltre] = useState('Tout');
  const [envoyees, setEnvoyees] = useState<string[]>([]);

  const liste = useMemo(() => (
    filtre === 'Mes candidatures'
      ? DATA.offres.liste.filter(o => envoyees.includes(o.titre))
      : DATA.offres.liste
  ), [filtre, envoyees]);

  return (
    <Screen>
      <ScreenHead titre="Stages"
        sous={`${DATA.offres.liste.length} offres ouvertes, publiées par les pros de Stips`} />
      <Pills items={['Tout', 'Mes candidatures']} active={filtre} onChange={setFiltre} />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 96, gap: 12 }}>
          {liste.map(o => (
            <OffreCard key={o.titre} o={o}
              envoyee={envoyees.includes(o.titre)}
              onPostuler={() => setEnvoyees(e => [...e, o.titre])} />
          ))}

          {liste.length === 0 && (
            <Mono>{filtre === 'Mes candidatures'
              ? "TU N'AS ENCORE POSTULÉ À RIEN"
              : 'AUCUNE OFFRE EN LIGNE'}</Mono>
          )}

          {/* Le pendant du « Publier une offre » du pro : ce qui rend un
              membre visible, c'est la partie 2 de « Qui suis-je ? ». */}
          <Pressable>
            <Card dark style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.uiSemiBold, fontSize: 17, color: C.cream }}>Être vu par les pros</Text>
                <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.creamMut, marginTop: 4 }}>
                  Remplis « Qui suis-je ? » pour entrer dans leurs recherches
                </Text>
              </View>
              <View style={{
                width: 44, height: 44, borderRadius: 22, backgroundColor: C.cream,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text style={{ fontFamily: F.uiRegular, fontSize: 20, color: C.ink }}>→</Text>
              </View>
            </Card>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

/** Une offre vue par un membre. Volontairement sans le compteur de
    candidatures reçues : c'est une donnée du pro, et l'afficher ne
    ferait que dissuader de postuler. */
function OffreCard({ o, envoyee, onPostuler }: {
  o: Offre; envoyee: boolean; onPostuler: () => void;
}) {
  return (
    <Card>
      <Mono>{o.meta}</Mono>
      <Text style={{
        fontFamily: F.uiSemiBold, fontSize: 18, lineHeight: 22, color: C.ink, marginTop: 6,
      }}>{o.titre}</Text>

      <View style={{
        marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,.08)',
        flexDirection: 'row', alignItems: 'center',
        justifyContent: envoyee ? 'space-between' : 'flex-end',
      }}>
        {envoyee && <Mono color={C.ink}>CANDIDATURE ENVOYÉE ✓</Mono>}
        <Stk size={13} padV={9} padH={16}
          onPress={envoyee ? undefined : onPostuler}
          style={envoyee ? { opacity: 0.4 } : undefined}>
          {envoyee ? 'Envoyée' : 'Postuler'}
        </Stk>
      </View>
    </Card>
  );
}

(ScreenStagesCandidat as unknown as TabScreen).tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat as unknown as TabScreen;
