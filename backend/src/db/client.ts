import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.ts'

// Sans URL, postgres() se rabat sur localhost en silence : on préfère tomber ici.
const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL manquante (voir backend/.env.example)')

// Même `casing` que drizzle.config.ts, sinon les requêtes cherchent `createdAt`
// au lieu de `created_at`.
export const db = drizzle(postgres(url), { schema, casing: 'snake_case' })
