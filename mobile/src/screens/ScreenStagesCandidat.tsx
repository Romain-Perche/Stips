/* ══════════════════════════════════════════════════════════════════════
   ONGLET « Stages » — candidat · pas encore dessiné dans le design doc
   Le pendant candidat de « Offres » : les stages proposés par les boîtes
   du Club, et la candidature.
   ══════════════════════════════════════════════════════════════════════ */

import { ScreenHead, Placeholder, Screen } from '../atoms';
import type { TabScreen } from '../types';

function ScreenStagesCandidat() {
  return (
    <Screen>
      <ScreenHead titre="Stages" sous="Les offres publiées par les boîtes du Club" />
      <Placeholder label="Onglet Stage" texte="A venir" />
    </Screen>
  );
}

(ScreenStagesCandidat as unknown as TabScreen).tab = { id: 'stages', label: 'Stages' };

export default ScreenStagesCandidat as unknown as TabScreen;
