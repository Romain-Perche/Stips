/* ══════════════════════════════════════════════════════════════════════
   APP — le routeur

   Deux axes d'état, volontairement séparés :
     · role     : 'candidat' | 'entreprise'  → décide de la liste d'onglets
     · tab      : l'onglet actif dans la nav du bas
     · horsNav  : un écran affiché par-dessus, sans nav ('invitation' | null)
                  — c'est le seul écran qui précède la création de compte.

   La liste d'onglets par rôle est la SEULE source de vérité pour la nav :
   chaque écran porte son propre `.tab = { id, label }`, et TabBar (dans
   atoms.tsx) lit ce nom directement dessus. Renommer un onglet, ou changer
   quels onglets un rôle possède, se fait uniquement ici et dans le
   fichier de l'écran — jamais en deux endroits différents.
   ══════════════════════════════════════════════════════════════════════ */

import { useState } from 'react';
import { TabBar } from './atoms';
import DevChrome from './DevChrome';
import ScreenChercher from './screens/ScreenChercher';
import ScreenStagesCandidat from './screens/ScreenStagesCandidat';
import ScreenEvents from './screens/ScreenEvents';
import ScreenForum from './screens/ScreenForum';
import ScreenProfil from './screens/ScreenProfil';
import ScreenTalents from './screens/ScreenTalents';
import ScreenOffres from './screens/ScreenOffres';
import ScreenInvitation from './screens/ScreenInvitation';
import type { Role, TabScreen } from './types';

const TABS: Record<Role, TabScreen[]> = {
  candidat: [ScreenChercher, ScreenStagesCandidat, ScreenEvents, ScreenForum, ScreenProfil],
  // Vue entreprise volontairement restreinte : la recherche de candidats
  // potentiels (Talents) et la gestion des offres (Offres). Pas d'Agenda
  // ni de Forum côté entreprise pour l'instant.
  entreprise: [ScreenTalents, ScreenOffres],
};

export default function App() {
  const [role, setRole] = useState<Role>('candidat');
  const [tab, setTab] = useState(TABS.candidat[0].tab.id);
  const [horsNav, setHorsNav] = useState<'invitation' | null>('invitation');

  const changerRole = (r: Role) => {
    setRole(r);
    setTab(TABS[r][0].tab.id);
    setHorsNav(null);
  };

  let ecran;
  if (horsNav === 'invitation') {
    ecran = <ScreenInvitation onAccepter={() => setHorsNav(null)} />;
  } else {
    const screens = TABS[role];
    const Ecran = screens.find(s => s.tab.id === tab) ?? screens[0];
    ecran = <Ecran nav={<TabBar screens={screens} active={tab} onChange={setTab} />} />;
  }

  return (
    <>
      <div className="ph">{ecran}</div>
      <DevChrome role={role} horsNav={horsNav}
        onRole={changerRole} onHorsNav={setHorsNav} />
    </>
  );
}
