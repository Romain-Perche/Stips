/* ══════════════════════════════════════════════════════════════════════
   VERSION — le contrat du verrou de version minimale.

   Pourquoi ça existe : sans ce verrou, le jour où quelqu'un installe une
   version, son contrat d'API est gelé à vie. On ne peut plus renommer un
   champ ni supprimer une route sans casser des téléphones qu'on n'a aucun
   moyen de joindre. Et ça ne se rattrape pas : un binaire compilé sans le
   verrou n'obéira jamais, quoi qu'on lui envoie. Il doit donc être dans le
   PREMIER binaire qui atteint un utilisateur (voir mobile/RELEASE.md).

   La valeur de `versionMinimale` ne vit pas ici, elle vient du backend.
   Une version minimale gravée dans le binaire ne peut plus être remontée
   après coup — soit exactement le contraire du but.

   Le contrat vit dans core parce qu'il lie deux côtés (voir
   backend/README.md). Core reste pur : des types et une comparaison, zéro
   I/O — `fetch` n'est même pas typé ici (lib ES2023, pas de DOM). L'appel
   réseau vit côté mobile, dans src/config/miseAJour.ts.
   ══════════════════════════════════════════════════════════════════════ */

/** Réponse de `GET /config`. La seule route dont le contrat ne peut jamais
    casser : c'est elle qui dit aux vieux binaires d'aller se mettre à jour,
    elle doit donc rester lisible par le plus vieux client encore vivant.
    On n'y retire jamais un champ, on n'en change jamais le type. */
export interface ConfigDistante {
  /** Version « X.Y.Z » en dessous de laquelle l'app se bloque. */
  versionMinimale: string;
  /** Lien de mise à jour par plateforme. Absent → l'écran n'affiche pas de
      bouton : l'identifiant App Store n'existe pas avant la 1re soumission,
      et un lien mort vaut moins que pas de lien. */
  urlStore?: { ios?: string; android?: string };
  /** Phrase affichée à la place du texte par défaut. Le backend peut y
      citer un numéro de version, le binaire ne peut pas (il ne connaît pas
      la version qui le remplacera). */
  message?: string;
}

/** Compare deux versions « X.Y.Z » : -1 si a < b, 0 si égales, 1 si a > b.

    Volontairement minimal, pas de dépendance `semver` : on ne gère que des
    segments numériques, ce qui est tout ce que `version` d'app.config.ts et
    les deux stores acceptent. Un suffixe de pré-release (« 1.2.0-beta.1 »)
    est ignoré — il ne peut pas exister dans un binaire soumis.

    De la valeur illisible dégrade en 0 plutôt que de lever : combiné à
    l'échec ouvert du verrou (voir miseAJour.ts), une réponse malformée ne
    bloque personne. */
export function comparerVersions(a: string, b: string): -1 | 0 | 1 {
  const segments = (v: string): number[] =>
    v
      .split('-')[0]
      .split('.')
      .map((n) => Number.parseInt(n, 10) || 0);

  const sa = segments(a);
  const sb = segments(b);

  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const ecart = (sa[i] ?? 0) - (sb[i] ?? 0);
    if (ecart !== 0) return ecart < 0 ? -1 : 1;
  }
  return 0;
}
