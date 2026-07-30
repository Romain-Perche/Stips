/* ══════════════════════════════════════════════════════════════════════
   ENV — lit `extra` posé par app.config.ts selon APP_VARIANT. Pas encore
   de vrai backend (voir backend/README.md) : apiUrl ne sert à rien tant
   qu'aucun appel réseau n'existe côté écrans.

   Tout ce qui est exposé ici est public : ces valeurs viennent du bundle,
   qui se lit dans n'importe quel .ipa ou .apk. C'est ici qu'iront la clé
   publishable Stripe (pk_…) et le DSN Sentry le jour où ils arrivent —
   jamais une clé secrète. Voir AGENTS.md § Config et secrets.
   ══════════════════════════════════════════════════════════════════════ */

import Constants from 'expo-constants';

type Variante = 'development' | 'preview' | 'production';

const extra = Constants.expoConfig?.extra ?? {};

export const env = {
  variante: (extra.variante as Variante) ?? 'development',
  apiUrl: (extra.apiUrl as string) ?? '',
};

export const estProd = env.variante === 'production';
