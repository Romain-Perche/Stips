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
  /** La version de l'app — le champ `version` d'app.config.ts, donc celle
      que le store affiche. Lue par le verrou de version (miseAJour.ts).

      `null` et non '0.0.0' si introuvable : comparée à une version minimale,
      '0.0.0' serait toujours plus petite et l'app se bloquerait ELLE-MÊME
      dès que `expoConfig` est indisponible. Version inconnue = on ne bloque
      pas, c'est le même principe d'échec ouvert que dans miseAJour.ts.

      Vient du manifeste, donc en théorie modifiable par une mise à jour
      OTA — mais `runtimeVersion: { policy: 'appVersion' }` fait que changer
      `version` change la branche de mise à jour : les deux restent alignés,
      et il n'y a pas besoin d'expo-application pour lire la version native. */
  version: Constants.expoConfig?.version ?? null,
};

export const estProd = env.variante === 'production';
