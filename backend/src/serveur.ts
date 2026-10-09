import Fastify from 'fastify'
import cookie from '@fastify/cookie'
import { ZodError, z } from 'zod/v4'
// version.ts et non l'index : l'index de core importe sans extension, ce que
// les bundlers acceptent et que la résolution de Node (nodenext) refuse.
import type { ConfigDistante } from '@stips/core/src/version.ts'
import { env } from './env.ts'
import { routesAuth } from './routes/auth.ts'
import { routesParrainages } from './routes/parrainages.ts'

/** Réponse de `GET /config`. Remonter `versionMinimale` bloque pour de bon
    tous les binaires plus anciens : ça ne se fait qu'à la main, en suivant
    mobile/RELEASE.md § verrou. `0.0.0` ne bloque personne. */
const config: ConfigDistante = { versionMinimale: '0.0.0' }

const app = Fastify({ logger: true })

// Le site et l'API sont servis sous la même origine (frontend/vercel.json
// réécrit /api/* vers ce serveur ; vite.config.ts fait pareil en local) :
// pas de CORS à ouvrir, et le cookie est un cookie de première partie.
await app.register(cookie, { secret: env.secret })

// Un corps qui ne respecte pas son schéma est un 400 avec le détail : les
// pages affichent `message`, le détail sert à déboguer.
app.setErrorHandler((erreur, _request, reply) => {
  if (erreur instanceof ZodError) {
    return reply.code(400).send({ message: 'Formulaire incomplet ou invalide.', detail: z.prettifyError(erreur) })
  }
  // Les erreurs de Fastify lui-même (JSON illisible, corps vide, 404) ont
  // déjà leur code : on le garde, un 500 cacherait une faute du client.
  const statut = typeof erreur === 'object' && erreur && 'statusCode' in erreur ? Number(erreur.statusCode) : 0
  if (statut && statut < 500) {
    return reply.code(statut).send({ message: 'Requête invalide.', detail: erreur instanceof Error ? erreur.message : '' })
  }
  app.log.error(erreur)
  return reply.code(500).send({ message: 'Erreur côté serveur, réessaie dans un instant.' })
})

// À la racine, jamais sous /v1 : sinon /v1 ne pourrait jamais s'éteindre
// (voir backend/README.md § versionner l'API).
app.get('/config', async () => config)

await app.register(routesAuth)
await app.register(routesParrainages)

// 0.0.0.0 et non localhost (le défaut de Fastify), invisible depuis
// l'extérieur du conteneur ; le port est imposé par Railway.
await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) })
