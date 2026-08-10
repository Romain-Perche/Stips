/* ══════════════════════════════════════════════════════════════════════
   OBSERVABILITÉ — Sentry.

   Sur le web on ouvre la console de quelqu'un à distance. Sur mobile, non :
   un crash chez un membre du Club, sans outillage, c'est un message « ça
   marche pas » et zéro information. D'où le crash reporting AVANT la
   première build partagée à quelqu'un d'autre que nous.

   Ce module s'initialise À L'IMPORT, et index.ts l'importe en PREMIER.
   Ce n'est pas un détail de style : les imports ES sont hoistés, donc
   appeler une fonction d'init depuis index.ts n'y changerait rien — le
   module d'App et tous les écrans seraient déjà évalués, et une erreur
   levée pendant leur évaluation échapperait au handler.

   Trois conditions pour démarrer, toutes vérifiées ici :
     · un DSN renseigné — sinon il n'y a nulle part où envoyer ;
     · pas dans Expo Go — le natif de Sentry n'y est pas (voir plus bas) ;
     · pas en développement, sauf `flags.sentryEnDev` — le bruit de dev n'a
       aucune valeur et consomme un quota (5 000 erreurs/mois offertes).

   Ce qui N'EST PAS ici : les événements analytics du tunnel
   invitation → compte → événement. Deux de ces trois étapes n'existent pas
   encore en code, et le dénominateur (« invitations envoyées ») vit dans un
   backend qui n'a pas de stack choisie. Un taux de conversion fabriqué
   maintenant mesurerait un clic sur une maquette. Voir RELEASE.md
   § observabilité.
   ══════════════════════════════════════════════════════════════════════ */

import * as Sentry from '@sentry/react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { env } from '../config/env';
import { flags } from '../config/flags';

/* ── Expo Go ───────────────────────────────────────────────────────────
   `@sentry/react-native` embarque du code natif. Expo Go ne contient que
   les modules natifs compilés dans SDK 54 : Sentry n'en fait pas partie, et
   on tient à ce qu'Expo Go reste utilisable (c'est toute la raison du
   pinning SDK 54, voir mobile/AGENTS.md).

   On coupe donc entièrement plutôt que de tomber en mode dégradé. Ce n'est
   pas une perte : dans Expo Go on a l'écran rouge et les logs Metro, c'est-
   à-dire exactement la console que le mobile n'a pas en production. Les
   trois profils EAS produisent de vraies builds (`development` a un dev
   client), donc le natif est là partout où ça compte.
   ──────────────────────────────────────────────────────────────────── */
export const dansExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Le DSN n'est pas un secret — il autorise l'ENVOI d'événements, pas la
    lecture du projet — mais tant qu'il vaut son placeholder, l'envoyer
    créerait des erreurs réseau à chaque événement. */
const dsnRenseigne = env.sentryDsn.length > 0 && !env.sentryDsn.includes('REMPLACER');

export const actif = dsnRenseigne && !dansExpoGo && (!__DEV__ || flags.sentryEnDev);

/* Créée au niveau du module et non dans `init` : App.tsx doit pouvoir lui
   passer la ref du NavigationContainer, et elle doit exister avant que
   `Sentry.init` la reçoive dans `integrations`. */
const integrationNavigation = Sentry.reactNavigationIntegration({
  // Mesure le temps entre le tap sur un onglet et la première frame rendue.
  // Repose sur du natif : inutile de le demander si Sentry ne tourne pas.
  enableTimeToInitialDisplay: actif,
});

if (actif) {
  Sentry.init({
    dsn: env.sentryDsn,

    /* Un seul projet Sentry pour les trois variantes : c'est ce tag qui les
       sépare dans l'UI, les alertes et les recherches. Trois projets
       voudraient dire trois quotas, trois jetons et trois jeux d'alertes à
       tenir synchrones, pour une isolation dont on n'a pas besoin. */
    environment: env.variante,

    /* Le Club est un annuaire de vraies personnes, avec de vrais noms et des
       avis de parrainage nominatifs. `sendDefaultPii: true` enverrait à
       Sentry l'IP et l'identité de l'utilisateur avec chaque événement.

       Ça a aussi une conséquence store directe : à false, la seule donnée
       déclarée au questionnaire App Privacy / Data Safety est « Crash Data »
       (+ « Performance Data » à cause du tracing ci-dessous). Voir
       RELEASE.md § confidentialité — le questionnaire doit être mis à jour
       DANS la release qui commence à collecter, pas après. */
    sendDefaultPii: false,

    /* Performance. Plein pot hors production pour voir quelque chose tout de
       suite ; échantillonné en production parce que les spans ont leur
       propre quota et qu'on n'a besoin que d'une tendance. À remonter le
       jour où on chasse une lenteur précise. */
    tracesSampleRate: env.variante === 'production' ? 0.2 : 1.0,

    integrations: [integrationNavigation],

    /* Attache une stack aux `captureMessage`, pas seulement aux exceptions —
       sans ça un message arrive sans aucun moyen de savoir d'où il vient. */
    attachStacktrace: true,

    /* Pas de `release` ni de `dist` ici, volontairement. Le bundle porte un
       « debug id » posé par getSentryExpoConfig (metro.config.js) que Sentry
       retrouve dans la source map uploadée au build : la symbolication ne
       dépend donc pas d'un nom de release qu'on aurait à tenir à jour à la
       main. `version` d'app.config.ts et les buildNumber gérés par EAS
       (appVersionSource: "remote") sont posés automatiquement. */

    /* Les logs verbeux du SDK seulement quand on est en train de vérifier
       que le tuyau marche — sinon ils polluent la console de dev. */
    debug: __DEV__ && flags.sentryEnDev,
  });
}

/** À brancher sur `onReady` du NavigationContainer. Sans ça, l'intégration
    navigation ne voit aucun changement d'écran : plus de fil d'Ariane
    « il était sur quel onglet quand ça a pété », qui est souvent la moitié
    de l'information utile dans un rapport de crash.

    No-op quand Sentry ne tourne pas, pour qu'App.tsx n'ait pas à le savoir. */
export function enregistrerNavigation(conteneur: unknown): void {
  if (!actif) return;
  integrationNavigation.registerNavigationContainer(conteneur);
}

/** Le point d'entrée unique pour signaler une erreur rattrapée. En
    développement (ou dans Expo Go) où Sentry ne tourne pas, on écrit dans la
    console : sinon l'erreur disparaît deux fois, et on croirait à tort que
    le chemin d'erreur n'est jamais emprunté. */
export function capturer(erreur: unknown, contexte?: Record<string, unknown>): void {
  if (!actif) {
    if (__DEV__) console.warn('[observabilite]', erreur, contexte ?? '');
    return;
  }
  Sentry.captureException(erreur, contexte ? { extra: contexte } : undefined);
}

/** Ré-export : App.tsx enveloppe son composant racine avec, ce qui branche
    le suivi des gestes et le profiler. Passe-plat inoffensif quand Sentry
    n'est pas initialisé. */
export const envelopper = Sentry.wrap;
