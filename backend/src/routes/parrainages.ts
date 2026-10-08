// La machine à états du parrainage (backend/README.md § le flux d'inscription) :
//
//   stagiaire_demande ──▶ attente_pro ──▶ attente_validation ──┐
//                                                              ├──▶ attente_acceptation ──▶ acceptee
//   pro_invite ──────────────────────────────────────────────────┘
//
// Chaque route n'accepte qu'un état d'entrée et en écrit un seul : c'est ce
// qui rend chaque lien à usage unique sans rien stocker de plus.
//
// ponytail: `expiree` ne s'écrit jamais — un état d'attente dont `expire_le`
// est passé est traité comme expiré à la lecture. Un job de nettoyage le jour
// où quelqu'un veut des statistiques.

import type { FastifyInstance } from 'fastify'
import { and, eq, gt, inArray, sql } from 'drizzle-orm'
import { z } from 'zod/v4'
import { Decision, Demande, InvitationPro, Parrainage, ParrainageAdmin, RecoPro } from '@stips/api'
import { db } from '../db/client.ts'
import { parrainage, personne } from '../db/schema.ts'
import { envoyer } from '../courriel.ts'
import { env } from '../env.ts'
import { jeton, jetonValide } from '../jetons.ts'
import { inviter } from '../supabase.ts'
import { session } from '../session.ts'
import { moi, personneDe } from './auth.ts'

const JOUR_MS = 24 * 3600 * 1000
const dans = (jours: number) => new Date(Date.now() + jours * JOUR_MS)
const expire = (p: { expireLe: Date }) => p.expireLe.getTime() < Date.now()

// ponytail: `filleul_nom` et `parrain_nom` portent « Prénom Nom » en un seul
// champ (le schéma est arrêté). On coupe au premier espace pour créer la
// personne ; un prénom composé sans trait d'union se corrigera dans le profil.
const nomComplet = (prenom: string, nom: string) => `${prenom} ${nom}`
function separer(complet: string) {
  const [prenom, ...reste] = complet.split(' ')
  return { prenom, nom: reste.join(' ') || prenom }
}

const PLAFOND_INVITATIONS_PAR_MOIS = 5

/** Le `:id` d'une URL. Un id mal formé est un 404, pas une erreur Postgres. */
function idDe(params: unknown) {
  const r = z.object({ id: z.uuid() }).safeParse(params)
  return r.success ? r.data.id : null
}

const lire = (id: string) => db.query.parrainage.findFirst({ where: eq(parrainage.id, id) })

/** La forme servie au pro et à l'admin ; `expiree` est calculé, pas stocké. */
function projeter(p: NonNullable<Awaited<ReturnType<typeof lire>>>) {
  const enAttente = p.statut.startsWith('attente_')
  return {
    id: p.id,
    filleulNom: p.filleulNom,
    parrainNom: p.parrainNom,
    statut: enAttente && expire(p) ? 'expiree' : p.statut,
    qualificatif: p.qualificatif,
    commentaire: p.commentaire,
    parrainInscrit: p.parrainId !== null,
    expireLe: p.expireLe.toISOString(),
    filleulEmail: p.filleulEmail,
    parrainEmail: p.parrainEmail,
  }
}

export async function routesParrainages(app: FastifyInstance) {
  // ── 1. Le stagiaire demande ────────────────────────────────────────────
  app.post('/v1/demandes', async (request, reply) => {
    const d = Demande.parse(request.body)
    if (d.filleulEmail === d.parrainEmail) {
      return reply.code(400).send({ message: 'Ton maître de stage ne peut pas être toi.' })
    }
    // Un seul dossier ouvert par stagiaire : c'est ce qui empêche d'inonder
    // un pro de demandes, sans limite de débit à installer.
    const enCours = await db.query.parrainage.findFirst({
      where: and(
        eq(parrainage.filleulEmail, d.filleulEmail),
        inArray(parrainage.statut, ['attente_pro', 'attente_validation', 'attente_acceptation']),
        gt(parrainage.expireLe, sql`now()`),
      ),
    })
    if (enCours) return reply.code(409).send({ message: 'Une demande est déjà en cours pour cet e-mail.' })

    const [{ id }] = await db
      .insert(parrainage)
      .values({
        filleulNom: nomComplet(d.filleulPrenom, d.filleulNom),
        filleulEmail: d.filleulEmail,
        parrainNom: d.parrainNom,
        parrainEmail: d.parrainEmail,
        statut: 'attente_pro',
        origine: 'stagiaire_demande',
        expireLe: dans(14),
      })
      .returning({ id: parrainage.id })

    await envoyer(
      d.parrainEmail,
      `${d.filleulPrenom} ${d.filleulNom} te demande une recommandation`,
      `Bonjour ${d.parrainNom},

${d.filleulPrenom} ${d.filleulNom} aimerait entrer dans Stips, un club de jeunes diplômés où l'on n'entre que recommandé par son maître de stage.

Ça te prend deux minutes, sans compte ni installation : un mot pour le qualifier et une phrase ou deux.

${env.siteUrl}/parrainage/${id}

Ce lien est valable 14 jours. Si tu n'es pas la bonne personne, ignore simplement cet e-mail.

L'équipe Stips`,
    )
    return {}
  })

  // ── 2. Le pro remplit, sans compte ─────────────────────────────────────
  app.get('/v1/parrainages/:id', async (request, reply) => {
    const id = idDe(request.params)
    const p = id && (await lire(id))
    if (!p) return reply.code(404).send({ message: 'Ce lien ne mène nulle part.' })
    return Parrainage.parse(projeter(p))
  })

  app.post('/v1/parrainages/:id/reco', async (request, reply) => {
    const r = RecoPro.parse(request.body)
    const id = idDe(request.params)
    const p = id && (await lire(id))
    if (!p) return reply.code(404).send({ message: 'Ce lien ne mène nulle part.' })
    if (p.statut !== 'attente_pro') return reply.code(409).send({ message: 'Cette recommandation a déjà été envoyée.' })
    if (expire(p)) return reply.code(410).send({ message: 'Ce lien a expiré : demande à ton stagiaire de refaire une demande.' })

    await db
      .update(parrainage)
      .set({ ...r, statut: 'attente_validation', expireLe: dans(30) })
      .where(eq(parrainage.id, p.id))

    const lien = `${env.siteUrl}/parrainage/${p.id}/validation?jeton=${jeton(env.secret, 'validation', p.id)}`
    await envoyer(
      env.adminEmail,
      `À valider : ${r.parrainNom} recommande ${p.filleulNom}`,
      `${r.parrainNom} <${p.parrainEmail}> recommande ${p.filleulNom} <${p.filleulEmail}>.

${r.qualificatif} — « ${r.commentaire} »

Valider ou refuser (un seul clic compte, le premier) :
${lien}`,
    )
    return Parrainage.parse(projeter({ ...p, ...r, statut: 'attente_validation' }))
  })

  // ── 3. L'admin valide, par les deux liens de son e-mail ────────────────
  app.get('/v1/parrainages/:id/validation', async (request, reply) => {
    const id = idDe(request.params)
    const { jeton: candidat } = z.object({ jeton: z.string() }).parse(request.query)
    if (!id || !jetonValide(env.secret, 'validation', id, candidat)) {
      return reply.code(401).send({ message: 'Ce lien de validation est invalide.' })
    }
    const p = await lire(id)
    if (!p) return reply.code(404).send({ message: 'Ce lien ne mène nulle part.' })
    return ParrainageAdmin.parse(projeter(p))
  })

  app.post('/v1/parrainages/:id/validation', async (request, reply) => {
    const { jeton: candidat, decision } = Decision.parse(request.body)
    const id = idDe(request.params)
    if (!id || !jetonValide(env.secret, 'validation', id, candidat)) {
      return reply.code(401).send({ message: 'Ce lien de validation est invalide.' })
    }
    const p = await lire(id)
    if (!p) return reply.code(404).send({ message: 'Ce lien ne mène nulle part.' })
    if (p.statut !== 'attente_validation') return reply.code(409).send({ message: 'Cette demande a déjà été traitée.' })

    if (decision === 'refuser') {
      await db.update(parrainage).set({ statut: 'refusee' }).where(eq(parrainage.id, p.id))
      return {}
    }
    await db
      .update(parrainage)
      .set({ statut: 'attente_acceptation', expireLe: dans(7) })
      .where(eq(parrainage.id, p.id))
    // L'invitation est le lien magique : c'est Supabase qui l'envoie.
    await inviter(p.filleulEmail, { prenom: separer(p.filleulNom).prenom, parrain: p.parrainNom })
    // Le service est rendu : c'est maintenant, et pas avant, qu'on propose
    // un compte au pro (Description projet.md § entrée dans Stips).
    await envoyer(
      p.parrainEmail,
      `Ta recommandation de ${p.filleulNom} est validée`,
      `Merci ${p.parrainNom} — ${separer(p.filleulNom).prenom} vient de recevoir son invitation.

Si tu veux rejoindre Stips comme pro (c'est gratuit : voir les profils en recherche de stage, publier des offres, inviter tes prochains stagiaires), tu peux créer ton compte ici :

${env.siteUrl}/parrainage/${p.id}

L'équipe Stips`,
    )
    return {}
  })

  // ── 3 bis. Le pro crée son compte, après coup ──────────────────────────
  app.post('/v1/parrainages/:id/compte-pro', async (request, reply) => {
    const id = idDe(request.params)
    const p = id && (await lire(id))
    if (!p) return reply.code(404).send({ message: 'Ce lien ne mène nulle part.' })
    if (p.statut !== 'attente_acceptation' && p.statut !== 'acceptee') {
      return reply.code(409).send({ message: "Ta recommandation doit d'abord être validée." })
    }
    if (p.parrainId) return reply.code(409).send({ message: 'Ton compte existe déjà : connecte-toi.' })

    // Un compte Supabase qui existe déjà reçoit un lien de connexion, et la
    // personne qui va avec a été créée à ce moment-là : rien à ajouter.
    const utilisateur = await inviter(p.parrainEmail, { prenom: separer(p.parrainNom).prenom })
    if (!utilisateur) return reply.code(409).send({ message: 'Un compte existe déjà pour cet e-mail : un lien de connexion vient de partir.' })

    await db.transaction(async (tx) => {
      const [pro] = await tx
        .insert(personne)
        .values({ ...separer(p.parrainNom), role: 'pro', authUserId: utilisateur.id })
        .returning({ id: personne.id })
      await tx.update(parrainage).set({ parrainId: pro.id }).where(eq(parrainage.id, p.id))
    })
    return {}
  })

  // ── Second chemin : un pro connecté invite, sans validation ────────────
  app.post('/v1/invitations', async (request, reply) => {
    const s = session(request)
    const pro = s && (await personneDe(s))
    if (!s || !pro || pro.role !== 'pro') return reply.code(403).send({ message: 'Réservé aux pros connectés.' })
    const i = InvitationPro.parse(request.body)

    // Le seul garde-fou de la chaîne de confiance : un plafond, pas une étape.
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(parrainage)
      .where(and(eq(parrainage.parrainId, pro.id), gt(parrainage.createdAt, sql`now() - interval '30 days'`)))
    if (n >= PLAFOND_INVITATIONS_PAR_MOIS) {
      return reply.code(429).send({ message: `${PLAFOND_INVITATIONS_PAR_MOIS} invitations par mois, pas plus.` })
    }

    await db.insert(parrainage).values({
      parrainId: pro.id,
      parrainNom: nomComplet(pro.prenom, pro.nom),
      parrainEmail: s.email,
      filleulNom: nomComplet(i.filleulPrenom, i.filleulNom),
      filleulEmail: i.filleulEmail,
      qualificatif: i.qualificatif,
      commentaire: i.commentaire,
      statut: 'attente_acceptation',
      origine: 'pro_invite',
      expireLe: dans(7),
    })
    await inviter(i.filleulEmail, { prenom: i.filleulPrenom, parrain: nomComplet(pro.prenom, pro.nom) })
    return {}
  })

  // ── 4. Le stagiaire accepte : le membre existe ─────────────────────────
  app.post('/v1/invitation/accepter', async (request, reply) => {
    const s = session(request)
    if (!s) return reply.code(401).send({ message: 'Connecte-toi.' })
    const p = await db.query.parrainage.findFirst({
      where: and(
        eq(parrainage.filleulEmail, s.email),
        eq(parrainage.statut, 'attente_acceptation'),
        gt(parrainage.expireLe, sql`now()`),
      ),
    })
    if (!p) return reply.code(410).send({ message: 'Aucune invitation en cours pour cet e-mail.' })

    await db.transaction(async (tx) => {
      // Deuxième reco d'un membre existant : on la rattache, sans le recréer.
      let filleul = await tx.query.personne.findFirst({ where: eq(personne.authUserId, s.sub) })
      if (!filleul) {
        ;[filleul] = await tx
          .insert(personne)
          .values({ ...separer(p.filleulNom), role: 'membre', authUserId: s.sub })
          .returning()
      }
      await tx
        .update(parrainage)
        .set({ filleulId: filleul.id, statut: 'acceptee' })
        .where(eq(parrainage.id, p.id))
    })
    return moi(s)
  })
}
