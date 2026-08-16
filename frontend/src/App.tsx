/* ══════════════════════════════════════════════════════════════════════
   APP — le routeur

   Deux axes d'état, volontairement séparés :
     · role     : 'membre' | 'pro'  → décide de la liste d'onglets
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
import { TabBar, RoleSwitcher } from './atoms';
import DevChrome from './DevChrome';
import ScreenChercher from './screens/ScreenChercher';
import ScreenStagesCandidat from './screens/ScreenStagesCandidat';
import ScreenEvents from './screens/ScreenEvents';
import ScreenForum from './screens/ScreenForum';
import ScreenProfil from './screens/ScreenProfil';
import ScreenOffres from './screens/ScreenOffres';
import ScreenInvitation from './screens/ScreenInvitation';
import { RoleCtx } from './role';
import type { Role } from '@stips/core';
import type { TabScreen } from './types';

/* Cinq onglets de chaque côté, un seul écran de différence : le membre a
   « Stages » (les offres et sa candidature) là où le pro a « Offres »
   (ses offres, les candidatures reçues, et le deck des membres en
   recherche). Tout le reste est commun.

   Ce qui sépare vraiment les deux rôles n'est donc pas la nav mais ce que
   chaque écran montre : l'annuaire s'arrête à la partie 1 des profils
   pour tout le monde, et les recos ne se lisent que dans le deck de
   l'onglet Offres. Voir `Description projet.md` § les deux rôles.

   ScreenTalents n'est plus un onglet — son deck vit dans ScreenOffres. */
const TABS: Record<Role, TabScreen[]> = {
  membre: [ScreenChercher, ScreenStagesCandidat, ScreenEvents, ScreenForum, ScreenProfil],
  pro:    [ScreenChercher, ScreenOffres,         ScreenEvents, ScreenForum, ScreenProfil],
};

export default function App() {
  const [role, setRole] = useState<Role>('membre');
  const [tab, setTab] = useState(TABS.membre[0].tab.id);
  const [horsNav, setHorsNav] = useState<'invitation' | null>('invitation');

  const changerRole = (r: Role) => {
    setRole(r);
    // On reste sur le même onglet quand l'autre rôle l'a aussi (quatre sur
    // cinq) : c'est ce qui rend la différence lisible d'un coup d'œil.
    setTab(t => TABS[r].some(s => s.tab.id === t) ? t : TABS[r][0].tab.id);
    setHorsNav(null);
  };

  let ecran;
  if (horsNav === 'invitation') {
    ecran = <ScreenInvitation onAccepter={() => setHorsNav(null)} />;
  } else {
    const screens = TABS[role];
    const Ecran = screens.find(s => s.tab.id === tab) ?? screens[0];
    ecran = (
      <RoleCtx.Provider value={role}>
        <Ecran nav={<TabBar screens={screens} active={tab} onChange={setTab} />} />
      </RoleCtx.Provider>
    );
  }

  return (
    <>
      <div className="ph">
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
          {horsNav !== 'invitation' && <RoleSwitcher role={role} onChange={changerRole} />}
          <div style={{ flex: 1, position: 'relative' }}>{ecran}</div>
        </div>
      </div>
      <DevChrome horsNav={horsNav} onHorsNav={setHorsNav} />
    </>
  );
}
