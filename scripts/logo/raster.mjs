/* ══════════════════════════════════════════════════════════════════════
   RASTER — tracés → PNG, sans dépendance (voir l'en-tête de ttf.mjs pour
   le pourquoi).

   Un rasteriseur généraliste serait déraisonnable à écrire ici. Celui-ci
   ne sait faire qu'une chose, celle dont le logo a besoin : remplir des
   polygones fermés d'une couleur unie, avec un anticrénelage correct.
   Ni dégradé, ni contour, ni écrêtage.

   L'anticrénelage se fait par sous-balayage : SOUS lignes par rangée de
   pixels, et sur chacune la couverture horizontale est exacte (on ajoute
   la fraction de pixel réellement couverte aux deux bouts de segment,
   pas un échantillon ponctuel). C'est nettement plus propre qu'un
   suréchantillonnage carré à coût égal, parce que les bords quasi
   verticaux — l'essentiel d'une lettre — sont alors rendus exactement.
   ══════════════════════════════════════════════════════════════════════ */

import { deflateSync } from 'node:zlib';

const SOUS = 8;

/* ── Couleurs ─────────────────────────────────────────────────────────── */

/** '#RGB' | '#RRGGBB' → { r, g, b } sur 0-255. */
export function couleur(hex) {
  const h = hex.replace('#', '');
  const p = h.length === 3 ? [...h].map((c) => c + c) : [h.slice(0, 2), h.slice(2, 4), h.slice(4, 6)];
  const [r, g, b] = p.map((c) => parseInt(c, 16));
  if ([r, g, b].some(Number.isNaN)) throw new Error(`couleur illisible : ${hex}`);
  return { r, g, b };
}

/* ── Aplatissement ────────────────────────────────────────────────────── */

/** Tracé (segments L et Q) → polygones, en coordonnées pixel.

    Le pas de découpe des quadratiques suit la longueur du polygone de
    contrôle : une courbe de 3 px n'a pas besoin d'autant de segments
    qu'une de 300. Le demi-pixel comme cible de finesse est suffisant,
    l'anticrénelage absorbe le reste. */
export function aplatir(chemins) {
  const polygones = [];
  for (const { depart, segments } of chemins) {
    const points = [{ x: depart.x, y: depart.y }];
    let de = depart;
    for (const s of segments) {
      if (s.t === 'Q') {
        const longueur = Math.hypot(s.c.x - de.x, s.c.y - de.y) + Math.hypot(s.p.x - s.c.x, s.p.y - s.c.y);
        const pas = Math.min(64, Math.max(3, Math.ceil(longueur / 2)));
        for (let i = 1; i <= pas; i++) {
          const u = i / pas;
          const v = 1 - u;
          points.push({
            x: v * v * de.x + 2 * v * u * s.c.x + u * u * s.p.x,
            y: v * v * de.y + 2 * v * u * s.c.y + u * u * s.p.y,
          });
        }
      } else {
        points.push({ x: s.p.x, y: s.p.y });
      }
      de = s.p;
    }
    polygones.push(points);
  }
  return polygones;
}

/** Rectangle à coins arrondis, directement en polygone. Sert au favicon,
    seul rendu où l'on dessine soi-même le masque : les icônes d'app sont
    des carrés pleins, iOS et Android appliquant le leur. */
export function rectArrondi(x, y, largeur, hauteur, rayon) {
  const r = Math.min(rayon, largeur / 2, hauteur / 2);
  const pas = Math.max(8, Math.ceil(r / 1.5));
  const points = [];
  const coin = (cx, cy, depart) => {
    for (let i = 0; i <= pas; i++) {
      const a = depart + (Math.PI / 2) * (i / pas);
      points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  coin(x + largeur - r, y + hauteur - r, 0);            // bas-droite
  coin(x + r, y + hauteur - r, Math.PI / 2);            // bas-gauche
  coin(x + r, y + r, Math.PI);                          // haut-gauche
  coin(x + largeur - r, y + r, (3 * Math.PI) / 2);      // haut-droite
  return [points];
}

/* ── Toile ────────────────────────────────────────────────────────────── */

export class Toile {
  constructor(largeur, hauteur) {
    this.largeur = largeur;
    this.hauteur = hauteur;
    // RGBA non prémultiplié, 8 bits — le format de PNG couleur 6.
    this.px = new Float64Array(largeur * hauteur * 4);
  }

  /** Remplit toute la toile d'une couleur opaque. */
  fond(hex) {
    const { r, g, b } = couleur(hex);
    for (let i = 0; i < this.px.length; i += 4) {
      this.px[i] = r;
      this.px[i + 1] = g;
      this.px[i + 2] = b;
      this.px[i + 3] = 1;
    }
  }

  /** Remplit des polygones, règle non nulle (celle de TrueType : c'est
      elle qui creuse le contre-poinçon d'un « p » sans qu'on ait à
      connaître le sens de ses contours). */
  remplir(polygones, hex, opacite = 1) {
    const { r, g, b } = couleur(hex);

    // Liste d'arêtes. Les horizontales ne coupent aucune ligne de
    // balayage : les jeter ici évite un cas particulier plus bas.
    const aretes = [];
    let hautMin = Infinity;
    let basMax = -Infinity;
    for (const points of polygones) {
      for (let i = 0; i < points.length; i++) {
        const a = points[i];
        const c = points[(i + 1) % points.length];
        if (a.y === c.y) continue;
        aretes.push({ x0: a.x, y0: a.y, x1: c.x, y1: c.y, sens: c.y > a.y ? 1 : -1 });
        hautMin = Math.min(hautMin, a.y, c.y);
        basMax = Math.max(basMax, a.y, c.y);
      }
    }
    if (aretes.length === 0) return;

    const y0 = Math.max(0, Math.floor(hautMin));
    const y1 = Math.min(this.hauteur - 1, Math.ceil(basMax));
    const couverture = new Float64Array(this.largeur);
    const croisements = [];

    for (let py = y0; py <= y1; py++) {
      couverture.fill(0);

      for (let s = 0; s < SOUS; s++) {
        const y = py + (s + 0.5) / SOUS;
        croisements.length = 0;
        for (const a of aretes) {
          const bas = a.y0 < a.y1 ? a.y0 : a.y1;
          const haut = a.y0 < a.y1 ? a.y1 : a.y0;
          if (y < bas || y >= haut) continue;
          croisements.push({
            x: a.x0 + ((y - a.y0) / (a.y1 - a.y0)) * (a.x1 - a.x0),
            sens: a.sens,
          });
        }
        if (croisements.length === 0) continue;
        croisements.sort((u, v) => u.x - v.x);

        let enroulement = 0;
        let debut = 0;
        for (const c of croisements) {
          const avant = enroulement;
          enroulement += c.sens;
          if (avant === 0 && enroulement !== 0) debut = c.x;
          else if (avant !== 0 && enroulement === 0) this.#span(couverture, debut, c.x, 1 / SOUS);
        }
      }

      const rangee = py * this.largeur * 4;
      for (let px = 0; px < this.largeur; px++) {
        const a = couverture[px] * opacite;
        if (a <= 0) continue;
        this.#poser(rangee + px * 4, r, g, b, a > 1 ? 1 : a);
      }
    }
  }

  /** Ajoute la couverture d'un segment horizontal [xa, xb) à une rangée,
      les pixels des deux bouts au prorata de la fraction couverte. */
  #span(couverture, xa, xb, poids) {
    const a = Math.max(0, xa);
    const b = Math.min(this.largeur, xb);
    if (b <= a) return;

    const premier = Math.floor(a);
    const dernier = Math.ceil(b) - 1;
    if (premier === dernier) {
      couverture[premier] += (b - a) * poids;
      return;
    }
    couverture[premier] += (premier + 1 - a) * poids;
    for (let i = premier + 1; i < dernier; i++) couverture[i] += poids;
    couverture[dernier] += (b - dernier) * poids;
  }

  /** Composition « source par-dessus », en alpha droit. */
  #poser(i, r, g, b, a) {
    const fondA = this.px[i + 3];
    const sortieA = a + fondA * (1 - a);
    if (sortieA === 0) return;
    this.px[i] = (r * a + this.px[i] * fondA * (1 - a)) / sortieA;
    this.px[i + 1] = (g * a + this.px[i + 1] * fondA * (1 - a)) / sortieA;
    this.px[i + 2] = (b * a + this.px[i + 2] * fondA * (1 - a)) / sortieA;
    this.px[i + 3] = sortieA;
  }

  /** Encode la toile en PNG (couleur 6, 8 bits, non entrelacé). */
  png() {
    const brut = Buffer.alloc(this.hauteur * (1 + this.largeur * 4));
    let o = 0;
    for (let y = 0; y < this.hauteur; y++) {
      brut[o++] = 0; // filtre « None » : le contenu est plat, zlib fait le reste
      for (let x = 0; x < this.largeur; x++) {
        const i = (y * this.largeur + x) * 4;
        const a = this.px[i + 3];
        brut[o++] = arrondi8(this.px[i]);
        brut[o++] = arrondi8(this.px[i + 1]);
        brut[o++] = arrondi8(this.px[i + 2]);
        brut[o++] = arrondi8(a * 255);
      }
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.largeur, 0);
    ihdr.writeUInt32BE(this.hauteur, 4);
    ihdr[8] = 8;  // profondeur
    ihdr[9] = 6;  // RGBA
    // 10-12 : compression 0, filtrage 0, entrelacement 0 — déjà à zéro.

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      bloc('IHDR', ihdr),
      bloc('IDAT', deflateSync(brut, { level: 9 })),
      bloc('IEND', Buffer.alloc(0)),
    ]);
  }
}

const arrondi8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

/* ── Structure PNG ────────────────────────────────────────────────────── */

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const octet of buf) c = TABLE_CRC[(c ^ octet) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloc(type, donnees) {
  const entete = Buffer.alloc(8);
  entete.writeUInt32BE(donnees.length, 0);
  entete.write(type, 4, 'ascii');
  const queue = Buffer.alloc(4);
  queue.writeUInt32BE(crc32(Buffer.concat([entete.subarray(4), donnees])), 0);
  return Buffer.concat([entete, donnees, queue]);
}
