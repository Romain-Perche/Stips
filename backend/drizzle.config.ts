import { defineConfig } from 'drizzle-kit'

// `drizzle-kit generate` lit le schéma et écrit une migration dans ./drizzle,
// sans base. `migrate` et `push` ont besoin de DATABASE_URL — à ne lancer que
// sur une base locale jetable, jamais sur une base qui contient des données
// (AGENTS.md § ce que Claude ne fait pas).
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  // Les clés TS sont en camelCase, les colonnes en snake_case. Le client
  // Drizzle doit être créé avec le même `casing`.
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
