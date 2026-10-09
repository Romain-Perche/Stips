// Connexion par lien magique, et « qui suis-je ». Le lien vient de Supabase
// (backend/README.md § auth) : ici on l'échange contre un cookie, on en
// demande un nouveau, ou on ferme la session.

import type { FastifyInstance } from 'fastify'
import { and, desc, eq, gt, sql } from 'drizzle-orm'
import { z } from 'zod/v4'
import { Moi } from '@stips/api'
import { db } from '../db/client.ts'
import { parrainage, personne } from '../db/schema.ts'
import { clientAuthJetable, lienMagique } from '../supabase.ts'
import { fermerSession, ouvrirSession, session, type Session } from '../session.ts'

/** La personne liée à la session, ou null tant que l'invitation n'est pas
    acceptée. */
export const personneDe = (s: Session) =>
  db.query.personne.findFirst({ where: eq(personne.authUserId, s.sub) })

/** `GET /v1/moi`. `invitation` est indépendante de `personne` : un membre
    reçoit une reco par stage, la deuxième arrive alors qu'il existe déjà. */
export async function moi(s: Session): Promise<Moi> {
  const p = await personneDe(s)
  const inv = await db.query.parrainage.findFirst({
    where: and(
      eq(parrainage.filleulEmail, s.email),
      eq(parrainage.statut, 'attente_acceptation'),
      gt(parrainage.expireLe, sql`now()`),
    ),
    orderBy: desc(parrainage.createdAt),
  })
  return Moi.parse({
    email: s.email,
    personne: p,
    invitation: inv && {
      filleulPrenom: inv.filleulNom.split(' ')[0],
      parrainNom: inv.parrainNom,
      qualificatif: inv.qualificatif,
      commentaire: inv.commentaire,
      creeLe: inv.createdAt.toISOString(),
      expireLe: inv.expireLe.toISOString(),
    },
  })
}

export async function routesAuth(app: FastifyInstance) {
  // La page d'atterrissage du lien donne le token_hash de l'URL ; Supabase
  // le vérifie (entropie, usage unique, expiration : rien de tout ça ici).
  app.post('/v1/auth/verifier', async (request, reply) => {
    const { tokenHash } = z.object({ tokenHash: z.string().min(1) }).parse(request.body)
    const { data, error } = await clientAuthJetable().auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
    if (error || !data.user?.email) {
      return reply.code(401).send({ message: 'Ce lien ne fonctionne plus. Demande un nouveau lien de connexion.' })
    }
    const s = { sub: data.user.id, email: data.user.email }
    ouvrirSession(reply, s)
    return moi(s)
  })

  // Toujours 200 : répondre « inconnu » dirait qui est membre.
  app.post('/v1/auth/lien', async (request) => {
    const { email } = z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) }).parse(request.body)
    const { error } = await lienMagique(email)
    if (error) request.log.warn({ email, erreur: error.message }, 'lien magique non envoyé')
    return {}
  })

  app.post('/v1/auth/deconnexion', async (_request, reply) => {
    fermerSession(reply)
    return {}
  })

  app.get('/v1/moi', async (request, reply) => {
    const s = session(request)
    if (!s) return reply.code(401).send({ message: 'Connecte-toi.' })
    // Le site appelle /v1/moi à chaque ouverture : on y repart pour 30 jours,
    // pour qu'un membre actif ne soit jamais déconnecté.
    ouvrirSession(reply, s)
    return moi(s)
  })
}
