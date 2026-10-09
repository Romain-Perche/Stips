// Les variables d'environnement, lues en un seul endroit et au démarrage :
// une variable absente fait tomber le serveur tout de suite, pas à la première
// requête qui en a besoin. `.env` n'est pas chargé par défaut, exprès :
// `node --env-file=.env` en local, les variables du service sur Railway.

const lire = (nom: string) => {
  const valeur = process.env[nom]
  if (!valeur) throw new Error(`${nom} manquante (voir backend/.env.example)`)
  return valeur
}

const secret = lire('SECRET')
if (secret.length < 32) throw new Error('SECRET : 32 caractères minimum (openssl rand -base64 32)')

export const env = {
  /** Signe le cookie de session et les jetons des liens de validation. */
  secret,
  /** Sans barre oblique finale : les liens des e-mails s'y accrochent. */
  siteUrl: lire('SITE_URL').replace(/\/$/, ''),
  /** Reçoit les demandes à valider, avec leurs deux liens. */
  adminEmail: lire('ADMIN_EMAIL'),
  supabaseUrl: lire('SUPABASE_URL'),
  supabaseSecretKey: lire('SUPABASE_SECRET_KEY'),
  // Facultatives : sans clé Scaleway, les e-mails du backend s'écrivent dans
  // la console au lieu de partir. Ceux de Supabase Auth (invitation, lien de
  // connexion) partent quand même : c'est Supabase qui les envoie.
  scalewaySecretKey: process.env.SCALEWAY_SECRET_KEY,
  scalewayProjectId: process.env.SCALEWAY_PROJECT_ID,
  expediteur: process.env.EXPEDITEUR ?? 'bonjour@mail.stips.club',
  production: process.env.NODE_ENV === 'production',
}
