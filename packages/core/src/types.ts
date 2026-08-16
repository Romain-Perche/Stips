/* ══════════════════════════════════════════════════════════════════════
   TYPES — la forme des données, partagée entre data.ts et les écrans.
   ══════════════════════════════════════════════════════════════════════ */

export interface Experience {
  titre: string;
  duree: string;
}

/** Les trois derniers champs ne concernent que la partie 2 de « Qui suis-je
    ? », réservée au membre : un pro n'a pas de stage à chercher, donc pas
    de raison de les remplir. */
export interface MoiProfile {
  nom: string;
  bio: string;
  stage?: string;
  dispo?: string;
  experiences?: Experience[];
}

/** Le mot que le parrain choisit pour résumer son stagiaire, dans une liste
    fermée. Des noms et pas des adjectifs : « Rigueur » s'écrit pareil pour
    tout le monde, « Rigoureux / Rigoureuse » obligerait à dériver la forme
    de `personne.accord` à chaque affichage. */
export type Qualificatif =
  | 'Autonomie' | 'Rigueur'    | 'Curiosité'  | 'Fiabilité'
  | 'Méthode'   | 'Ténacité'   | 'Créativité' | 'Initiative';

export interface Invitation {
  prenom: string;
  parrain: string;
  role: string;
  qualificatif: Qualificatif;
  reco: string;
  signee: string;
  avantages: string[];
}

export interface Talent {
  id: string;
  nom: string;
  ecole: string;
  qualificatif: Qualificatif;
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

/** Deux rôles, et deux seulement. « Parrain » n'en est pas un troisième :
    c'est ce qu'est un pro ayant signé au moins une recommandation, donc une
    propriété déduite. Un membre qui devient pro garde le même compte. */
export type Role = 'membre' | 'pro';
