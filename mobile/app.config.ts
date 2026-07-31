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
  // Le SEUL numéro de version qu'un humain édite. `eas.json` a
  // appVersionSource: "remote", donc buildNumber (iOS) et versionCode
  // (Android) appartiennent à EAS et s'auto-incrémentent : les poser ici
  // entrerait en conflit. Leur absence est voulue, pas un oubli.
  // Un tag mobile-vX.Y.Z doit correspondre à cette valeur (voir AGENTS.md).
  version: '0.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // Opt-out explicite du mode sombre : la DA n'en a pas, et un mode sombre
  // non stylé est un vrai motif de rejet pour qualité en review.
  userInterfaceStyle: 'light',
  // Préfixe de lien profond (leclub://…). Posé maintenant alors que rien ne
  // l'utilise : il servira à ouvrir l'invitation autrement que par un lien
  // e-mail one-shot (voir « À trancher » §2) et à tout redirect OAuth. Le
  // changer une fois que des liens traînent dans des boîtes mail est pénible.
  scheme: 'leclub',
  // Mises à jour OTA : un correctif JS part en minutes au lieu d'un
  // aller-retour de review de 24-48 h (autorisé par la règle 2.5.2 d'Apple
  // tant que ça ne change pas ce que fait l'app). `updates.url` ET
  // `runtimeVersion` sont tous deux obligatoires.
  //
  // Comme le verrou de version, ça ne se rattrape pas : un binaire compilé
  // sans expo-updates ne recevra JAMAIS de mise à jour OTA. D'où sa présence
  // avant le premier build. C'est aussi ce qui rend enfin réels les
  // `channel` d'eas.json, inertes tant que la lib n'était pas installée.
  updates: { url: 'https://u.expo.dev/84949835-acaa-4698-b4aa-67af144e7f52' },
  // policy 'appVersion' : la frontière de compatibilité OTA coïncide avec la
  // frontière de version store. C'est ce qui garantit que la version lue à
  // l'exécution (src/config/env.ts) reste celle du binaire installé.
  runtimeVersion: { policy: 'appVersion' },
  ios: {
    // false (le défaut) est un choix, pas un oubli : true est un ENGAGEMENT
    // — App Review évalue le rendu iPad, App Store Connect exige des
    // captures iPad, et la HIG attend toutes les orientations, ce qui
    // contredit orientation: 'portrait'. La DA est pensée pour un téléphone.
    supportsTablet: false,
    bundleIdentifier: `${BASE_ID}${parVariante.suffixeId}`,
    infoPlist: {
      // Le seul chiffrement de l'app est le HTTPS fourni par l'OS, soit le
      // cas exempté. Sans cette clé, on remplit le questionnaire de
      // conformité export à CHAQUE soumission, et une mauvaise réponse
      // bloque le build sur TestFlight. À revoir si l'app chiffre un jour
      // quoi que ce soit elle-même.
      ITSAppUsesNonExemptEncryption: false,
    },
    // Manifeste de confidentialité. Sans lui, le scan automatique d'Apple
    // renvoie ITMS-91053 « Missing API declaration » et bloque le build.
    // mobile/ios/ n'existe pas (workflow CNG) : cette clé est le seul
    // endroit possible, Expo génère PrivacyInfo.xcprivacy au prebuild.
    //
    // Meilleur effort : les SDK tiers (React Native, modules Expo) portent
    // leurs propres manifestes, on déclare pour notre code. Le scan d'Apple
    // est l'autorité et son mail nomme exactement ce qui manque — voir
    // RELEASE.md § confidentialité.
    privacyManifests: {
      // Aucun analytics, aucune publicité, aucun tracking. Tant que c'est
      // vrai, ça se déclare — et ça rend le questionnaire App Store Connect
      // trivial. À reprendre le jour où un SDK tiers arrive.
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'], // usage interne à l'app
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1'], // conteneur de l'app
        },
      ],
    },
  },
  android: {
    package: `${BASE_ID}${parVariante.suffixeId}`,
    adaptiveIcon: {
      backgroundColor: parVariante.fondIcone,
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Lu dans le AndroidManifest.xml fusionné (npx expo prebuild --platform
    // android) : ces trois permissions sont injectées par les dépendances
    // natives (pas par notre code) et aucune fonctionnalité de l'app ne s'en
    // sert. SYSTEM_ALERT_WINDOW est en particulier une permission sensible
    // pour Play (liée aux attaques par superposition) — sans blocage, elle
    // finit dans le binaire de production. À retirer de cette liste le jour
    // où une vraie fonctionnalité en a besoin (ex. upload de CV/photo →
    // gérée par les permissions scoped de expo-image-picker, pas celles-ci).
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-font',
    // assets/splash-icon.png existait sans être référencé. Sur SDK 54 le
    // splash passe par ce plugin, l'ancienne clé `splash` est legacy.
    ['expo-splash-screen', {
      image: './assets/splash-icon.png',
      backgroundColor: '#f7f5ef',
      imageWidth: 200,
    }],
  ],
  extra,
  owner: 'romain1805',
});
