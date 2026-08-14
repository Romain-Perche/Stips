/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — membre · pas dans le design doc, premier jet

   Le pendant membre de « Offres » : les stages publiés par les pros, et
   la candidature. Même grammaire que l'onglet Offres — micro-label mono,
   titre, filet, action en pilule — pour que les deux faces du même objet
   se ressemblent.

   ⚠️ Deux champs manquent à `Offre` pour cet écran, et ça se voit :
   **l'employeur** et **la date limite**. `meta` ne porte que
   « M&A · PARIS · 6 MOIS », et `pied` (« Publiée le 2 sept. · 4 non
   lues ») mélange une date avec un compteur réservé au pro. Tant que
   c'est le pro qui regarde ses propres offres, l'employeur est implicite ;
   dès qu'un membre les parcourt, il manque. À reprendre côté schéma —
   `offre.entreprise_id` et une date de clôture (`backend/README.md`).
   ══════════════════════════════════════════════════════════════════════ */

import { useMemo, useState, type ReactNode } from 'react';
import { C, DATA } from '@stips/core';
import type { Offre } from '@stips/core';
import { F } from '../tokens';
import { Mono, Card, Stk, ScreenHead, Pills, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenStagesCandidat({ nav }: { nav: ReactNode }) {
  const [filtre, setFiltre] = useState('Tout');
  const [envoyees, setEnvoyees] = useState<string[]>([]);

  const liste = useMemo(() => (
    filtre === 'Mes candidatures'
      ? DATA.offres.liste.filter(o => envoyees.includes(o.titre))
      : DATA.offres.liste
  ), [filtre, envoyees]);

  return (
    <Screen nav={nav}>
      <ScreenHead titre="Stages"
        sous={`${DATA.offres.liste.length} offres ouvertes, publiées par les pros de Stips`} />
      <Pills items={['Tout', 'Mes candidatures']} active={filtre} onChange={setFiltre} />

      <div className="body">
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
          <Card dark style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, cursor: 'pointer',
          }}>
            <div>
              <div style={{ font: `600 17px ${F.ui}`, color: C.cream }}>Être vu par les pros</div>
              <div style={{ font: `400 12px ${F.ui}`, color: C.creamMut, marginTop: 4 }}>
                Remplis « Qui suis-je ? » pour entrer dans leurs recherches
              </div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: C.cream, color: C.ink,
              display: 'grid', placeItems: 'center', font: `300 20px ${F.ui}`, flex: 'none',
            }}>→</div>
          </Card>
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
      <Mono>{o.meta}</Mono>
      <div style={{ font: `600 18px/1.25 ${F.ui}`, color: C.ink, marginTop: 6 }}>{o.titre}</div>

      <div style={{
        marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,.08)',
        display: 'flex', alignItems: 'center',
        justifyContent: envoyee ? 'space-between' : 'flex-end',
      }}>
        {envoyee && <Mono color={C.ink}>CANDIDATURE ENVOYÉE ✓</Mono>}
        <Stk size={13} pad="9px 16px"
          onClick={envoyee ? undefined : onPostuler}
          style={envoyee ? { opacity: .4, cursor: 'default' } : undefined}>
          {envoyee ? 'Envoyée' : 'Postuler'}
        </Stk>
      </div>
    </Card>
  );
}

(ScreenStagesCandidat as TabScreen).tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat as TabScreen;
