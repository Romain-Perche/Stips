// Les deux liens de l'e-mail à l'admin (valider / refuser) portent un jeton :
// un HMAC de l'identifiant, pas une colonne. Sans état, donc rien à stocker
// ni à nettoyer ; inforgeable sans SECRET ; et à usage unique parce que la
// machine à états n'accepte une décision qu'en `attente_validation`.
//
// Ce n'est PAS le lien magique de connexion, qui reste celui de Supabase
// (backend/README.md § auth) : ici le jeton n'ouvre aucune session, il
// autorise une décision sur une seule ligne.

import { createHmac, timingSafeEqual } from 'node:crypto'

export const jeton = (secret: string, usage: string, id: string) =>
  createHmac('sha256', secret).update(`${usage}:${id}`).digest('base64url')

export function jetonValide(secret: string, usage: string, id: string, candidat: unknown) {
  if (typeof candidat !== 'string') return false
  const attendu = Buffer.from(jeton(secret, usage, id))
  const recu = Buffer.from(candidat)
  return attendu.length === recu.length && timingSafeEqual(attendu, recu)
}
