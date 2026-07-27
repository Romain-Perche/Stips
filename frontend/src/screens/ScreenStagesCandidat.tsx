/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — candidat · pas encore dessiné dans le design doc
   Le pendant candidat de « Offres » : les stages proposés par les boîtes
   du Club, et la candidature.
   ══════════════════════════════════════════════════════════════════════ */

import type { ReactNode } from 'react';
import { ScreenHead, Placeholder, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenStagesCandidat({ nav }: { nav: ReactNode }) {
  return (
    <Screen nav={nav}>
      <ScreenHead titre="Stages" sous="Les offres publiées par les boîtes du Club" />
      <div className="body">
        <Placeholder label="Onglet Stage" texte="A venir" />
      </div>
    </Screen>
  );
}

(ScreenStagesCandidat as TabScreen).tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat as TabScreen;
