/* ══════════════════════════════════════════════════════════════════════
   /demande — le stagiaire demande à entrer. Son identité, et celle de son
   maître de stage, qui reçoit un lien vers /parrainage/:id.
   ══════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react';
import { Vide } from '@stips/api';
import { api } from '../api';
import { Bouton, Champ, Note, Page } from './formulaire';
import { champs, useEnvoi } from './envoi';

export default function PageDemande() {
  const form = useRef<HTMLFormElement>(null);
  const [envoye, setEnvoye] = useState(false);
  const { enCours, erreur, onSubmit } = useEnvoi(
    () => api.ecrire('/v1/demandes', champs(form.current!), Vide),
    () => setEnvoye(true),
  );

  if (envoye) {
    return (
      <Page sur="DEMANDE ENVOYÉE" titre="Ton maître de stage a reçu un e-mail.">
        <Note>Dès qu'il ou elle aura écrit ta recommandation et qu'on l'aura validée, tu recevras ton invitation par e-mail. Compte quelques jours.</Note>
      </Page>
    );
  }

  return (
    <Page sur="ENTRER DANS STIPS" titre="On n'entre que recommandé par son maître de stage."
      sous="Dis-nous qui tu es, et qui te recommande. Il ou elle recevra un lien : deux minutes, sans compte à créer.">
      <form ref={form} onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Champ libelle="TON PRÉNOM" name="filleulPrenom" required autoComplete="given-name" />
        <Champ libelle="TON NOM" name="filleulNom" required autoComplete="family-name" />
        <Champ libelle="TON E-MAIL" name="filleulEmail" type="email" required autoComplete="email" />
        <Champ libelle="LE NOM DE TON MAÎTRE DE STAGE" name="parrainNom" required placeholder="Léa Ferrand" />
        <Champ libelle="SON E-MAIL PROFESSIONNEL" name="parrainEmail" type="email" required placeholder="lea.ferrand@entreprise.fr" />
        {erreur && <Note erreur>{erreur}</Note>}
        <Bouton type="submit" disabled={enCours}>{enCours ? 'Envoi…' : 'Envoyer la demande'}</Bouton>
        <Note>Gratuit pendant la bêta.</Note>
      </form>
    </Page>
  );
}
