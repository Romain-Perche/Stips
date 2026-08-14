/* ══════════════════════════════════════════════════════════════════════
   TYPES — la forme des données, partagée entre data.ts et les écrans.
   ══════════════════════════════════════════════════════════════════════ */

export interface Experience {
  titre: string;
  duree: string;
}

export interface MoiProfile {
  nom: string;
  bio: string;
  stage: string;
  dispo: string;
  experiences: Experience[];
}

export interface Invitation {
  prenom: string;
  parrain: string;
  role: string;
  note: string;
  reco: string;
  signee: string;
  avantages: string[];
}

export interface Talent {
  id: string;
  nom: string;
  ecole: string;
  note: number;
  parrain: string;
  parrainRole: string;
  reco: string;
  cherche: string;
  dispo: string;
  dispoEte: boolean;
  experiences: Experience[];
}

export interface Membre {
  nom: string;
  sous: string;
  parrain?: boolean;
}

export interface Boite {
  nom: string;
  secteur: string;
  passes: number;
  parrains: number;
  gens: Membre[];
}

export interface Offre {
  meta: string;
  titre: string;
  recues: number;
  pied: string;
}

/** Une candidature reçue sur une offre. `talent` et `offre` renvoient à
    `Talent.id` et `Offre.titre` — des liens par valeur, faute de clés
    étrangères ici (voir `backend/README.md`). */
export interface Candidature {
  talent: string;
  offre: string;
  heures: number;
  lue: boolean;
}

export interface EventItem {
  jour: string;
  mois: string;
  cats: string[];
  meta: string;
  titre: string;
  sous: string;
  pied: string;
  cta: string;
  avatars?: boolean;
  dark?: boolean;
}

export interface Fil {
  id: string;
  votes: number;
  meta: string;
  heures: number;
  titre: string;
  extrait?: string;
  piece?: string;
  reponses: number;
  dark?: boolean;
}

/** Le nom + l'identifiant d'un onglet, porté par l'écran lui-même. */
export interface TabMeta {
  id: string;
  label: string;
}

export type Role = 'candidat' | 'entreprise';
