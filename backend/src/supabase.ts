// Supabase Auth, et rien d'autre de Supabase : la base se lit par Drizzle
// (db/client.ts), jamais par ce client. La clé secrète ne quitte pas ce
// serveur (AGENTS.md § config et secrets).

import { createClient } from '@supabase/supabase-js'
import { env } from './env.ts'

// Un serveur n'a pas de session à conserver ni à rafraîchir.
const options = { auth: { persistSession: false, autoRefreshToken: false } }

export const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey, options)

/** `verifyOtp` pose la session vérifiée sur le client qui l'appelle : un
    client neuf par échange, pour que l'instance partagée reste sans
    utilisateur. */
export const clientAuthJetable = () => createClient(env.supabaseUrl, env.supabaseSecretKey, options)

/** Où le lien de l'e-mail ramène : passé à chaque envoi plutôt que lu dans
    la Site URL du dashboard, pour que le serveur local renvoie sur
    localhost et la production sur stips.club avec les mêmes gabarits.
    Doit figurer dans les Redirect URLs du projet Supabase. */
const RETOUR = `${env.siteUrl}/invitation`

/** Le gabarit « Magic Link » : connexion, ou invitation renvoyée. */
export const lienMagique = (email: string) =>
  supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: RETOUR } })

/** Envoie l'e-mail qui EST le lien magique (backend/README.md § auth). Un
    compte Supabase qui n'existe pas est créé et reçoit le gabarit
    « Invite user » ; un compte qui existe déjà (deuxième reco, invitation
    renvoyée après expiration) reçoit le gabarit « Magic Link ». Les deux
    gabarits mènent à `{{ .RedirectTo }}?token_hash=…`, voir
    backend/README.md § configurer Supabase. `data` nourrit `{{ .Data.… }}`
    dans le gabarit, et ne sert jamais à autoriser quoi que ce soit. */
export async function inviter(email: string, data: { prenom: string; parrain?: string }) {
  const invitation = await supabase.auth.admin.inviteUserByEmail(email, { data, redirectTo: RETOUR })
  if (!invitation.error) return invitation.data.user
  const lien = await lienMagique(email)
  if (lien.error) throw new Error(`Supabase Auth : ${invitation.error.message} / ${lien.error.message}`)
  return null
}
