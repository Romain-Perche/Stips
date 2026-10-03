// Les dix-huit tables de Stips. La carte est dans ../../SCHEMA.md, le raisonnement
// dans ../../README.md § le schéma. Ce fichier est la source de vérité : SCHEMA.md
// se corrige dans la même PR.
//
// Deux règles qui gouvernent tout ce qui suit :
// - les contraintes vivent dans la base (clés composites, CHECK, ON DELETE), pas dans
//   le code qui les oublierait ;
// - rien de dérivable ne se stocke, sauf trois clés de tri : fil.score, fil.rang et
//   conversation.dernier_message_at.
//
// Les noms de colonnes sont dérivés des clés TS par `casing: 'snake_case'`
// (drizzle.config.ts) : `createdAt` devient `created_at`. Le client Drizzle devra
// être créé avec le même `casing`, sinon les requêtes cherchent `createdAt`.

import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  pgView,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// ── Énumérations ─────────────────────────────────────────────────────────────
// Des valeurs fermées et stables. Ce qui bougera (la liste des forums) est une
// table, pas une énumération : ajouter une valeur ici est une migration.

export const role = pgEnum('role', ['membre', 'pro'])

export const qualificatif = pgEnum('qualificatif', [
  'autonomie',
  'rigueur',
  'curiosite',
  'fiabilite',
  'methode',
  'tenacite',
  'creativite',
  'initiative',
])

// Nommés par ce qu'ils attendent. `pro_invite` démarre à `attente_acceptation`.
export const statutParrainage = pgEnum('statut_parrainage', [
  'attente_pro',
  'attente_validation',
  'attente_acceptation',
  'acceptee',
  'refusee',
  'expiree',
])

export const origineParrainage = pgEnum('origine_parrainage', ['stagiaire_demande', 'pro_invite'])

export const cibleSignalement = pgEnum('cible_signalement', ['fil', 'reponse', 'message', 'parrainage'])

// ── Colonnes récurrentes ─────────────────────────────────────────────────────

const id = () => uuid().primaryKey().defaultRandom()
const horodatage = () => timestamp({ withTimezone: true })
const creeLe = () => horodatage().notNull().defaultNow()

// ── 1. Identité, parrainage, cotisation ──────────────────────────────────────

export const personne = pgTable(
  'personne',
  {
    id: id(),
    nom: text().notNull(),
    prenom: text().notNull(),
    role: role().notNull(),
    // Orthogonal au rôle : qui valide les demandes est aussi un membre ou un pro.
    admin: boolean().notNull().default(false),
    // « parrain » ou « marraine », choisi par la personne. Remplace une colonne sexe.
    accord: text(),
    // Partie 1 du profil, visible par les pairs.
    description: text().notNull().default(''),
    // Partie 2, visible des pros seulement, et seulement si en_recherche.
    enRecherche: boolean().notNull().default(false),
    cherche: text(),
    dispo: text(),
    // Clé d'objet dans le bucket privé, jamais une URL : l'API signe à la lecture.
    cvChemin: text(),
    // Compte Supabase Auth, null tant que la personne n'a pas de compte.
    authUserId: uuid().unique(),
    // Un cus_… identifie la personne à vie, pas une période payée : ici et non
    // sur abonnement, où il se recopierait à chaque renouvellement.
    stripeCustomerId: text().unique(),
    createdAt: creeLe(),
  },
  (t) => [
    // Le deck de recherche filtre sur role = 'membre' AND en_recherche.
    index('personne_deck_idx').on(t.role, t.enRecherche),
  ],
)

export const entreprise = pgTable('entreprise', {
  id: id(),
  // Table curée : « BNP », « BNP Paribas » et « BNP PARIBAS SA » ne doivent pas
  // devenir trois entreprises. La saisie libre passe par une file de modération.
  nom: text().notNull().unique(),
  secteur: text().notNull(),
  // Domaine servant à vérifier l'appartenance d'un pro.
  domaineEmail: text().unique(),
})

export const experience = pgTable(
  'experience',
  {
    id: id(),
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    entrepriseId: uuid()
      .notNull()
      .references(() => entreprise.id, { onDelete: 'restrict' }),
    intitule: text().notNull(),
    debut: date().notNull(),
    // Null si en cours.
    fin: date(),
  },
  (t) => [
    index('experience_personne_idx').on(t.personneId),
    index('experience_entreprise_idx').on(t.entrepriseId),
    check('experience_fin_apres_debut', sql`${t.fin} IS NULL OR ${t.fin} >= ${t.debut}`),
  ],
)

// La reco. Seule table qui mélange clés étrangères et identités en texte : aux
// premières étapes, ni le filleul ni parfois le parrain n'ont de compte.
export const parrainage = pgTable(
  'parrainage',
  {
    id: id(),
    // Un pro qui supprime son compte : ses recos restent, parrain_nom les attribue
    // déjà sans lui (règle 5.1.1(v), vue du côté du parrain).
    parrainId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    // Un membre qui supprime son compte : sa reco part avec lui, elle ne parle que
    // de lui. Un membre en accumule une par stage ; la carte montre la plus récente.
    filleulId: uuid().references(() => personne.id, { onDelete: 'cascade' }),
    // Jamais effacés : une reco est l'instantané d'une déclaration signée.
    parrainNom: text().notNull(),
    parrainEmail: text().notNull(),
    filleulNom: text().notNull(),
    filleulEmail: text().notNull(),
    // Null tant que le pro n'a pas rempli le formulaire (attente_pro).
    qualificatif: qualificatif(),
    commentaire: text(),
    // Pas de valeur par défaut : l'état de départ dépend de l'origine.
    statut: statutParrainage().notNull(),
    origine: origineParrainage().notNull(),
    expireLe: horodatage().notNull(),
    createdAt: creeLe(),
  },
  (t) => [
    index('parrainage_filleul_idx').on(t.filleulId, t.createdAt.desc()),
    index('parrainage_parrain_idx').on(t.parrainId),
    check(
      'parrainage_rempli_si_avance',
      sql`${t.statut} = 'attente_pro' OR (${t.qualificatif} IS NOT NULL AND ${t.commentaire} IS NOT NULL)`,
    ),
  ],
)

// Les 100 €/an : une ligne par période payée. L'accès se teste en SQL,
// `current_date BETWEEN debut AND fin`, sans rappeler Stripe.
export const abonnement = pgTable(
  'abonnement',
  {
    id: id(),
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    debut: date().notNull(),
    fin: date().notNull(),
  },
  (t) => [
    index('abonnement_personne_idx').on(t.personneId, t.fin),
    check('abonnement_fin_apres_debut', sql`${t.fin} > ${t.debut}`),
  ],
)

// ── 2. Forum ─────────────────────────────────────────────────────────────────

// Une table, pas une énumération : à 10 000 membres la liste bougera, et une
// table s'étend par un INSERT.
export const forum = pgTable('forum', {
  id: id(),
  // « stips/reco-cv »
  slug: text().notNull().unique(),
  libelle: text().notNull(),
})

// τ du tri « Populaire » : le temps au bout duquel un fil doit avoir dix fois
// plus de votes pour tenir sa place. 14 jours — volontairement long tant que le
// trafic est faible. C'est la seule molette, et comme elle est gravée dans une
// colonne générée, la changer est une migration (drizzle-kit generate).
export const TAU_POPULAIRE_S = 14 * 24 * 3600

export const fil = pgTable(
  'fil',
  {
    id: id(),
    forumId: uuid()
      .notNull()
      .references(() => forum.id, { onDelete: 'restrict' }),
    // Auteur supprimé : le fil reste, avec ses réponses des autres.
    auteurId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    titre: text().notNull(),
    corps: text().notNull(),
    // Cache de tri : SUM(vote.valeur), recalculable. La vérité est dans `vote`.
    score: integer().notNull().default(0),
    // Formule Reddit : rien ne décroît, le terme temporel monte pour les fils
    // récents, donc rang ne dépend que de sa propre ligne et ne change qu'au vote.
    // Le fuseau est écrit dans l'expression : extract(epoch FROM timestamptz) est
    // STABLE (il lit le TimeZone de session), et une colonne générée exige une
    // expression IMMUTABLE. `AT TIME ZONE 'UTC'` supprime la dépendance.
    rang: doublePrecision().generatedAlwaysAs(
      sql`sign(score) * log(greatest(abs(score), 1)) + extract(epoch FROM (created_at AT TIME ZONE 'UTC')) / ${sql.raw(String(TAU_POPULAIRE_S))}`,
    ),
    createdAt: creeLe(),
  },
  (t) => [
    // « Populaire » et « Récent » : les deux tris de l'écran, chacun sur son index.
    index('fil_populaire_idx').on(t.forumId, t.rang.desc()),
    index('fil_recent_idx').on(t.forumId, t.createdAt.desc()),
    index('fil_auteur_idx').on(t.auteurId),
  ],
)

export const reponse = pgTable(
  'reponse',
  {
    id: id(),
    filId: uuid()
      .notNull()
      .references(() => fil.id, { onDelete: 'cascade' }),
    auteurId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    corps: text().notNull(),
    createdAt: creeLe(),
  },
  (t) => [
    index('reponse_fil_idx').on(t.filId, t.createdAt),
    index('reponse_auteur_idx').on(t.auteurId),
  ],
)

// Un vote est une ligne : la clé composite interdit le double vote et permet de
// le retirer. Un compteur seul ne saurait faire ni l'un ni l'autre.
export const vote = pgTable(
  'vote',
  {
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    filId: uuid()
      .notNull()
      .references(() => fil.id, { onDelete: 'cascade' }),
    valeur: integer().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.personneId, t.filId] }),
    index('vote_fil_idx').on(t.filId),
    check('vote_valeur', sql`${t.valeur} IN (-1, 1)`),
  ],
)

export const abonnementForum = pgTable(
  'abonnement_forum',
  {
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    forumId: uuid()
      .notNull()
      .references(() => forum.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.personneId, t.forumId] }), index('abonnement_forum_forum_idx').on(t.forumId)],
)

// ── 3. Recrutement ───────────────────────────────────────────────────────────

// Une offre appartient à un pro ET à une entreprise : le pro peut changer
// d'employeur, ses anciennes offres ne suivent pas.
export const offre = pgTable(
  'offre',
  {
    id: id(),
    proId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    entrepriseId: uuid()
      .notNull()
      .references(() => entreprise.id, { onDelete: 'restrict' }),
    intitule: text().notNull(),
    lieu: text().notNull(),
    dureeMois: integer().notNull(),
    publieeLe: horodatage().notNull().defaultNow(),
    clotureeLe: horodatage(),
  },
  (t) => [
    index('offre_pro_idx').on(t.proId),
    index('offre_entreprise_idx').on(t.entrepriseId),
    check('offre_duree_mois', sql`${t.dureeMois} > 0`),
  ],
)

export const candidature = pgTable(
  'candidature',
  {
    offreId: uuid()
      .notNull()
      .references(() => offre.id, { onDelete: 'cascade' }),
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    createdAt: creeLe(),
    // Date de lecture par le recruteur.
    luAt: horodatage(),
  },
  (t) => [primaryKey({ columns: [t.offreId, t.personneId] }), index('candidature_personne_idx').on(t.personneId)],
)

// ── 4. Événements ────────────────────────────────────────────────────────────

export const evenement = pgTable(
  'evenement',
  {
    id: id(),
    titre: text().notNull(),
    lieu: text().notNull(),
    debut: horodatage().notNull(),
    capacite: integer().notNull(),
    ouvertureInscriptions: horodatage().notNull(),
  },
  (t) => [check('evenement_capacite', sql`${t.capacite} > 0`)],
)

// Aucun compteur d'inscrits, aucun verrou : on insère tout le monde, l'ordre
// d'arrivée fait le rang. Pas de survente possible, et une annulation promeut le
// suivant sans rien faire.
export const inscription = pgTable(
  'inscription',
  {
    evenementId: uuid()
      .notNull()
      .references(() => evenement.id, { onDelete: 'cascade' }),
    personneId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    createdAt: creeLe(),
  },
  (t) => [
    primaryKey({ columns: [t.evenementId, t.personneId] }),
    // C'est l'ordre que lit la fonction fenêtre de inscription_rang.
    index('inscription_ordre_idx').on(t.evenementId, t.createdAt),
    index('inscription_personne_idx').on(t.personneId),
  ],
)

// Le rang de liste d'attente, en SQL et dans la base — pas en JavaScript. Les
// `capacite` premiers par created_at sont inscrits, les suivants en attente.
// personne_id départage deux inscriptions au même instant.
export const inscriptionRang = pgView('inscription_rang', {
  evenementId: uuid('evenement_id').notNull(),
  personneId: uuid('personne_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  rang: integer().notNull(),
  enAttente: boolean('en_attente').notNull(),
}).as(sql`
  SELECT r.evenement_id, r.personne_id, r.created_at, r.rang, r.rang > e.capacite AS en_attente
  FROM (
    SELECT evenement_id, personne_id, created_at,
           (row_number() OVER (PARTITION BY evenement_id ORDER BY created_at, personne_id))::int AS rang
    FROM inscription
  ) r
  JOIN evenement e ON e.id = r.evenement_id
`)

// ── 5. Messagerie et modération ──────────────────────────────────────────────

// Existe pour rendre la liste des conversations indexable, sans normaliser la
// paire avec LEAST/GREATEST dans une sous-requête. La paire est ordonnée
// (a_id < b_id) et unique : une seule conversation par duo.
export const conversation = pgTable(
  'conversation',
  {
    id: id(),
    // Compte supprimé : la conversation et ses messages restent chez l'autre.
    aId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    bId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    // Cache de tri : MAX(message.created_at).
    dernierMessageAt: horodatage().notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('conversation_paire_idx').on(t.aId, t.bId),
    index('conversation_b_idx').on(t.bId),
    check('conversation_paire_ordonnee', sql`${t.aId} < ${t.bId}`),
  ],
)

export const message = pgTable(
  'message',
  {
    id: id(),
    conversationId: uuid()
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    // Null = « compte supprimé » ; le message reste chez son destinataire.
    expediteurId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    corps: text().notNull(),
    createdAt: creeLe(),
    luAt: horodatage(),
  },
  (t) => [
    index('message_conversation_idx').on(t.conversationId, t.createdAt),
    index('message_expediteur_idx').on(t.expediteurId),
  ],
)

// Le seul frein du système : tout le monde peut écrire à tout le monde. Se
// vérifie à l'insertion d'un message.
export const blocage = pgTable(
  'blocage',
  {
    bloqueurId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
    bloqueId: uuid()
      .notNull()
      .references(() => personne.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.bloqueurId, t.bloqueId] }),
    index('blocage_bloque_idx').on(t.bloqueId),
    check('blocage_pas_soi_meme', sql`${t.bloqueurId} <> ${t.bloqueId}`),
  ],
)

// cible_type = 'parrainage' est le recours d'un membre sur sa propre reco
// (art. 16 RGPD). cible_id est polymorphe : pas de clé étrangère.
export const signalement = pgTable(
  'signalement',
  {
    id: id(),
    // L'auteur peut partir, le signalement reste à traiter.
    auteurId: uuid().references(() => personne.id, { onDelete: 'set null' }),
    cibleType: cibleSignalement().notNull(),
    cibleId: uuid().notNull(),
    motif: text().notNull(),
    createdAt: creeLe(),
    traiteLe: horodatage(),
  },
  (t) => [
    // La file de modération : ce qui n'est pas traité, du plus ancien au plus récent.
    index('signalement_a_traiter_idx')
      .on(t.createdAt)
      .where(sql`${t.traiteLe} IS NULL`),
  ],
)
