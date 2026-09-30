import Fastify from 'fastify';
// version.ts et non l'index : l'index de core importe sans extension, ce que
// les bundlers acceptent et que la résolution de Node (nodenext) refuse.
import type { ConfigDistante } from '@stips/core/src/version.ts';

/** Réponse de `GET /config`. Remonter `versionMinimale` bloque pour de bon
    tous les binaires plus anciens : ça ne se fait qu'à la main, en suivant
    mobile/RELEASE.md § verrou. `0.0.0` ne bloque personne. */
const config: ConfigDistante = { versionMinimale: '0.0.0' };

const app = Fastify({ logger: true });

// À la racine, jamais sous /v1 : sinon /v1 ne pourrait jamais s'éteindre
// (voir backend/README.md § versionner l'API).
app.get('/config', async () => config);

// 0.0.0.0 et non localhost (le défaut de Fastify), invisible depuis
// l'extérieur du conteneur ; le port est imposé par Railway.
await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
