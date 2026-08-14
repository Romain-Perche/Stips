/* ══════════════════════════════════════════════════════════════════════
   DATA — tout le contenu factice, regroupé pour être remplacé par une
   vraie source de données (le futur backend) plus tard.
   ══════════════════════════════════════════════════════════════════════ */

import type { MoiProfile, Invitation, Talent, Membre, Boite, Offre, Candidature, EventItem, Fil } from './types';

export const DATA: {
  moi: MoiProfile;
  invitation: Invitation;
  talents: Talent[];
  membres: Membre[];
  membresTotal: number;
  boites: Boite[];
  offres: { resume: string; liste: Offre[] };
  candidatures: Candidature[];
  events: EventItem[];
  fils: Fil[];
} = {

  // ── Le profil de l'utilisateur candidat ────────────────────────────────
  moi: {
    nom: 'Camille Roux',
    bio: 'M1 Finance à Dauphine, je cherche un stage de césure en M&A. Je joue au foot le jeudi.',
    stage: 'M&A / Corporate Finance',
    dispo: 'Janv. → Juin 2027 · 6 mois',
    experiences: [
      { titre: 'Analyste M&A · BNP',            duree: '6 mois' },
      { titre: "Contrôle de gestion · L'Oréal",  duree: '4 mois' },
      { titre: 'Trésorerie · Junior-Ent.',       duree: '1 an'   },
    ],
  },

  // ── L'invitation reçue du parrain (écran 5a2) ──────────────────────────
  invitation: {
    prenom:   'Camille',
    parrain:  'Léa Ferrand',
    role:     'Ta maître de stage · BNP Paribas',
    note:     '4.6',
    reco:     '« Autonome dès la deuxième semaine. Je la reprends les yeux fermés. »',
    signee:   'Signé le 3 septembre · tu ne peux pas le modifier',
    avantages: [
      'Tous les événements : foot, ateliers CV, soirées',
      'Le forum de la promo et de ses parrains',
      'Une visibilité accrue pour les entreprises',
    ],
  },

  // ── Les profils vus par l'entreprise (écran 2a) ────────────────────────
  // Camille vient du design ; Yanis et Inès reprennent 1b, le reste de leur
  // face B est du remplissage à valider.
  talents: [
    {
      id: 'camille', nom: 'Camille Roux', ecole: 'M1 Finance · Dauphine', note: 4.6,
      parrain: 'Léa Ferrand', parrainRole: 'Maître de stage · BNP',
      reco: '« Autonome dès la deuxième semaine. Je la reprends les yeux fermés. »',
      cherche: 'Stage M&A / Corporate Finance',
      dispo: 'Janv. → Juin 2027 · 6 mois', dispoEte: false,
      experiences: [
        { titre: 'Analyste M&A · BNP Paribas',        duree: '6 mois' },
        { titre: "Contrôle de gestion · L'Oréal",     duree: '4 mois' },
        { titre: 'Trésorerie Junior-Ent. · Dauphine', duree: '1 an'   },
      ],
    },
    {
      id: 'yanis', nom: 'Yanis Bekkar', ecole: 'M2 Data · Dauphine', note: 4.9,
      parrain: 'Marc Traoré', parrainRole: 'VP · Rothschild & Co',
      reco: "« Le meilleur stagiaire de l'équipe. »",
      cherche: 'Stage Data / Analytics',
      dispo: 'Juil. → Déc. 2026 · 6 mois', dispoEte: true,
      experiences: [
        { titre: 'Analyste M&A · Rothschild & Co', duree: '6 mois' },
      ],
    },
    {
      id: 'ines', nom: 'Inès Marchal', ecole: 'M1 Audit · Dauphine', note: 4.3,
      parrain: 'Claire Duval', parrainRole: 'Manager · Deloitte',
      reco: '« Très bonne plume, sérieuse. »',
      cherche: 'Stage Audit / Transaction Services',
      dispo: 'Janv. → Juin 2027 · 6 mois', dispoEte: false,
      experiences: [
        { titre: 'Audit financier · Deloitte', duree: '4 mois' },
      ],
    },
  ],

  // ── L'annuaire de Stips, onglet « Personnes » (écran 8a) ───────────────
  membres: [
    { nom: 'Yanis Bekkar',  sous: 'M2 Data · a fait Rothschild & Co' },
    { nom: 'Inès Marchal',  sous: 'M1 Audit · a fait Deloitte' },
    { nom: 'Léa Ferrand',   sous: 'Maître de stage · BNP Paribas', parrain: true },
    { nom: 'Tom Aubert',    sous: 'M1 Conseil · a fait Sia Partners' },
  ],
  membresTotal: 128,

  // ── Les boîtes, onglet « Boîtes » (écran 8b) ───────────────────────────
  // Seule Rothschild figure dans le design ; les trois autres sont du
  // remplissage pour que la recherche ait de quoi filtrer.
  boites: [
    {
      nom: 'Rothschild & Co', secteur: "BANQUE D'AFFAIRES · PARIS",
      passes: 4, parrains: 2,
      gens: [
        { nom: 'Yanis Bekkar', sous: 'Analyste M&A · 2026 · 6 mois' },
        { nom: 'Sarah Klein',  sous: 'Stage ECM · 2025 · 4 mois' },
        { nom: 'Marc Traoré',  sous: 'VP · recrute en janvier', parrain: true },
      ],
    },
    {
      nom: 'Deloitte', secteur: 'AUDIT & CONSEIL · PARIS',
      passes: 6, parrains: 3,
      gens: [
        { nom: 'Inès Marchal', sous: 'Audit financier · 2026 · 4 mois' },
        { nom: 'Claire Duval', sous: 'Manager · recrute au printemps', parrain: true },
      ],
    },
    {
      nom: 'BNP Paribas', secteur: 'BANQUE · PARIS',
      passes: 5, parrains: 2,
      gens: [
        { nom: 'Camille Roux', sous: 'Analyste M&A · 2026 · 6 mois' },
        { nom: 'Léa Ferrand',  sous: 'Maître de stage · M&A', parrain: true },
      ],
    },
    {
      nom: 'Sia Partners', secteur: 'CONSEIL · PARIS',
      passes: 2, parrains: 1,
      gens: [
        { nom: 'Tom Aubert', sous: 'Consultant junior · 2026 · 6 mois' },
      ],
    },
  ],

  // ── Les offres publiées par l'entreprise (écran 6a) ────────────────────
  offres: {
    resume: '3 offres en ligne · 21 candidatures reçues',
    liste: [
      { meta: 'M&A · PARIS · 6 MOIS',    titre: 'Analyste M&A — stage de césure',
        recues: 12, pied: 'Publiée le 2 sept. · 4 non lues' },
      { meta: 'DATA · REMOTE · 4 MOIS',  titre: 'Data analyst junior — été 2027',
        recues: 7,  pied: 'Publiée le 28 août' },
    ],
  },

  // ── Les candidatures reçues, vues par le pro (onglet Offres) ───────────
  // `heures` plutôt qu'une chaîne « il y a 3 h » : c'est l'écran qui écrit
  // la phrase. Voir `backend/README.md` § les valeurs qu'on ne stocke pas.
  candidatures: [
    { talent: 'camille', offre: 'Analyste M&A — stage de césure', heures: 3,  lue: false },
    { talent: 'yanis',   offre: 'Data analyst junior — été 2027', heures: 9,  lue: false },
    { talent: 'ines',    offre: 'Analyste M&A — stage de césure', heures: 28, lue: true  },
  ],

  // ── Les événements (écran 3a) ──────────────────────────────────────────
  events: [
    { jour: '12', mois: 'SEPT', cats: ['Sport'], meta: 'SPORT · 20H00',
      titre: 'Foot en salle · Le Five Bercy', sous: 'Candidats et recruteurs mélangés',
      pied: '14 inscrits · 4 places', cta: 'Je viens', avatars: true },
    { jour: '18', mois: 'SEPT', cats: ['Bar', 'Atelier'], meta: 'BAR · ATELIER · 19H30',
      titre: 'Refais ton CV · Chez Jeannette', sous: 'Une bière, un CV relu par un recruteur',
      pied: '31 inscrits · complet', cta: "Liste d'attente" },
    { jour: '02', mois: 'OCT', cats: ['Bar'], meta: 'SOIRÉE STIPS · 20H00',
      titre: 'Rentrée Stips · Rooftop Marais', sous: 'Toute la promo, 12 boîtes présentes',
      pied: 'Ouvre le 20 sept.', cta: 'Me prévenir', dark: true },
  ],

  // ── Le forum (écran 4b) ────────────────────────────────────────────────
  fils: [
    { id: 'f1', votes: 48, meta: 'stips/stage-fiance · Yanis · 2 h', heures: 2,
      titre: "Retour d'entretien Rothschild : les 4 questions qui tombent à tous les coups",
      extrait: 'Je sors du 3e tour, je vous mets tout ce dont je me souviens…',
      reponses: 23 },
    { id: 'f2', votes: 31, meta: 'stips/reco-cv · Léa F. · marraine · 5 h', heures: 5,
      titre: 'Je relis 10 CV ce week-end — postez le vôtre ici',
      piece: 'PIÈCE JOINTE · TEMPLATE CV', reponses: 17 },
    { id: 'f3', votes: 12, meta: 'stips/foot-du-jeudi · Sarah · 1 j', heures: 24,
      titre: 'Il manque 2 joueurs jeudi 20h — qui prend le dernier créneau ?',
      reponses: 9, dark: true },
  ],
};
