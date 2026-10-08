/* ══════════════════════════════════════════════════════════════════════
   API — ce qui passe sur le réseau entre le backend et les deux apps.

   Une seule déclaration par forme de réponse : le schéma zod, et le type TS
   qu'on en infère. Le backend passe chaque réponse par son schéma avant de
   l'envoyer, les apps la repassent par le même avant de la croire.

   Ce ne sont PAS les types de ligne Drizzle, et ça ne doit jamais le
   devenir : Drizzle décrit des tables, ce fichier décrit un contrat qui doit
   survivre à un renommage de colonne. Et le contrat est additif — on ajoute
   un champ, on n'en retire pas, on n'en change ni le type ni le sens (voir
   backend/README.md § versionner l'API).

   Dates : chaînes ISO 8601, jamais de phrase. Le serveur renvoie des nombres
   et des dates, les apps écrivent les phrases (§ DATA décrit une maquette).
   ══════════════════════════════════════════════════════════════════════ */

import { z } from 'zod/v4';

/** Les codes de `qualificatif` en base, pas les mots affichés : « Curiosité »
    s'écrit côté app, le fil transporte `curiosite`. */
export const Qualificatif = z.enum([
  'autonomie',
  'rigueur',
  'curiosite',
  'fiabilite',
  'methode',
  'tenacite',
  'creativite',
  'initiative',
]);
export type Qualificatif = z.infer<typeof Qualificatif>;

/* ── Deux projections d'une même personne ───────────────────────────────
   Le risque de fuite principal du produit : une route d'annuaire qui
   renverrait PersonneRecrutement, et les recos seraient lues par des pairs.

   Ce qui l'empêche : `z.object` RETIRE les clés qu'il ne déclare pas. Une
   route d'annuaire fait `PersonneAnnuaire.parse(ligne)` avant de répondre,
   et même une ligne complète (`select *`) ressort réduite à la partie 1.
   Ne jamais remplacer par `z.looseObject` ou `.passthrough()` ici. */

/** Partie 1 du profil : ce que voit n'importe quel membre (onglet Recherche). */
export const PersonneAnnuaire = z.object({
  id: z.uuid(),
  prenom: z.string(),
  nom: z.string(),
  role: z.enum(['membre', 'pro']),
  /** « parrain » ou « marraine », choisi par la personne ; null → forme neutre. */
  accord: z.string().nullable(),
  description: z.string(),
});
export type PersonneAnnuaire = z.infer<typeof PersonneAnnuaire>;

/** Une reco telle qu'un pro la lit. Le nom du parrain est l'instantané signé,
    pas une jointure : il reste lisible si le parrain a supprimé son compte. */
export const Reco = z.object({
  qualificatif: Qualificatif,
  commentaire: z.string(),
  parrainNom: z.string(),
  creeLe: z.iso.datetime({ offset: true }),
});
export type Reco = z.infer<typeof Reco>;

/** Partie 1 + partie 2 + recos + CV : réservé aux pros, et seulement pour
    un membre en recherche (onglet Offres). Jamais servi par une route
    d'annuaire. */
export const PersonneRecrutement = PersonneAnnuaire.extend({
  cherche: z.string().nullable(),
  dispo: z.string().nullable(),
  /** URL signée à la lecture, donc périssable : ne pas la mettre en cache. */
  cvUrl: z.url().nullable(),
  /** La plus récente en premier : c'est elle que montre la carte. */
  recos: z.array(Reco),
});
export type PersonneRecrutement = z.infer<typeof PersonneRecrutement>;

/* ── Le flux d'inscription ──────────────────────────────────────────────
   Une seule table `parrainage`, une machine à états (backend/README.md
   § le flux d'inscription). Les corps de requête sont déclarés ici aussi :
   le serveur les `parse` avant de les croire, les pages les composent. */

export const StatutParrainage = z.enum([
  'attente_pro',
  'attente_validation',
  'attente_acceptation',
  'acceptee',
  'refusee',
  'expiree',
]);
export type StatutParrainage = z.infer<typeof StatutParrainage>;

const nom = z.string().trim().min(1).max(80);
// Trim et minuscules AVANT le test de format : `z.email().trim()` validerait
// « a@b.fr  » avant de retirer l'espace, et le refuserait.
const email = z.string().trim().toLowerCase().pipe(z.email());

/** Le stagiaire demande : son identité, et celle de son maître de stage. */
export const Demande = z.object({
  filleulPrenom: nom,
  filleulNom: nom,
  filleulEmail: email,
  parrainNom: nom,
  parrainEmail: email,
});
export type Demande = z.infer<typeof Demande>;

/** Un pro connecté invite : il signe la reco tout de suite, pas de validation. */
export const InvitationPro = z.object({
  filleulPrenom: nom,
  filleulNom: nom,
  filleulEmail: email,
  qualificatif: Qualificatif,
  commentaire: z.string().trim().min(20).max(600),
});
export type InvitationPro = z.infer<typeof InvitationPro>;

/** Ce que le pro remplit sur la page web, sans compte. */
export const RecoPro = z.object({
  parrainNom: nom,
  qualificatif: Qualificatif,
  commentaire: z.string().trim().min(20).max(600),
});
export type RecoPro = z.infer<typeof RecoPro>;

/** La demande telle que la voient le pro (sa page) et l'admin (validation).
    Pas d'e-mails : la page du pro est joignable par quiconque a le lien. */
export const Parrainage = z.object({
  id: z.uuid(),
  filleulNom: z.string(),
  parrainNom: z.string(),
  statut: StatutParrainage,
  qualificatif: Qualificatif.nullable(),
  commentaire: z.string().nullable(),
  /** Le pro a déjà un compte : la page ne propose plus d'en créer un. */
  parrainInscrit: z.boolean(),
  expireLe: z.iso.datetime({ offset: true }),
});
export type Parrainage = z.infer<typeof Parrainage>;

/** L'admin voit en plus les deux e-mails : le domaine du pro est son premier
    indice pour juger une demande. Jamais servi sans le jeton de validation. */
export const ParrainageAdmin = Parrainage.extend({
  filleulEmail: z.email(),
  parrainEmail: z.email(),
});
export type ParrainageAdmin = z.infer<typeof ParrainageAdmin>;

export const Decision = z.object({
  jeton: z.string().min(1),
  decision: z.enum(['valider', 'refuser']),
});
export type Decision = z.infer<typeof Decision>;

/** L'invitation en attente pour la personne connectée : ce que montre
    l'écran d'entrée avant la création du membre. */
export const InvitationRecue = z.object({
  filleulPrenom: z.string(),
  parrainNom: z.string(),
  qualificatif: Qualificatif,
  commentaire: z.string(),
  creeLe: z.iso.datetime({ offset: true }),
  expireLe: z.iso.datetime({ offset: true }),
});
export type InvitationRecue = z.infer<typeof InvitationRecue>;

/** `GET /v1/moi` : qui est connecté. `personne` est null tant que
    l'invitation n'est pas acceptée ; `invitation` est null une fois membre. */
export const Moi = z.object({
  email: z.email(),
  personne: PersonneAnnuaire.extend({ admin: z.boolean() }).nullable(),
  invitation: InvitationRecue.nullable(),
});
export type Moi = z.infer<typeof Moi>;

export const Vide = z.object({});

/* ── Client HTTP ──────────────────────────────────────────────────────── */

/** Réponse non-2xx, ou corps qui ne respecte pas le schéma (`statut` 0 : le
    serveur a répondu 200, mais pas ce qu'il avait promis). Un 426 veut dire
    « binaire trop vieux » : à router vers l'écran de mise à jour. */
export class ErreurApi extends Error {
  statut: number;
  constructor(statut: number, message: string) {
    super(message);
    this.name = 'ErreurApi';
    this.statut = statut;
  }
}

/** `racine` est `apiUrl`, sans `/v1` : la version appartient au chemin, pas
    au binaire. `fetch` est injectable pour les tests. */
export function creerClient(racine: string, fetcher: typeof fetch = fetch) {
  async function appeler<S extends z.ZodType>(chemin: string, schema: S, init: RequestInit): Promise<z.infer<S>> {
    const reponse = await fetcher(`${racine}${chemin}`, init);
    if (!reponse.ok) {
      // Le serveur met une phrase en français dans `message` : c'est elle
      // que la page affiche, pas le code HTTP.
      const corps = z.object({ message: z.string() }).safeParse(await reponse.json().catch(() => null));
      throw new ErreurApi(reponse.status, corps.success ? corps.data.message : `${chemin} : HTTP ${reponse.status}`);
    }
    const resultat = schema.safeParse(await reponse.json());
    if (!resultat.success) {
      throw new ErreurApi(0, `${chemin} : réponse hors contrat\n${z.prettifyError(resultat.error)}`);
    }
    return resultat.data;
  }
  return {
    lire<S extends z.ZodType>(chemin: string, schema: S) {
      return appeler(chemin, schema, { headers: { accept: 'application/json' } });
    },
    ecrire<S extends z.ZodType>(chemin: string, corps: unknown, schema: S) {
      return appeler(chemin, schema, {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify(corps),
      });
    },
  };
}
