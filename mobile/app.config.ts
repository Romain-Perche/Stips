/* ══════════════════════════════════════════════════════════════════════
   Config Expo par variante — remplace app.json pour pouvoir lire
   APP_VARIANT (dev / preview / production) et choisir bundle id,
   nom d'app et couleur d'icône en conséquence. Voir mobile/AGENTS.md.
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
  extra: {
    variante,
    apiUrl: parVariante.apiUrl,
    eas: { projectId: '84949835-acaa-4698-b4aa-67af144e7f52' },
  },
  owner: 'romain1805',
});
