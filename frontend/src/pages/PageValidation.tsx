/* ══════════════════════════════════════════════════════════════════════
   /parrainage/:id/validation?jeton=… — la validation manuelle, sans
   back-office : la page que l'e-mail de notification ouvre, avec les deux
   boutons. La décision part en POST, jamais au simple clic sur le lien —
   les antivirus de messagerie suivent les liens, pas les boutons.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from 'react';
import { QUALIFICATIFS } from '@stips/core';
import { ErreurApi, ParrainageAdmin, Vide } from '@stips/api';
import { api } from '../api';
import { Card, Mono } from '../atoms';
import { Bouton, Note, Page } from './formulaire';

export default function PageValidation({ id, jeton }: { id: string; jeton: string | null }) {
  const [p, setP] = useState<ParrainageAdmin | null>(null);
  const [etat, setEtat] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    api.lire(`/v1/parrainages/${id}/validation?jeton=${encodeURIComponent(jeton ?? '')}`, ParrainageAdmin)
      .then(setP, (e) => setEtat(e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas.'));
  }, [id, jeton]);

  const decider = async (decision: 'valider' | 'refuser') => {
    setEnCours(true);
    try {
      await api.ecrire(`/v1/parrainages/${id}/validation`, { jeton, decision }, Vide);
      setEtat(decision === 'valider' ? "Validée : l'invitation est partie." : 'Refusée.');
    } catch (e) {
      setEtat(e instanceof ErreurApi ? e.message : 'Le serveur ne répond pas.');
    } finally {
      setEnCours(false);
    }
  };

  if (etat) return <Page sur="VALIDATION" titre={etat} />;
  if (!p) return <Page sur="VALIDATION" titre="Un instant…" />;
  if (p.statut !== 'attente_validation') return <Page sur="VALIDATION" titre="Cette demande a déjà été traitée." />;

  return (
    <Page sur="À VALIDER" titre={`${p.parrainNom} recommande ${p.filleulNom}.`}
      sous={<>{p.parrainNom} &lt;{p.parrainEmail}&gt; → {p.filleulNom} &lt;{p.filleulEmail}&gt;</>}>
      <Card>
        <Mono>LA RECO</Mono>
        <div style={{ marginTop: 8, font: '400 26px/1.15 Instrument Serif, serif' }}>{p.qualificatif && QUALIFICATIFS[p.qualificatif]}</div>
        <div style={{ marginTop: 10, font: 'italic 400 17px/1.45 Instrument Serif, serif', textWrap: 'pretty' }}>« {p.commentaire} »</div>
      </Card>
      <Bouton onClick={() => decider('valider')} disabled={enCours}>Valider — envoyer l'invitation</Bouton>
      <Bouton onClick={() => decider('refuser')} disabled={enCours} secondaire>Refuser</Bouton>
      <Note>Le premier clic compte. Le pro reçoit un e-mail seulement en cas de validation.</Note>
    </Page>
  );
}
