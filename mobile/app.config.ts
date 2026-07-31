/* ══════════════════════════════════════════════════════════════════════
   Config Expo par variante — remplace app.json pour pouvoir lire
   APP_VARIANT (dev / preview / production) et choisir bundle id,
   nom d'app et couleur d'icône en conséquence. Voir mobile/AGENTS.md.

   Tout ce qui passe par `extra` finit en clair dans le bundle JS, donc
   dans n'importe quel .ipa ou .apk : uniquement des valeurs assumées
   publiques ici. Voir AGENTS.md § Config et secrets — le garde-fou plus
   bas dans ce fichier le vérifie à chaque évaluation de la config.
   ══════════════════════════════════════════════════════════════════════ */

import type { ConfigContext, ExpoConfig } from 'expo/config';

type Variante = 'development' | 'preview' | 'production';
const variante = (process.env.APP_VARIANT ?? 'development') as Variante;

// TODO(bundle-id) : "com.leclub.app" est un placeholder — aucun domaine
// n'est encore choisi. Change-le librement tant qu'aucune app n'a été
// soumise à TestFlight (externe) ou Play Console : c'est CE moment-là,
// pas eas init ni un build interne, qui le fige pour de vrai.
const BASE_ID = 'com.leclub.app';

const CONFIG_PAR_VARIANTE: Record<
  Variante,
  { suffixeNom: string; suffixeId: string; fondIcone: string; apiUrl: string }
> = {
  development: {
    suffixeNom: ' (dev)',
    suffixeId: '.dev',
    fondIcone: '#c9d9c4',
    apiUrl: process.env.API_URL ?? 'http://192.168.1.10:3000',
  },
  preview: {
    suffixeNom: ' (preview)',
    suffixeId: '.preview',
    fondIcone: '#e8d5b7',
    apiUrl: process.env.API_URL ?? 'https://staging.api.leclub.club',
  },
  production: {
    suffixeNom: '',
    suffixeId: '',
    fondIcone: '#f7f5ef',
    apiUrl: process.env.API_URL ?? 'https://api.leclub.club',
  },
};
const parVariante = CONFIG_PAR_VARIANTE[variante];

/* ── Garde-fou ─────────────────────────────────────────────────────────
   `extra` et les variables EXPO_PUBLIC_* sont lisibles dans n'importe
   quel binaire : si un secret arrive ici, on refuse de s'évaluer. Donc
   `expo start` et `eas build` échouent avant qu'un binaire existe.

   Liste volontairement courte : les préfixes qu'on risque réellement de
   coller ici par erreur. Ce n'est pas un scanner de secrets, c'est une
   ceinture de sécurité — elle n'excuse pas de mettre la clé au bon
   endroit du premier coup.
   ──────────────────────────────────────────────────────────────────── */
const MOTIFS_SECRETS = [
  /\bsk_(live|test)_/, // clé Stripe secrète
  /\brk_(live|test)_/, // clé Stripe restricted
  /\bwhsec_/, // secret de webhook Stripe — secret-ok
  /service_role/, // clé de service Supabase — secret-ok
  /"type"\s*:\s*"service_account"/, // clé de service-account Google — secret-ok
  /-----BEGIN [A-Z ]*PRIVATE KEY/, // secret-ok
  /\b(ghp|gho|github_pat)_[A-Za-z0-9]/, // jeton GitHub
  /\bxox[abpsr]-/, // jeton Slack
];

function refuseLesSecrets(valeurs: Record<string, unknown>, chemin: string): void {
  for (const [cle, valeur] of Object.entries(valeurs)) {
    if (valeur !== null && typeof valeur === 'object') {
      refuseLesSecrets(valeur as Record<string, unknown>, `${chemin}.${cle}`);
      continue;
    }
    if (typeof valeur !== 'string') continue;

    const motif = MOTIFS_SECRETS.find((m) => m.test(valeur));
    if (motif) {
      throw new Error(
        `[config] ${chemin}.${cle} ressemble à un secret (motif ${motif.source}).\n` +
          `Tout ce qui part dans le bundle est public : cette valeur doit vivre côté ` +
          `backend, pas dans l'app. Voir AGENTS.md § Config et secrets.`,
      );
    }
  }
}

const extra = {
  variante,
  apiUrl: parVariante.apiUrl,
  // Quand Stripe et Sentry arrivent : clé publishable (pk_…) et DSN ici,
  // et rien d'autre. Jamais la clé secrète ni le secret de webhook — ils
  // restent côté backend, qui est le seul à parler aux tiers.
  eas: { projectId: '84949835-acaa-4698-b4aa-67af144e7f52' },
};

refuseLesSecrets(extra, 'extra');

// Metro inline les EXPO_PUBLIC_* dans le bundle indépendamment de ce
// fichier. On les contrôle ici parce que le .env est déjà chargé quand la
// config s'évalue : c'est le seul endroit où on peut encore refuser.
refuseLesSecrets(
  Object.fromEntries(Object.entries(process.env).filter(([c]) => c.startsWith('EXPO_PUBLIC_'))),
  'process.env',
);

if (variante === 'production' && !extra.apiUrl.startsWith('https://')) {
  throw new Error(
    `[config] apiUrl doit être en https en production (reçu : ${extra.apiUrl}).\n` +
      `En clair, tout jeton envoyé par l'app est lisible sur le réseau.`,
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: `Le Club${parVariante.suffixeNom}`,
  slug: 'le-club',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: `${BASE_ID}${parVariante.suffixeId}`,
  },
  android: {
    package: `${BASE_ID}${parVariante.suffixeId}`,
    adaptiveIcon: {
      backgroundColor: parVariante.fondIcone,
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-font'],
  extra,
  owner: 'romain1805',
});
