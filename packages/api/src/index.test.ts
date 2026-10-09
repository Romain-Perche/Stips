import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Demande, ErreurApi, PersonneAnnuaire, PersonneRecrutement, Vide, creerClient } from './index.ts';

const recrutement: PersonneRecrutement = {
  id: '0b8a2c1e-5f3d-4a6b-9c7e-1d2f3a4b5c6d',
  prenom: 'Inès',
  nom: 'Martin',
  role: 'membre',
  accord: null,
  description: 'Deuxième année, finance de marché.',
  cherche: 'Stage de 6 mois en M&A',
  dispo: 'Janvier 2027',
  cvUrl: 'https://stockage.example/cv/signe',
  recos: [
    {
      qualificatif: 'rigueur',
      commentaire: 'Fiable du premier au dernier jour.',
      parrainNom: 'Léa Ferrand',
      creeLe: '2026-06-30T09:00:00+02:00',
    },
  ],
};

// Le test qui compte : une ligne complète passée au schéma d'annuaire en
// ressort sans partie 2, sans recos, sans CV — c'est la garde contre la fuite.
test("PersonneAnnuaire retire tout ce qui n'est pas la partie 1", () => {
  const ligneComplete = { ...recrutement, stripeCustomerId: 'cus_x', authUserId: 'y' };
  assert.deepEqual(Object.keys(PersonneAnnuaire.parse(ligneComplete)).sort(), [
    'accord',
    'description',
    'id',
    'nom',
    'prenom',
    'role',
  ]);
});

test('PersonneRecrutement accepte sa propre forme', () => {
  assert.deepEqual(PersonneRecrutement.parse(recrutement), recrutement);
});

const client = (statut: number, corps: unknown) =>
  creerClient('https://api.example', async (url) => {
    assert.equal(url, 'https://api.example/v1/x');
    return new Response(JSON.stringify(corps), { status: statut });
  });

test('le client rend la réponse validée', async () => {
  assert.deepEqual(await client(200, recrutement).lire('/v1/x', PersonneRecrutement), recrutement);
});

test('le client refuse une réponse hors contrat', async () => {
  await assert.rejects(
    client(200, { ...recrutement, recos: 'aucune' }).lire('/v1/x', PersonneRecrutement),
    (e) => e instanceof ErreurApi && e.statut === 0,
  );
});

test('le client remonte le statut HTTP (426 : binaire trop vieux)', async () => {
  await assert.rejects(
    client(426, {}).lire('/v1/x', PersonneRecrutement),
    (e) => e instanceof ErreurApi && e.statut === 426,
  );
});

test("le client affiche la phrase du serveur, pas le code HTTP", async () => {
  await assert.rejects(
    client(410, { message: 'Ce lien a expiré.' }).ecrire('/v1/x', {}, Vide),
    (e) => e instanceof ErreurApi && e.statut === 410 && e.message === 'Ce lien a expiré.',
  );
});

test('les e-mails sont normalisés avant de servir de clé', () => {
  const d = Demande.parse({
    filleulPrenom: ' Camille ', filleulNom: 'Roux', filleulEmail: 'Camille@Example.org ',
    parrainNom: 'Léa Ferrand', parrainEmail: 'LEA@bnp.example',
  });
  assert.equal(d.filleulEmail, 'camille@example.org');
  assert.equal(d.parrainEmail, 'lea@bnp.example');
  assert.equal(d.filleulPrenom, 'Camille');
});
