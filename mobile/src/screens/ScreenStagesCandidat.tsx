/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — membre · pas dans le design doc, premier jet

   Le pendant membre de « Offres » : les stages publiés par les pros, et
   la candidature. Même grammaire que l'onglet Offres — micro-label mono,
   titre, filet, action en pilule — pour que les deux faces du même objet
   se ressemblent. Porté du web (`frontend/src/screens/ScreenStagesCandidat.tsx`).

   Contrairement au pro, le membre voit **l'employeur** (dans le label) et
   **la date limite** (dans le pied) : c'est lui qui parcourt des offres
   qui ne sont pas les siennes.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { C, DATA, dateCourte } from '@stips/core';
import type { Offre } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen, CarteAction } from '../atoms';

function ScreenStagesCandidat() {
  const [filtre, setFiltre] = useState('Tout');
  const [envoyees, setEnvoyees] = useState<string[]>([]);

  const liste = useMemo(() => (
    filtre === 'Mes candidatures'
      ? DATA.offres.filter(o => envoyees.includes(o.titre))
      : DATA.offres
  ), [filtre, envoyees]);

  return (
    <Screen>
      <ScreenHead titre="Stages"
        sous={`${DATA.offres.length} offres ouvertes, publiées par les pros de Stips`} />
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
          <CarteAction titre="Être vu par les pros"
            sous="Remplis « Qui suis-je ? » pour entrer dans leurs recherches"
            icone="→" tailleIcone={20} />
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
      <Mono>{`${o.entreprise} · ${o.lieu} · ${o.dureeMois} mois`.toUpperCase()}</Mono>
      <Text style={{
        fontFamily: F.uiSemiBold, fontSize: 18, lineHeight: 22, color: C.ink, marginTop: 6,
      }}>{o.titre}</Text>

      <View style={{
        marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.divider,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {envoyee
          ? <Mono color={C.ink}>CANDIDATURE ENVOYÉE ✓</Mono>
          : <Text style={{ fontFamily: F.uiRegular, fontSize: 12, color: C.muted }}>
              {o.clotureeLe ? `Clôture le ${dateCourte(o.clotureeLe)}` : ''}
            </Text>}
        <Stk size={13} padV={9} padH={16}
          onPress={envoyee ? undefined : onPostuler}
          style={envoyee ? { opacity: 0.4 } : undefined}>
          {envoyee ? 'Envoyée' : 'Postuler'}
        </Stk>
      </View>
    </Card>
  );
}

ScreenStagesCandidat.tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat;
