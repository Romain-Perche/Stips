/* ══════════════════════════════════════════════════════════════════════
   APP — le routeur

   Deux axes d'état, volontairement séparés :
     · role     : 'membre' | 'pro'  → décide de la liste d'onglets
     · tab      : l'onglet actif dans la nav du bas
     · horsNav  : un écran affiché par-dessus, sans nav ('invitation' | null)
                  — c'est le seul écran qui précède la création de compte.

   Et, devant tout ça, la session (`moi`) : null = personne de connecté,
   l'app tourne alors en démo sur `DATA` avec la bascule de rôle ; sinon
   le rôle vient du compte et l'invitation en attente vient de l'API.

   Quatre pages vivent hors de l'app, par leur chemin : /demande,
   /parrainage/:id, /parrainage/:id/validation et /connexion. On y arrive
   par un lien (un e-mail), on n'y navigue pas : le chemin se lit une fois.

   La liste d'onglets par rôle est la SEULE source de vérité pour la nav :
   chaque écran porte son propre `.tab = { id, label }`, et TabBar (dans
   atoms.tsx) lit ce nom directement dessus. Renommer un onglet, ou changer
   quels onglets un rôle possède, se fait uniquement ici et dans le
   fichier de l'écran — jamais en deux endroits différents.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { TabBar, RoleSwitcher } from './atoms';
import DevChrome from './DevChrome';
import ScreenChercher from './screens/ScreenChercher';
import ScreenStagesCandidat from './screens/ScreenStagesCandidat';
import ScreenEvents from './screens/ScreenEvents';
import ScreenForum from './screens/ScreenForum';
import ScreenProfil from './screens/ScreenProfil';
import ScreenOffres from './screens/ScreenOffres';
import ScreenInvitation from './screens/ScreenInvitation';
import PageDemande from './pages/PageDemande';
import PageParrainage from './pages/PageParrainage';
import PageValidation from './pages/PageValidation';
import PageConnexion from './pages/PageConnexion';
import { Note, Page } from './pages/formulaire';
import { api } from './api';
import { RoleCtx } from './role';
import { DATA, QUALIFICATIFS, dateCourte } from '@stips/core';
import type { Invitation, Role } from '@stips/core';
import { ErreurApi, Moi, type InvitationRecue } from '@stips/api';
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

const chemin = location.pathname;
const params = new URLSearchParams(location.search);
/** Le lien magique de Supabase atterrit avec `?token_hash=…` : à échanger
    contre la session, une seule fois. */
const tokenHash = params.get('token_hash');
const parrainage = chemin.match(/^\/parrainage\/([^/]+)(\/validation)?$/);
const horsApp = chemin === '/demande' || parrainage !== null || (chemin === '/connexion' && !tokenHash);

const message = (e: unknown) => (e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas. Réessaie dans un instant.');

/** Ce que l'écran d'entrée affiche, composé depuis l'API : le serveur
    envoie des codes et des dates, la page écrit les phrases. */
const depuisInvitation = (i: InvitationRecue): Invitation => ({
  prenom: i.filleulPrenom,
  parrain: i.parrainNom,
  role: 'Ton maître de stage',
  qualificatif: QUALIFICATIFS[i.qualificatif],
  reco: `« ${i.commentaire} »`,
  signee: `Signé le ${dateCourte(i.creeLe)} · tu ne peux pas le modifier`,
  avantages: DATA.invitation.avantages,
});

export default function App() {
  const [moi, setMoi] = useState<Moi | null | 'chargement'>(horsApp ? null : 'chargement');
  const [erreurLien, setErreurLien] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('membre');
  const [tab, setTab] = useState(TABS.membre[0].tab.id);
  const [horsNav, setHorsNav] = useState<'invitation' | null>('invitation');
  const [acceptation, setAcceptation] = useState<{ enCours: boolean; erreur: string | null }>({ enCours: false, erreur: null });

  const arrivee = (m: Moi) => {
    setMoi(m);
    setRole(m.personne?.role ?? 'membre');
    setHorsNav(m.invitation ? 'invitation' : null);
  };

  useEffect(() => {
    if (horsApp) return;
    const session = tokenHash ? api.ecrire('/v1/auth/verifier', { tokenHash }, Moi) : api.lire('/v1/moi', Moi);
    session.then(
      (m) => {
        arrivee(m);
        // Le jeton ne sert qu'une fois : il n'a plus rien à faire dans la barre d'adresse.
        if (tokenHash) history.replaceState(null, '', '/');
      },
      (e) => {
        setMoi(null);
        if (tokenHash) setErreurLien(message(e));
      },
    );
  }, []);

  if (chemin === '/demande') return <PageDemande />;
  if (parrainage) {
    return parrainage[2]
      ? <PageValidation id={parrainage[1]} jeton={params.get('jeton')} />
      : <PageParrainage id={parrainage[1]} />;
  }
  if (chemin === '/connexion' && !tokenHash) return <PageConnexion />;
  if (erreurLien) return <PageConnexion raison={erreurLien} />;
  if (moi === 'chargement') return null;

  const connecte = moi !== null;
  if (connecte && !moi.personne && !moi.invitation) {
    return (
      <Page sur="INVITATION" titre="Aucune invitation en cours pour cet e-mail.">
        <Note>Elle a peut-être expiré : une invitation vaut 7 jours. Demande à ton maître de stage de t'inviter à nouveau, ou refais une demande sur <a href="/demande" style={{ color: 'inherit' }}>stips.club/demande</a>.</Note>
      </Page>
    );
  }

  const changerRole = (r: Role) => {
    setRole(r);
    // On reste sur le même onglet quand l'autre rôle l'a aussi (quatre sur
    // cinq) : c'est ce qui rend la différence lisible d'un coup d'œil.
    setTab(t => TABS[r].some(s => s.tab.id === t) ? t : TABS[r][0].tab.id);
    setHorsNav(null);
  };

  const accepter = async () => {
    if (!connecte) return setHorsNav(null);
    setAcceptation({ enCours: true, erreur: null });
    try {
      arrivee(await api.ecrire('/v1/invitation/accepter', {}, Moi));
      setAcceptation({ enCours: false, erreur: null });
    } catch (e) {
      setAcceptation({ enCours: false, erreur: message(e) });
    }
  };

  let ecran;
  if (horsNav === 'invitation') {
    const inv = connecte && moi.invitation ? depuisInvitation(moi.invitation) : DATA.invitation;
    ecran = <ScreenInvitation inv={inv} onAccepter={accepter} enCours={acceptation.enCours} erreur={acceptation.erreur} />;
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
        {/* `key` : changer d'onglet repart en haut de page, pas au niveau de
            défilement de l'onglet précédent. */}
        <div className="defile" key={horsNav ?? tab}>
          {!connecte && horsNav !== 'invitation' && <RoleSwitcher role={role} onChange={changerRole} />}
          {ecran}
        </div>
      </div>
      {/* Échafaudages de démo : jamais pour une personne connectée. */}
      {!connecte && <DevChrome horsNav={horsNav} onHorsNav={setHorsNav} />}
    </>
  );
}
