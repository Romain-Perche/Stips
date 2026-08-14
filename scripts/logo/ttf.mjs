/* ══════════════════════════════════════════════════════════════════════
   TTF — extraction des contours d'un glyphe depuis un fichier de police.

   Pourquoi écrire ça plutôt qu'installer opentype.js : ce script tourne
   deux fois par an, à la main, et son seul rôle est de produire des
   fichiers qu'on committe. Lui donner une dépendance, c'est l'ajouter au
   `npm ci` de la CI — qui, elle, ne génère aucun logo. On lit donc le
   .ttf directement ; Node sait déjà tout faire (Buffer, zlib).

   Portée volontairement étroite : les tables nécessaires aux polices
   qu'on utilise (TrueType `glyf`, pas de CFF/OpenType courbes cubiques),
   et rien de plus. Pas de crénage : le dessin du logo pose son propre
   interlettrage, ce qui rend le GPOS de la police sans objet.
   ══════════════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs';

/* ── Lecture du sommaire des tables ───────────────────────────────────── */

function tables(buf) {
  // sfnt : uint32 version, uint16 numTables, puis 3 uint16 ignorés.
  const n = buf.readUInt16BE(4);
  const index = new Map();
  for (let i = 0; i < n; i++) {
    const rec = 12 + i * 16;
    index.set(buf.toString('ascii', rec, rec + 4), {
      debut: buf.readUInt32BE(rec + 8),
      longueur: buf.readUInt32BE(rec + 12),
    });
  }
  return index;
}

/* ── cmap : code de caractère → identifiant de glyphe ─────────────────── */

/** Format 4 — segments de BMP, celui que toute police a. */
function cmap4(buf, base) {
  const segCount = buf.readUInt16BE(base + 6) / 2;
  const fin = base + 14;
  const debut = fin + segCount * 2 + 2; // +2 : reservedPad
  const delta = debut + segCount * 2;
  const rangeOffset = delta + segCount * 2;

  return (code) => {
    for (let s = 0; s < segCount; s++) {
      if (buf.readUInt16BE(fin + s * 2) < code) continue;
      if (buf.readUInt16BE(debut + s * 2) > code) return 0;

      const ro = buf.readUInt16BE(rangeOffset + s * 2);
      if (ro === 0) return (code + buf.readInt16BE(delta + s * 2)) & 0xffff;

      // idRangeOffset est un déplacement en octets DEPUIS SA PROPRE case :
      // le tableau de glyphes suit immédiatement le tableau des offsets.
      const at = rangeOffset + s * 2 + ro + (code - buf.readUInt16BE(debut + s * 2)) * 2;
      const g = buf.readUInt16BE(at);
      return g === 0 ? 0 : (g + buf.readInt16BE(delta + s * 2)) & 0xffff;
    }
    return 0;
  };
}

/** Format 12 — groupes, nécessaire hors BMP. Préféré quand il existe. */
function cmap12(buf, base) {
  const nGroupes = buf.readUInt32BE(base + 12);
  return (code) => {
    for (let g = 0; g < nGroupes; g++) {
      const rec = base + 16 + g * 12;
      const premier = buf.readUInt32BE(rec);
      if (code < premier) return 0;
      if (code <= buf.readUInt32BE(rec + 4)) return buf.readUInt32BE(rec + 8) + (code - premier);
    }
    return 0;
  };
}

function chercheurDeGlyphe(buf, cmap) {
  const n = buf.readUInt16BE(cmap.debut + 2);
  let meilleur = null;
  for (let i = 0; i < n; i++) {
    const rec = cmap.debut + 4 + i * 8;
    const plateforme = buf.readUInt16BE(rec);
    const encodage = buf.readUInt16BE(rec + 2);
    const base = cmap.debut + buf.readUInt32BE(rec + 4);
    const format = buf.readUInt16BE(base);

    // (3,10) format 12 est le plus complet, (3,1) format 4 le plus répandu.
    if (plateforme === 3 && encodage === 10 && format === 12) return cmap12(buf, base);
    if (plateforme === 3 && encodage === 1 && format === 4) meilleur = cmap4(buf, base);
  }
  if (!meilleur) throw new Error('cmap : aucun sous-tableau (3,1)/4 ni (3,10)/12');
  return meilleur;
}

/* ── glyf : les points d'un glyphe ────────────────────────────────────── */

const REPETE = 0x08;
const X_COURT = 0x02;
const X_MEME = 0x10;
const Y_COURT = 0x04;
const Y_MEME = 0x20;
const SUR_COURBE = 0x01;

/** Un glyphe simple → liste de contours, chacun une liste de points
    `{ x, y, surCourbe }` dans les unités de la police (y vers le haut). */
function glypheSimple(buf, at) {
  const nbContours = buf.readInt16BE(at);
  let p = at + 10;

  const fins = [];
  for (let i = 0; i < nbContours; i++, p += 2) fins.push(buf.readUInt16BE(p));
  const nbPoints = fins[fins.length - 1] + 1;

  p += 2 + buf.readUInt16BE(p); // instructions : longueur puis contenu, ignorés

  const drapeaux = [];
  while (drapeaux.length < nbPoints) {
    const d = buf.readUInt8(p++);
    drapeaux.push(d);
    if (d & REPETE) for (let r = buf.readUInt8(p++); r > 0; r--) drapeaux.push(d);
  }

  // x puis y, en deltas successifs : le drapeau dit si le delta tient sur
  // un octet (et où est son signe) ou s'il est nul.
  const lire = (court, meme) => {
    const valeurs = [];
    let v = 0;
    for (const d of drapeaux) {
      if (d & court) v += (d & meme ? 1 : -1) * buf.readUInt8(p++);
      else if (!(d & meme)) { v += buf.readInt16BE(p); p += 2; }
      valeurs.push(v);
    }
    return valeurs;
  };
  const xs = lire(X_COURT, X_MEME);
  const ys = lire(Y_COURT, Y_MEME);

  const contours = [];
  let i = 0;
  for (const fin of fins) {
    const points = [];
    for (; i <= fin; i++) points.push({ x: xs[i], y: ys[i], surCourbe: !!(drapeaux[i] & SUR_COURBE) });
    contours.push(points);
  }
  return contours;
}

const ARGS_SUR_2_OCTETS = 0x0001;
const ARGS_SONT_XY = 0x0002;
const A_UNE_ECHELLE = 0x0008;
const AUTRES_COMPOSANTS = 0x0020;
const A_ECHELLE_X_Y = 0x0040;
const A_MATRICE_2X2 = 0x0080;

const f2dot14 = (buf, at) => buf.readInt16BE(at) / 16384;

/** Un glyphe composite (« é » = « e » + accent) : des références à
    d'autres glyphes, chacune avec sa transformation. Rare pour du latin
    de base, mais rien ne garantit qu'une police ne compose pas un « i ». */
function glypheComposite(buf, at, contoursDe) {
  const contours = [];
  let p = at + 10;
  let encore = true;

  while (encore) {
    const drapeaux = buf.readUInt16BE(p);
    const idGlyphe = buf.readUInt16BE(p + 2);
    p += 4;
    encore = !!(drapeaux & AUTRES_COMPOSANTS);

    let dx = 0;
    let dy = 0;
    if (drapeaux & ARGS_SUR_2_OCTETS) {
      if (drapeaux & ARGS_SONT_XY) { dx = buf.readInt16BE(p); dy = buf.readInt16BE(p + 2); }
      p += 4;
    } else {
      if (drapeaux & ARGS_SONT_XY) { dx = buf.readInt8(p); dy = buf.readInt8(p + 1); }
      p += 2;
    }

    let [a, b, c, d] = [1, 0, 0, 1];
    if (drapeaux & A_UNE_ECHELLE) { a = d = f2dot14(buf, p); p += 2; }
    else if (drapeaux & A_ECHELLE_X_Y) { a = f2dot14(buf, p); d = f2dot14(buf, p + 2); p += 4; }
    else if (drapeaux & A_MATRICE_2X2) {
      a = f2dot14(buf, p); b = f2dot14(buf, p + 2);
      c = f2dot14(buf, p + 4); d = f2dot14(buf, p + 6);
      p += 8;
    }

    for (const contour of contoursDe(idGlyphe)) {
      contours.push(contour.map((pt) => ({
        x: a * pt.x + c * pt.y + dx,
        y: b * pt.x + d * pt.y + dy,
        surCourbe: pt.surCourbe,
      })));
    }
  }
  return contours;
}

/* ── Contours → tracé ─────────────────────────────────────────────────── */

/** TrueType décrit des B-splines quadratiques : entre deux points hors
    courbe consécutifs, il y a un point sur courbe implicite à mi-chemin.
    On le rétablit ici pour produire des segments Q explicites.

    Le repère bascule au passage : la police a y vers le haut, SVG y vers
    le bas. D'où le -1, et les ordonnées négatives dans le résultat. */
function versTrace(contours) {
  const chemins = [];

  for (const points of contours) {
    if (points.length === 0) continue;
    const P = points.map((p) => ({ x: p.x, y: -p.y, surCourbe: p.surCourbe }));
    const milieu = (u, v) => ({ x: (u.x + v.x) / 2, y: (u.y + v.y) / 2, surCourbe: true });

    // Le contour doit démarrer sur la courbe. S'il n'y a aucun point sur
    // courbe (contour tout en quadratiques, ex. un « o » parfait), on
    // fabrique le point de départ au milieu des deux derniers.
    let depart = P.findIndex((p) => p.surCourbe);
    let ordre;
    if (depart === -1) {
      ordre = [milieu(P[P.length - 1], P[0]), ...P];
      depart = 0;
    } else {
      ordre = [...P.slice(depart), ...P.slice(0, depart)];
    }

    const segments = [];
    const origine = ordre[0];
    let courant = origine;
    let controle = null;

    const poser = (cible) => {
      if (controle) segments.push({ t: 'Q', c: controle, p: cible });
      else segments.push({ t: 'L', p: cible });
      controle = null;
      courant = cible;
    };

    for (let i = 1; i <= ordre.length; i++) {
      const pt = i === ordre.length ? origine : ordre[i];
      if (pt.surCourbe) { poser(pt); continue; }
      if (controle) poser(milieu(controle, pt)); // deux hors courbe : milieu implicite
      controle = pt;
    }
    if (controle) poser(origine); // le contour se referme sur une quadratique

    chemins.push({ depart: origine, segments });
    void courant;
  }
  return chemins;
}

/* ── API ──────────────────────────────────────────────────────────────── */

/** Ouvre une police et rend de quoi interroger ses glyphes. */
export function ouvrirPolice(chemin) {
  const buf = readFileSync(chemin);
  const t = tables(buf);
  const table = (nom) => {
    const e = t.get(nom);
    if (!e) throw new Error(`${chemin} : table ${nom} absente`);
    return e;
  };

  const head = table('head');
  const em = buf.readUInt16BE(head.debut + 18);
  const locaLong = buf.readInt16BE(head.debut + 50) === 1;
  const loca = table('loca');
  const glyf = table('glyf');
  const hhea = table('hhea');
  const nbHMetriques = buf.readUInt16BE(hhea.debut + 34);
  const hmtx = table('hmtx');
  const idDe = chercheurDeGlyphe(buf, table('cmap'));

  const bornes = (id) => (locaLong
    ? [buf.readUInt32BE(loca.debut + id * 4), buf.readUInt32BE(loca.debut + id * 4 + 4)]
    : [buf.readUInt16BE(loca.debut + id * 2) * 2, buf.readUInt16BE(loca.debut + id * 2 + 2) * 2]);

  const contoursDe = (id) => {
    const [a, b] = bornes(id);
    if (a === b) return []; // glyphe vide (espace)
    const at = glyf.debut + a;
    return buf.readInt16BE(at) >= 0
      ? glypheSimple(buf, at)
      : glypheComposite(buf, at, contoursDe);
  };

  return {
    /** Unités par cadratin — l'échelle de toutes les coordonnées rendues. */
    em,
    /** Chasse du caractère, dans les unités de la police. */
    chasse(caractere) {
      const id = idDe(caractere.codePointAt(0));
      // hmtx ne stocke la chasse que jusqu'à nbHMetriques : au-delà, tous
      // les glyphes partagent la dernière (polices à chasse fixe en queue).
      const i = Math.min(id, nbHMetriques - 1);
      return buf.readUInt16BE(hmtx.debut + i * 4);
    },
    /** Tracé du caractère, posé sur la ligne de base, en repère SVG. */
    trace(caractere) {
      const id = idDe(caractere.codePointAt(0));
      if (id === 0) throw new Error(`${chemin} : « ${caractere} » absent de la police`);
      return versTrace(contoursDe(id));
    },
  };
}

/** Boîte d'encre d'un tracé : l'aire réellement couverte. Ce n'est pas la
    boîte de la police — c'est elle qui permet de centrer sur le dessin et
    non sur des métriques qui débordent du dessin.

    Les points de contrôle des quadratiques sont hors de la courbe, donc
    les inclure donnerait une boîte trop large. On échantillonne la courbe
    elle-même : 16 pas suffisent, on ne cherche pas le sous-pixel. */
export function boiteEncre(chemins) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const voir = (x, y) => {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  };

  for (const { depart, segments } of chemins) {
    let de = depart;
    voir(de.x, de.y);
    for (const s of segments) {
      if (s.t === 'Q') {
        for (let i = 1; i < 16; i++) {
          const u = i / 16;
          const v = 1 - u;
          voir(v * v * de.x + 2 * v * u * s.c.x + u * u * s.p.x,
               v * v * de.y + 2 * v * u * s.c.y + u * u * s.p.y);
        }
      }
      voir(s.p.x, s.p.y);
      de = s.p;
    }
  }
  return { x: x0, y: y0, largeur: x1 - x0, hauteur: y1 - y0 };
}

/** Applique une translation puis une échelle à un tracé. */
export function transformer(chemins, { dx = 0, dy = 0, echelle = 1 } = {}) {
  const f = (p) => ({ x: (p.x + dx) * echelle, y: (p.y + dy) * echelle });
  return chemins.map(({ depart, segments }) => ({
    depart: f(depart),
    segments: segments.map((s) => (s.t === 'Q' ? { t: 'Q', c: f(s.c), p: f(s.p) } : { t: 'L', p: f(s.p) })),
  }));
}

/** Tracé → attribut `d` d'un <path> SVG. `decimales` borne la précision :
    les contours sont générés à em=1000, où le dixième d'unité est déjà
    dix fois plus fin que ce que le meilleur écran affiche. */
export function versD(chemins, decimales = 0) {
  const n = (v) => {
    const arrondi = Number(v.toFixed(decimales));
    return Object.is(arrondi, -0) ? '0' : String(arrondi);
  };
  return chemins
    .map(({ depart, segments }) => `M${n(depart.x)} ${n(depart.y)}`
      + segments.map((s) => (s.t === 'Q'
        ? `Q${n(s.c.x)} ${n(s.c.y)} ${n(s.p.x)} ${n(s.p.y)}`
        : `L${n(s.p.x)} ${n(s.p.y)}`)).join('')
      + 'Z')
    .join('');
}
