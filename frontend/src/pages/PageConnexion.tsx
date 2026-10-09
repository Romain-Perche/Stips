/* ══════════════════════════════════════════════════════════════════════
   /connexion — un e-mail, un lien magique. Le lien est celui de Supabase ;
   il ramène sur /invitation?token_hash=…, que App.tsx échange contre la
   session. Sert aussi quand un lien d'invitation a expiré avant d'être
   cliqué : le même e-mail reçoit un lien neuf.
   ══════════════════════════════════════════════════════════════════════ */

import { useRef, useState } from 'react';
import { Vide } from '@stips/api';
import { api } from '../api';
import { Bouton, Champ, Note, Page } from './formulaire';
import { champs, useEnvoi } from './envoi';

export default function PageConnexion({ raison }: { raison?: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [envoye, setEnvoye] = useState(false);
  const { enCours, erreur, onSubmit } = useEnvoi(
    () => api.ecrire('/v1/auth/lien', champs(form.current!), Vide),
    () => setEnvoye(true),
  );

  if (envoye) {
    return (
      <Page sur="CONNEXION" titre="Regarde tes e-mails.">
        <Note>Si cette adresse est bien celle d'un membre, un lien de connexion vient de partir. Il est valable une heure, et ne sert qu'une fois.</Note>
      </Page>
    );
  }
  return (
    <Page sur="CONNEXION" titre="Ton e-mail suffit." sous={raison ?? 'Pas de mot de passe : tu reçois un lien, tu cliques, tu es dedans.'}>
      <form ref={form} onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Champ libelle="TON E-MAIL" name="email" type="email" required autoComplete="email" autoFocus />
        {erreur && <Note erreur>{erreur}</Note>}
        <Bouton type="submit" disabled={enCours}>{enCours ? 'Envoi…' : 'Recevoir mon lien'}</Bouton>
        <Note>Pas encore membre ? <a href="/demande" style={{ color: 'inherit' }}>Demande à entrer</a>.</Note>
      </form>
    </Page>
  );
}
