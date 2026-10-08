// Les e-mails que le backend envoie lui-même — demande au pro, notification
// à l'admin, reco validée — par l'API HTTP de Scaleway TEM, avec sa propre
// clé IAM : jamais celle de `supabase-auth`, une clé par usage, révocable
// seule (TODO.md, tâche 11). Les e-mails d'auth (invitation, connexion) ne
// passent pas ici : Supabase les envoie.
//
// Texte brut, en français, et des liens vers stips.club : c'est ce qui a
// sorti le premier envoi de test du dossier spam de Gmail.

import { env } from './env.ts'

export async function envoyer(a: string, sujet: string, texte: string) {
  if (!env.scalewaySecretKey || !env.scalewayProjectId) {
    console.log(`\n── e-mail non envoyé (SCALEWAY_SECRET_KEY absente) ──\nÀ : ${a}\nObjet : ${sujet}\n\n${texte}\n`)
    return
  }
  const reponse = await fetch('https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails', {
    method: 'POST',
    headers: { 'x-auth-token': env.scalewaySecretKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: { name: 'Stips', email: env.expediteur },
      to: [{ email: a }],
      subject: sujet,
      text: texte,
      project_id: env.scalewayProjectId,
    }),
  })
  if (!reponse.ok) throw new Error(`Scaleway TEM : HTTP ${reponse.status} ${await reponse.text()}`)
}
