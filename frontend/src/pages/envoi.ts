/* ══════════════════════════════════════════════════════════════════════
   ENVOI — ce qu'un formulaire fait de son bouton. Hors de formulaire.tsx
   parce que Vite ne rafraîchit à chaud que les fichiers qui n'exportent
   que des composants.
   ══════════════════════════════════════════════════════════════════════ */

import { useState, type FormEvent } from 'react';
import { ErreurApi } from '@stips/api';

/** Un envoi de formulaire : l'état « en cours », et la phrase du serveur en
    cas d'échec (`ErreurApi.message`). `apres` reçoit le résultat. */
export function useEnvoi<T>(envoyer: () => Promise<T>, apres: (r: T) => void) {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      apres(await envoyer());
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Le serveur ne répond pas. Réessaie dans un instant.');
    } finally {
      setEnCours(false);
    }
  };
  return { enCours, erreur, onSubmit };
}

/** Lit les champs d'un `<form>` par leur `name`. */
export const champs = (form: HTMLFormElement) => Object.fromEntries(new FormData(form)) as Record<string, string>;
