/* ══════════════════════════════════════════════════════════════════════
   /parrainage/:id — la page du pro, sans compte : LE point de conversion
   du produit (Description projet.md § entrée dans Stips). Elle arrive
   préremplie, demande un mot et une phrase, et ne propose un compte
   qu'après, une fois la reco validée.

   La même URL sert à chaque étape : le statut dit quoi afficher.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { QUALIFICATIFS } from '@stips/core';
import { ErreurApi, Parrainage, Vide } from '@stips/api';
import { api } from '../api';
import { Bouton, Champ, Note, Page, Selection } from './formulaire';
import { champs, useEnvoi } from './envoi';

export default function PageParrainage({ id }: { id: string }) {
  const [p, setP] = useState<Parrainage | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);
  useEffect(() => {
    api.lire(`/v1/parrainages/${id}`, Parrainage).then(setP, (e) =>
      setChargement(e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas.'));
  }, [id]);

  if (chargement) return <Page sur="PARRAINAGE" titre={chargement} />;
  if (!p) return <Page sur="PARRAINAGE" titre="Un instant…" />;

  const prenom = p.filleulNom.split(' ')[0];
  switch (p.statut) {
    case 'attente_pro':
      return <Formulaire p={p} onEnvoye={setP} />;
    case 'attente_validation':
      return (
        <Page sur="MERCI" titre={`Ta recommandation de ${prenom} est envoyée.`}>
          <Note>On la relit, puis {prenom} reçoit son invitation. Tu recevras un e-mail à ce moment-là.</Note>
        </Page>
      );
    case 'attente_acceptation':
    case 'acceptee':
      return <ComptePro p={p} prenom={prenom} />;
    case 'refusee':
      return <Page sur="PARRAINAGE" titre="Cette demande n'a pas été retenue." />;
    case 'expiree':
      return (
        <Page sur="LIEN EXPIRÉ" titre="Ce lien n'est plus valable.">
          <Note>Demande à {prenom} de refaire une demande : tu recevras un nouveau lien.</Note>
        </Page>
      );
  }
}

function Formulaire({ p, onEnvoye }: { p: Parrainage; onEnvoye: (p: Parrainage) => void }) {
  const form = useRef<HTMLFormElement>(null);
  const prenom = p.filleulNom.split(' ')[0];
  const { enCours, erreur, onSubmit } = useEnvoi(
    () => api.ecrire(`/v1/parrainages/${p.id}/reco`, champs(form.current!), Parrainage),
    onEnvoye,
  );
  return (
    <Page sur="RECOMMANDATION" titre={`${p.filleulNom} te demande de le recommander pour Stips.`}
      sous={<>Stips est un club de jeunes diplômés où l'on n'entre que recommandé par son maître de stage. Ce que tu écris ici, {prenom} le verra tel quel, et les recruteurs du club aussi.</>}>
      <form ref={form} onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Champ libelle="TON NOM" name="parrainNom" defaultValue={p.parrainNom} required />
        <Selection libelle={`LE MOT QUI RÉSUME ${prenom.toUpperCase()}`} name="qualificatif" options={QUALIFICATIFS} />
        <Champ libelle="UNE PHRASE OU DEUX" name="commentaire" textarea required minLength={20} maxLength={600}
          placeholder="Autonome dès la deuxième semaine. À reprendre les yeux fermés." />
        {erreur && <Note erreur>{erreur}</Note>}
        <Bouton type="submit" disabled={enCours}>{enCours ? 'Envoi…' : 'Envoyer ma recommandation'}</Bouton>
        <Note>
          Ta recommandation est signée de ton nom. Elle reste attachée au profil de {prenom}, y compris si tu supprimes un compte Stips plus tard — une recommandation anonyme ne vaudrait rien.
        </Note>
      </form>
    </Page>
  );
}

/** Après validation : le service est rendu, on propose seulement maintenant
    un compte pro. */
function ComptePro({ p, prenom }: { p: Parrainage; prenom: string }) {
  const [envoye, setEnvoye] = useState(false);
  const { enCours, erreur, onSubmit } = useEnvoi(
    () => api.ecrire(`/v1/parrainages/${p.id}/compte-pro`, {}, Vide),
    () => setEnvoye(true),
  );
  return (
    <Page sur="RECOMMANDATION VALIDÉE" titre={`${prenom} a reçu son invitation. Merci.`}>
      {p.parrainInscrit || envoye ? (
        <Note>{envoye ? 'Un e-mail vient de partir : il contient ton lien de connexion.' : 'Ton compte pro existe déjà.'}</Note>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Note>Si tu veux, Stips est aussi ouvert aux pros, gratuitement : voir les profils en recherche de stage, publier des offres, inviter tes prochains stagiaires sans repasser par ici.</Note>
          {erreur && <Note erreur>{erreur}</Note>}
          <Bouton type="submit" disabled={enCours}>{enCours ? 'Envoi…' : 'Créer mon compte pro'}</Bouton>
        </form>
      )}
    </Page>
  );
}
