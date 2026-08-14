#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   GÉNÉRATION DU LOGO — la source de vérité du dessin.

       node scripts/logo/generer.mjs

   Un seul dessin, décrit une fois ici, décliné en tout ce que les deux
   applications consomment : contours partagés, SVG du web, PNG d'Expo.
   Régénérer est idempotent — relancer sans rien changer ne modifie aucun
   fichier. Les sorties sont committées : ni le site ni un build EAS ne
   lancent ce script.

   ── Le dessin (section 6 du document de design) ──────────────────────
   « Stips » : S en Outfit 800 teinté, « tips » en Outfit 500 encre,
   interlettrage −0.035 em. Trois teintes, une par variante de build —
   c'est ce qui permet de distinguer d'un coup d'œil laquelle des trois
   apps installées sur le même téléphone on est en train d'ouvrir.

   ── Pourquoi des contours et pas du texte ────────────────────────────
   Ni un favicon, ni une page statique, ni un PNG d'icône ne peuvent
   supposer Outfit présente ; un logo qui retombe sur la sans-serif du
   système n'est plus le logo. Dans l'app en revanche la police EST
   chargée (App.tsx, useFonts) : l'en-tête d'écran compose le wordmark en
   <Text>, pas avec ces contours. Voir packages/core/src/logo.ts.
   ══════════════════════════════════════════════════════════════════════ */

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ouvrirPolice, boiteEncre, transformer, versD } from './ttf.mjs';
import { Toile, aplatir, rectArrondi } from './raster.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ── Le dessin ────────────────────────────────────────────────────────── */

/** Une teinte par variante de build. Doit rester d'accord avec
    CONFIG_PAR_VARIANTE dans mobile/app.config.ts (fondIcone) et avec
    TEINTES_VARIANTE dans packages/core/src/tokens.ts. */
const TEINTES = {
  production: '#8C7B6B',  // 6a — taupe, la teinte de la marque
  preview: '#1B3A6B',     // 6b — bleu foncé
  development: '#B3382C', // 6c — rouge
};

const CREME = '#F7F5EF'; // le S posé sur un fond teinté
const ENCRE = '#14140f'; // « tips »
const INTERLETTRAGE = -0.035; // en cadratins, comme le letter-spacing CSS

const POLICE_S = '@expo-google-fonts/outfit/800ExtraBold/Outfit_800ExtraBold.ttf';
const POLICE_TIPS = '@expo-google-fonts/outfit/500Medium/Outfit_500Medium.ttf';

/* Part de la hauteur de l'image occupée par la hauteur d'encre du S.
   0.42 vient de la maquette : S à 30 px dans une pastille de 52 px, dont
   l'encre d'un S en Outfit 800 fait ~0.72 em, soit 21.6/52. */
const PART_S = 0.42;

/* Android n'affiche pas toute l'image de premier plan : le masque
   adaptatif ne laisse voir que les 72 dp centraux d'une toile de 108.
   Pour que le S paraisse de la même taille que sur iOS, il faut donc le
   dessiner plus petit dans le fichier — d'où le facteur 72/108. */
const PART_S_ANDROID = PART_S * (72 / 108);

/* ── Composition ──────────────────────────────────────────────────────── */

const police = (relatif) => ouvrirPolice(join(RACINE, 'node_modules', relatif));
const gras = police(POLICE_S);
const moyenne = police(POLICE_TIPS);

if (gras.em !== moyenne.em) {
  throw new Error(`Les deux graisses d'Outfit n'ont pas le même cadratin (${gras.em} / ${moyenne.em}).`);
}
const EM = gras.em;

/** Pose « S » puis « tips » sur une même ligne de base, en appliquant
    l'interlettrage entre chaque paire de lettres. Le résultat est en
    unités de police, repère SVG (y négatif au-dessus de la ligne). */
function composer() {
  const suivi = INTERLETTRAGE * EM;
  const s = gras.trace('S');

  let plume = gras.chasse('S') + suivi;
  const tips = [];
  for (const lettre of 'tips') {
    tips.push(...transformer(moyenne.trace(lettre), { dx: plume }));
    plume += moyenne.chasse(lettre) + suivi;
  }
  return { s, tips };
}

const MOT = composer();
const ENCRE_S = boiteEncre(MOT.s);
const ENCRE_TIPS = boiteEncre(MOT.tips);
const ENCRE_MOT = reunion(ENCRE_S, ENCRE_TIPS);

function reunion(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    largeur: Math.max(a.x + a.largeur, b.x + b.largeur) - x,
    hauteur: Math.max(a.y + a.hauteur, b.y + b.hauteur) - y,
  };
}

/** Décalage à passer à `transformer` pour que la boîte `encre`, une fois
    mise à l'échelle `k`, se retrouve centrée dans `largeur` × `hauteur`. */
function centrer(encre, k, largeur, hauteur) {
  return {
    dx: (largeur - encre.largeur * k) / 2 / k - encre.x,
    dy: (hauteur - encre.hauteur * k) / 2 / k - encre.y,
    echelle: k,
  };
}

/* ── Garde-fou ────────────────────────────────────────────────────────── */

/* Les trois teintes vivent à trois endroits, et il n'y a pas moyen de
   n'en faire qu'un : ce script tourne sur du .mjs avant toute
   compilation et ne peut pas importer @stips/core, tandis que
   app.config.ts est évalué par Expo hors du bundle Metro.

   Faute de source unique, on vérifie. Une teinte changée d'un côté
   seulement produirait des icônes dont le fond Android ne correspond
   plus au dessin, ou un en-tête d'app d'une autre couleur que son
   icône — un décalage silencieux, visible seulement sur un vrai
   téléphone, longtemps après. Ici il arrête le générateur. */
function verifierLesTeintes() {
  const lire = (relatif) => readFileSync(join(RACINE, relatif), 'utf8');
  const sources = [
    {
      relatif: 'packages/core/src/tokens.ts',
      quoi: 'TEINTES_VARIANTE',
      motif: (v) => new RegExp(`\\b${v}:\\s*'(#[0-9A-Fa-f]{6})'`),
    },
    {
      relatif: 'mobile/app.config.ts',
      quoi: 'CONFIG_PAR_VARIANTE[…].fondIcone',
      motif: (v) => new RegExp(`\\b${v}:\\s*\\{[\\s\\S]{0,500}?fondIcone:\\s*'(#[0-9A-Fa-f]{6})'`),
    },
  ];

  const ecarts = [];
  for (const { relatif, quoi, motif } of sources) {
    const texte = lire(relatif);
    for (const [variante, attendue] of Object.entries(TEINTES)) {
      const trouve = texte.match(motif(variante));
      if (!trouve) ecarts.push(`${relatif} — ${quoi} : ${variante} introuvable`);
      else if (trouve[1].toUpperCase() !== attendue.toUpperCase()) {
        ecarts.push(`${relatif} — ${quoi} : ${variante} vaut ${trouve[1]}, attendu ${attendue}`);
      }
    }
  }

  if (ecarts.length > 0) {
    throw new Error(
      `Les teintes de variante ont divergé :\n  ${ecarts.join('\n  ')}\n\n`
        + `TEINTES (en haut de ce fichier) fait foi pour le dessin. Aligner les\n`
        + `autres, ou corriger TEINTES ici, puis relancer.`,
    );
  }
}

verifierLesTeintes();

/* ── Sorties ──────────────────────────────────────────────────────────── */

const ecrits = [];

function ecrire(relatif, contenu) {
  const absolu = join(RACINE, relatif);
  const octets = Buffer.isBuffer(contenu) ? contenu : Buffer.from(contenu, 'utf8');

  let inchange = false;
  try {
    inchange = readFileSync(absolu).equals(octets);
  } catch { /* le fichier n'existe pas encore */ }

  if (!inchange) {
    mkdirSync(dirname(absolu), { recursive: true });
    writeFileSync(absolu, octets);
  }
  ecrits.push({ relatif, kio: octets.length / 1024, inchange });
}

/** Icône d'app : carré plein, S centré. Pas de coins arrondis — iOS et
    Android appliquent leur propre masque, et un arrondi déjà cuit dans le
    PNG ressortirait en liseré sombre à l'intérieur du leur. */
function icone(taille, fond, partDuS = PART_S, couleurS = CREME) {
  const toile = new Toile(taille, taille);
  if (fond) toile.fond(fond);
  const k = (taille * partDuS) / ENCRE_S.hauteur;
  toile.remplir(aplatir(transformer(MOT.s, centrer(ENCRE_S, k, taille, taille))), couleurS);
  return toile.png();
}

/** Favicon : le seul rendu où l'arrondi nous appartient. */
function favicon(taille, fond) {
  const toile = new Toile(taille, taille);
  toile.remplir(rectArrondi(0, 0, taille, taille, taille * 0.25), fond);
  const k = (taille * PART_S) / ENCRE_S.hauteur;
  toile.remplir(aplatir(transformer(MOT.s, centrer(ENCRE_S, k, taille, taille))), CREME);
  return toile.png();
}

/** Wordmark sur fond transparent — l'écran de démarrage, dont le fond
    crème est posé par la config du plugin, pas par l'image. */
function wordmark(largeur, teinte) {
  const k = largeur / ENCRE_MOT.largeur;
  const hauteur = Math.ceil(ENCRE_MOT.hauteur * k);
  const toile = new Toile(largeur, hauteur);
  const pose = centrer(ENCRE_MOT, k, largeur, hauteur);
  toile.remplir(aplatir(transformer(MOT.s, pose)), teinte);
  toile.remplir(aplatir(transformer(MOT.tips, pose)), ENCRE);
  return toile.png();
}

const n = (v) => String(Number(v.toFixed(3)));

/** Le wordmark en SVG. Les `d` restent dans les unités de la police et
    c'est le `transform` qui les met à l'échelle : le même texte que dans
    logo-contours.ts, donc un seul dessin à vérifier. */
function svgMot(largeur, teinte, couleurTips) {
  const k = largeur / ENCRE_MOT.largeur;
  const hauteur = Number((ENCRE_MOT.hauteur * k).toFixed(3));
  const pose = `translate(${n(-ENCRE_MOT.x * k)} ${n(-ENCRE_MOT.y * k)}) scale(${n(k)})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${n(largeur)}" height="${hauteur}" `
    + `viewBox="0 0 ${n(largeur)} ${hauteur}" role="img" aria-label="Stips">`
    + `<g transform="${pose}">`
    + `<path fill="${teinte}" d="${versD(MOT.s)}"/>`
    + `<path fill="${couleurTips}" d="${versD(MOT.tips)}"/>`
    + `</g></svg>\n`;
}

function svgFavicon(taille, fond) {
  const k = (taille * PART_S) / ENCRE_S.hauteur;
  const { dx, dy } = centrer(ENCRE_S, k, taille, taille);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${taille}" height="${taille}" `
    + `viewBox="0 0 ${taille} ${taille}" role="img" aria-label="Stips">`
    + `<rect width="${taille}" height="${taille}" rx="${n(taille * 0.25)}" fill="${fond}"/>`
    + `<path fill="${CREME}" transform="translate(${n(dx * k)} ${n(dy * k)}) scale(${n(k)})" `
    + `d="${versD(MOT.s)}"/>`
    + `</svg>\n`;
}

/** packages/core/src/logo-contours.ts — la donnée partagée. */
function contours() {
  const boite = (b) => `{ x: ${n(b.x)}, y: ${n(b.y)}, largeur: ${n(b.largeur)}, hauteur: ${n(b.hauteur)} }`;
  return `/* ══════════════════════════════════════════════════════════════════════
   GÉNÉRÉ par scripts/logo/generer.mjs — ne pas éditer à la main.

   Les deux moitiés du wordmark converties en contours, à une taille de
   police de ${EM}. « S » en Outfit 800, « tips » en Outfit 500 avec
   l'interlettrage de ${INTERLETTRAGE} em déjà intégré au tracé : les deux
   sont dans le MÊME repère, il suffit de les dessiner l'un après l'autre.

   Voir ./logo.ts pour la forme, et l'en-tête du générateur pour le
   pourquoi des contours plutôt que du texte.
   ══════════════════════════════════════════════════════════════════════ */

import type { ContoursLogo } from './logo';

export const LOGO_CONTOURS: ContoursLogo = {
  em: ${EM},
  s: {
    d: '${versD(MOT.s)}',
    encre: ${boite(ENCRE_S)},
  },
  tips: {
    d: '${versD(MOT.tips)}',
    encre: ${boite(ENCRE_TIPS)},
  },
  encre: ${boite(ENCRE_MOT)},
};
`;
}

/* ── Exécution ────────────────────────────────────────────────────────── */

ecrire('packages/core/src/logo-contours.ts', contours());

// iOS : une icône par variante, parce qu'iOS ne sait pas teinter une
// icône par configuration. Android s'en passe (voir plus bas).
for (const [variante, teinte] of Object.entries(TEINTES)) {
  ecrire(`mobile/assets/icon-${variante}.png`, icone(1024, teinte));
  ecrire(`mobile/assets/splash-${variante}.png`, wordmark(1200, teinte));
}

// Android : UNE image de premier plan pour les trois variantes, le fond
// étant une couleur posée par app.config.ts (adaptiveIcon.backgroundColor).
// Le S est crème dans les trois cas, donc rien à décliner.
ecrire('mobile/assets/android-icon-foreground.png', icone(1024, null, PART_S_ANDROID));
// Couche monochrome (thème « icônes teintées » d'Android 13+) : le
// système ne lit que l'alpha et applique sa propre couleur. On dessine
// donc en noir, la teinte de variante n'a pas lieu d'être ici.
ecrire('mobile/assets/android-icon-monochrome.png', icone(1024, null, PART_S_ANDROID, ENCRE));

ecrire('mobile/assets/favicon.png', favicon(512, TEINTES.production));

// Le web n'a pas de variantes : il porte la teinte de la marque.
ecrire('frontend/public/logo.svg', svgMot(260, TEINTES.production, ENCRE));
ecrire('frontend/public/logo-creme.svg', svgMot(260, TEINTES.production, CREME));
ecrire('frontend/public/favicon.svg', svgFavicon(64, TEINTES.production));

const modifies = ecrits.filter((e) => !e.inchange);
for (const { relatif, kio, inchange } of ecrits) {
  console.log(`${inchange ? '  =' : '  →'} ${relatif.padEnd(46)} ${kio.toFixed(1).padStart(7)} Kio`);
}
console.log(`\n${modifies.length} fichier(s) modifié(s) sur ${ecrits.length}.`);
