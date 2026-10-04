/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — membre · pas dans le design doc, premier jet

   Le pendant membre de « Offres » : les stages publiés par les pros, et
   la candidature. Même grammaire que l'onglet Offres — micro-label mono,
   titre, filet, action en pilule — pour que les deux faces du même objet
   se ressemblent.

   Contrairement au pro, le membre voit **l'employeur** (dans le label) et
   **la date limite** (dans le pied) : c'est lui qui parcourt des offres
   qui ne sont pas les siennes.
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState, type ReactNode } from 'react';
import { C, DATA, dateCourte } from '@stips/core';
import type { Offre } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen, CarteAction } from '../atoms';

function ScreenStagesCandidat({ nav }: { nav: ReactNode }) {
  const [filtre, setFiltre] = useState('Tout');
  const [envoyees, setEnvoyees] = useState<string[]>([]);

  const liste = useMemo(() => (
    filtre === 'Mes candidatures'
      ? DATA.offres.filter(o => envoyees.includes(o.titre))
      : DATA.offres
  ), [filtre, envoyees]);

  return (
    <Screen nav={nav}>
      <ScreenHead titre="Stages"
        sous={`${DATA.offres.length} offres ouvertes, publiées par les pros de Stips`} />
      <Pills items={['Tout', 'Mes candidatures']} active={filtre} onChange={setFiltre} />

      <div>
        <div style={{ padding: '16px 22px 96px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        </div>
      </div>
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
      <div style={{ font: `600 18px/1.25 ${F.ui}`, color: C.ink, marginTop: 6 }}>{o.titre}</div>

      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {envoyee
          ? <Mono color={C.ink}>CANDIDATURE ENVOYÉE ✓</Mono>
          : <div style={{ font: `400 12px ${F.ui}`, color: C.muted }}>
              {o.clotureeLe ? `Clôture le ${dateCourte(o.clotureeLe)}` : ''}
            </div>}
        <Stk size={13} pad="9px 16px"
          onClick={envoyee ? undefined : onPostuler}
          style={envoyee ? { opacity: .4, cursor: 'default' } : undefined}>
          {envoyee ? 'Envoyée' : 'Postuler'}
        </Stk>
      </div>
    </Card>
  );
}

ScreenStagesCandidat.tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat;
