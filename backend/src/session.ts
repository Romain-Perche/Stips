// La session, une fois le lien magique vérifié : un cookie signé qui porte
// l'utilisateur Supabase (son id, son e-mail). Signé, pas chiffré — il n'y a
// rien à cacher dedans, seulement à rendre infalsifiable. HttpOnly : le JS
// de la page ne le lit pas, il ne fait que des requêtes qui l'emportent.
//
// ponytail: pas de révocation — un cookie reste valable 30 jours même si la
// personne supprime son compte ; une table de sessions le jour où ça compte.

import '@fastify/cookie'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod/v4'
import { env } from './env.ts'

const COOKIE = 'stips_session'
const TRENTE_JOURS_S = 30 * 24 * 3600

const Session = z.object({ sub: z.uuid(), email: z.email() })
export type Session = z.infer<typeof Session>

export function ouvrirSession(reply: FastifyReply, s: Session) {
  reply.setCookie(COOKIE, JSON.stringify(s), {
    signed: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: env.production,
    path: '/',
    maxAge: TRENTE_JOURS_S,
  })
}

export const fermerSession = (reply: FastifyReply) => reply.clearCookie(COOKIE, { path: '/' })

export function session(request: FastifyRequest): Session | null {
  const brut = request.cookies[COOKIE]
  if (!brut) return null
  const { valid, value } = request.unsignCookie(brut)
  if (!valid || !value) return null
  try {
    return Session.parse(JSON.parse(value))
  } catch {
    return null
  }
}
