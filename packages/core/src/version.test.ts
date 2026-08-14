/* ══════════════════════════════════════════════════════════════════════
   Tests de comparerVersions — la fonction qui décide si un binaire se
   bloque lui-même. Un bug ici a deux visages, tous les deux mauvais : le
   verrou ne se déclenche jamais (il ne sert à rien), ou il se déclenche à
   tort et affiche « mets à jour » à des gens déjà à jour — sans aucun
   moyen de les débloquer à distance, le binaire étant déjà chez eux.

   Lancés par `node --test` : pas de dépendance, Node retire les types
   lui-même (d'où `erasableSyntaxOnly` dans tsconfig.json, et l'extension
   .ts explicite à l'import, qu'exige le résolveur ESM de Node).
   ══════════════════════════════════════════════════════════════════════ */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparerVersions } from './version.ts';

/* ── Le sens de la comparaison ────────────────────────────────────────
   miseAJour.ts bloque quand `comparerVersions(version, minimale) < 0`.
   Un signe inversé transformerait le verrou en son contraire exact : il
   ne bloquerait QUE les versions à jour. C'est le test qui compte. */

test('une version plus ancienne que la minimale est négative — donc bloquée', () => {
  assert.equal(comparerVersions('0.1', '1.0.0'), -1);
});

test('une version plus récente que la minimale est positive — donc passante', () => {
  assert.equal(comparerVersions('1.1.0', '1.0.0'), 1);
});

test('la version exactement minimale passe', () => {
  assert.equal(comparerVersions('1.0.0', '1.0.0'), 0);
});

/* ── Les segments manquants ───────────────────────────────────────────
   C'est ce qui autorise `version: '0.1'` dans app.config.ts (voir
   AGENTS.md § Tags). Si '0.2' et '0.2.0' cessaient d'être égaux, une
   version à deux segments deviendrait plus petite que sa propre
   équivalente à trois — et se bloquerait elle-même. */

test('les segments absents valent 0 : 0.2 égale 0.2.0', () => {
  assert.equal(comparerVersions('0.2', '0.2.0'), 0);
  assert.equal(comparerVersions('0.2.0', '0.2'), 0);
});

test('un correctif à trois segments est plus grand que sa base à deux', () => {
  assert.equal(comparerVersions('0.2.1', '0.2'), 1);
});

/* ── Comparaison numérique, pas lexicographique ───────────────────────
   Le piège classique : en tri de chaînes, '0.10' < '0.9'. Ça ne se voit
   pas avant la dixième version mineure, soit longtemps après la mise en
   ligne — exactement quand on ne teste plus le verrou. */

test('0.10 est plus grand que 0.9, pas plus petit', () => {
  assert.equal(comparerVersions('0.10', '0.9'), 1);
});

test('1.0.10 est plus grand que 1.0.9', () => {
  assert.equal(comparerVersions('1.0.10', '1.0.9'), 1);
});

/* ── Robustesse : échouer ouvert ──────────────────────────────────────
   Le verrou ne bloque que sur une certitude (voir miseAJour.ts). Une
   valeur illisible dégrade en 0 plutôt que de lever : une réponse
   malformée de /config ne doit ni bloquer personne, ni faire crasher le
   démarrage de l'app. */

test('une valeur illisible dégrade en 0 au lieu de lever', () => {
  assert.equal(comparerVersions('pas une version', '0.0.0'), 0);
});

test('une chaîne vide dégrade en 0', () => {
  assert.equal(comparerVersions('', ''), 0);
});

test('un segment non numérique vaut 0 sans casser les suivants', () => {
  assert.equal(comparerVersions('1.x.3', '1.0.3'), 0);
});

test('un suffixe de pré-release est ignoré', () => {
  assert.equal(comparerVersions('1.2.0-beta.1', '1.2.0'), 0);
});

/* ── Antisymétrie ─────────────────────────────────────────────────────
   Inverser les arguments doit inverser le signe, sur toutes les formes
   ci-dessus. C'est la propriété qu'un cas particulier oublié casserait
   en premier. */

test('inverser les arguments inverse le signe', () => {
  const paires: [string, string][] = [
    ['0.1', '1.0.0'],
    ['0.2', '0.2.0'],
    ['0.10', '0.9'],
    ['1.0.10', '1.0.9'],
    ['0.2.1', '0.2'],
    ['1.2.0-beta.1', '1.2.0'],
    ['pas une version', '1.0.0'],
  ];
  for (const [a, b] of paires) {
    // Formulé en somme et non en `x === -y` : pour deux versions égales, le
    // second membre vaudrait -0, que `assert.equal` distingue de 0.
    assert.equal(
      comparerVersions(a, b) + comparerVersions(b, a),
      0,
      `${a} vs ${b} : la comparaison n'est pas antisymétrique`,
    );
  }
});
