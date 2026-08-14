/* ══════════════════════════════════════════════════════════════════════
   VERROU DE VERSION — « cette version est trop ancienne, mets à jour ».

   L'app demande au backend la plus vieille version encore acceptée et se
   bloque si elle est en dessous. Sans ça, le contrat d'API de la première
   version livrée est gelé à vie (voir packages/core/src/version.ts).

   ÉCHEC OUVERT, délibérément : réseau coupé, timeout, réponse non-200, JSON
   illisible, `versionMinimale` absent, version locale inconnue, pas de
   backend du tout → on ne bloque pas. Trois raisons :

     1. Il n'y a pas encore de backend. Échouer fermé afficherait « mets à
        jour » à chaque lancement de chaque build, y compris les nôtres.
     2. Échouer fermé transformerait une panne de notre infra en panne
        totale sur tous les téléphones, Y COMPRIS ceux qui ont la dernière
        version. Le rayon d'action serait exactement l'inverse du voulu.
     3. Le besoin réel est « je veux casser un contrat d'API ». Un client qui
        n'atteint pas /config n'atteint pas non plus les routes dont le
        contrat a changé : il doit voir les états d'erreur de l'app, pas un
        « ta version est trop vieille » qui serait faux.

   Le coût assumé : un client vraiment trop vieux sur un réseau instable
   passe. Le complément, quand il y aura des routes — les faire répondre
   426 Upgrade Required, routé vers le même écran. C'est LÀ qu'est
   l'application réelle ; /config au démarrage est le chemin poli, celui qui
   donne un écran propre au lieu d'un crash. D'où ScreenMiseAJour qui prend
   `url`/`message` en props et ne fetch rien : les deux déclencheurs pourront
   le piloter. Voir mobile/RELEASE.md § verrou.
   ══════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { comparerVersions } from '@stips/core';
import type { ConfigDistante } from '@stips/core';
import { env } from './env';
import { flags } from './flags';

/** Au-delà, on considère qu'on ne saura pas. Court exprès : le résultat ne
    retarde aucun rendu, il ne sert qu'à basculer l'arbre après coup. */
const DELAI_MS = 3_000;

/** Pas plus d'un appel par 5 min quand l'app revient au premier plan. */
const REVERIF_MS = 5 * 60 * 1_000;

/** Deux états seulement, parce que le verrou échoue ouvert : tout ce qui
    n'est pas « bloqué avec certitude » est « pas bloqué ». */
export type EtatVerrou =
  | { bloque: false }
  | { bloque: true; url?: string; message?: string };

async function lireConfig(): Promise<ConfigDistante | null> {
  if (!flags.verrouVersion || !env.apiUrl) return null;

  // AbortSignal.timeout() n'est pas garanti sur Hermes : minuteur manuel.
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const reponse = await fetch(`${env.apiUrl}/config`, { signal: controleur.signal });
    if (!reponse.ok) return null;
    const config = (await reponse.json()) as Partial<ConfigDistante>;
    // Sans `versionMinimale` il n'y a rien à comparer : on ne bloque pas.
    return typeof config.versionMinimale === 'string' ? (config as ConfigDistante) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(minuteur);
  }
}

export function useVerrouVersion(): EtatVerrou {
  const [etat, setEtat] = useState<EtatVerrou>(
    flags.verrouVersionForce ? { bloque: true } : { bloque: false },
  );
  const dejaBloque = useRef(flags.verrouVersionForce);
  const derniereVerif = useRef(0);

  useEffect(() => {
    let vivant = true;

    const verifier = async (): Promise<void> => {
      // Monotone : une fois bloqué, on ne débloque pas dans la même session.
      // Se débloquer, c'est redémarrer avec le nouveau binaire.
      if (dejaBloque.current) return;
      if (Date.now() - derniereVerif.current < REVERIF_MS) return;

      const config = await lireConfig();
      if (!vivant) return;
      derniereVerif.current = Date.now();

      if (!config || !env.version) return;
      if (comparerVersions(env.version, config.versionMinimale) >= 0) return;

      dejaBloque.current = true;
      setEtat({
        bloque: true,
        url: Platform.OS === 'ios' ? config.urlStore?.ios : config.urlStore?.android,
        message: config.message,
      });
    };

    void verifier();

    // iOS garde une app des semaines en arrière-plan : sans ça le verrou ne
    // se déclencherait qu'au prochain démarrage à froid, qui peut ne jamais
    // venir.
    const abonnement = AppState.addEventListener('change', (statut) => {
      if (statut === 'active') void verifier();
    });
    return () => {
      vivant = false;
      abonnement.remove();
    };
  }, []);

  return etat;
}
