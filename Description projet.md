# Le Club

*Description mise à jour au 27 juillet 2026 — remplace le PDF initial. Reflète ce qui a
été validé dans le design doc (`Le Club.dc.html`, 8 tours), les arbitrages donnés ensuite,
et l'organisation en `frontend/` / `backend/`.*

---

## Le projet

Une plateforme qui connecte des gens en recherche de stage, de job ou de conseils, autour
d'**événements de cohésion** (foot en salle, bar, ateliers) parfois thématiques
(ex : bar autour de la création de CV).

Le principe qui tient tout : **on n'entre que parrainé.** Un candidat ne crée pas son
profil tout seul, c'est son maître de stage qui l'invite et qui écrit un mot sur lui.
C'est cette recommandation signée que les entreprises voient en premier.

---

## Direction artistique validée

Épurée, éditoriale, sans couleur d'accent.

| | |
|---|---|
| Fond de l'app | `#f7f5ef` — fond de page `#f0eee9` |
| Noir du Club | `#14140f` (cartes pleines, boutons, onglet actif) |
| Textes | `#77746a` secondaire · `#8a877c` micro-labels · `#a5a296` inactif |
| Cartes | blanc `#fff`, bordure `rgba(0,0,0,.1)`, rayon 16 |
| Titres & chiffres | **Instrument Serif** — italique pour les citations |
| Interface | **Outfit** |
| Micro-labels capitales | **JetBrains Mono** 10px, `letter-spacing: .08em` |
| Format | mobile, cadre 380 × 800 |

Vocabulaire d'interface récurrent : micro-label mono au-dessus de chaque bloc, filtres
carrés (rayon 7), boutons contour en pilule qui se remplissent de noir au survol, onglet
actif marqué `◈` / inactif `◇`, avatars hachurés en attendant les photos.

---

## Entrée dans le Club

Un seul écran avant la création de compte : **l'invitation nominative** (7 jours de
validité). « Léa Ferrand te fait entrer dans Le Club, Camille. » On y voit déjà la note et
le commentaire du parrain (non modifiables), et le rappel du prix : **100 €/an, tout
compris**. Accepter l'invitation entre directement dans l'app.

> Écarté : l'écran intermédiaire « parrainage en 3 temps » (code + reco en attente de
> signature + cotisation) qui figurait dans une version précédente. Retiré à la demande —
> l'invitation suffit, le prix y est déjà annoncé.

---

## Point de vue CANDIDAT

**5 onglets** : Chercher · Stages · Agenda · Forum · Qui suis-je ?

- **Chercher** — l'annuaire du Club, avec une bascule **Personnes / Boîtes**.
  Côté Personnes : les 128 membres, avec un badge `PARRAIN` sur les maîtres de stage, et un
  bouton « Écrire » sur chaque ligne. Côté Boîtes : on cherche un endroit d'abord, on voit
  combien de membres y sont passés et combien de parrains y sont actifs, puis qui y était.
- **Stages** — *pas encore dessiné.* Le pendant candidat de « Offres » côté entreprise :
  les stages proposés et la candidature.
- **Agenda** — « A vos agendas ». Filtres Tout / Sport / Bar / Atelier. Chaque événement
  porte sa date en gros, le nombre d'inscrits, les places restantes, et une action
  (« Je viens », « Liste d'attente », « Me prévenir » pour ceux qui n'ont pas encore ouvert).
- **Forum** — fils de discussion votés, façon Reddit : `club/stage-fiance`,
  `club/reco-cv`, `club/foot-du-jeudi`. Tri Populaire / Récent / Mes fils, pièces jointes,
  bouton flottant pour ouvrir un fil.
- **Qui suis-je ?** — modifier mon profil : photo, bio en deux lignes, stage recherché,
  disponibilités, 3 expériences maximum, CV et LinkedIn, avec un bouton « Aperçu » pour
  voir ce que les entreprises verront. C'est maintenant un onglet à part entière (avant,
  cet écran n'était atteignable que par l'échafaudage de dev).

---

## Point de vue ENTREPRISE

**2 onglets seulement** : Talents · Offres.

> Arbitrage : la vue entreprise est volontairement restreinte à ces deux usages —
> rechercher des candidats potentiels, et gérer ses offres. Pas d'Agenda ni de Forum côté
> entreprise pour l'instant (ces deux écrans restent codés et partagés en interne, mais ne
> sont plus branchés à la navigation entreprise).

- **Talents** — la recherche de candidats potentiels. Une grande **carte flip**, une à la
  fois, qu'on fait tourner en tapant dessus.

  | Face A | Face B |
  |---|---|
  | La note globale (`4.6`) | Le stage recherché |
  | Le parrain et son rôle | Les disponibilités |
  | Son commentaire, en italique | Les expériences principales |
  | | Accès : CV · LinkedIn · lettre de reco |

  Filtres par critère : `Tous` / `4.5+` / `Dispo été` / réglages.

- **Offres** — « Mes offres » : les offres en ligne avec le nombre de candidatures reçues
  et de non lues, les brouillons, les clôturées, et la publication d'une nouvelle offre
  (« Visible par les 128 profils parrainés »).

---

## Modèle économique

- **Candidats** : 100 €/an → accès à la plateforme + tous les événements (foot, ateliers,
  soirées, bières incluses). C'est affiché tel quel à l'inscription.
- **Entreprises** : *pas encore tranché.* Accès payant à l'app ? Aux événements ?
  Commission à l'embauche d'un stagiaire ?

---

## Où en est le code

```
Le Club/
├── frontend/                  ← l'app, un fichier par onglet
│   ├── package.json           React + TypeScript, scaffoldé avec Vite
│   ├── index.html             point d'entrée Vite : polices, <div id="root">
│   └── src/
│       ├── main.tsx           monte <App/>, importe styles.css
│       ├── App.tsx            le routeur : rôle × onglet
│       ├── types.ts           la forme des données (interfaces TypeScript)
│       ├── tokens.ts          palette + polices — seul endroit à toucher pour la DA
│       ├── data.ts             toutes les données factices, à remplacer par le backend
│       ├── atoms.tsx           briques communes : StatusBar, Card, TabBar, Screen…
│       ├── DevChrome.tsx        barre de dev hors du téléphone (échafaudage, pas l'app)
│       ├── styles.css           le seul <style> global (cadre téléphone, carte flip…)
│       └── screens/
│           ├── ScreenChercher.tsx        Chercher (candidat)
│           ├── ScreenStagesCandidat.tsx  Stages (candidat, placeholder)
│           ├── ScreenEvents.tsx          Agenda (candidat)
│           ├── ScreenForum.tsx           Forum (candidat)
│           ├── ScreenProfil.tsx          Qui suis-je ? (candidat)
│           ├── ScreenTalents.tsx         Talents (entreprise)
│           ├── ScreenOffres.tsx          Offres (entreprise)
│           └── ScreenInvitation.tsx      écran d'entrée (pas un onglet)
└── backend/
    └── README.md               dossier réservé, rien d'implémenté — voir plus bas
```

React + TypeScript, servi par un vrai serveur de dev local (Vite) :

```
cd frontend
npm install
npm run dev
```

puis ouvrir l'URL affichée (`http://localhost:5173` par défaut). `npm run build` produit
une version statique dans `frontend/dist/` (pas versionnée, voir `.gitignore`).

### Comment les onglets sont nommés

Chaque écran porte son propre nom : `ScreenChercher.tab = { id: 'chercher', label:
'Chercher' }`, à la fin de son fichier. `App.tsx` construit la liste d'onglets par rôle en
important les écrans eux-mêmes, jamais en retapant leur nom :

```ts
const TABS: Record<Role, TabScreen[]> = {
  candidat:   [ScreenChercher, ScreenStagesCandidat, ScreenEvents, ScreenForum, ScreenProfil],
  entreprise: [ScreenTalents, ScreenOffres],
};
```

et `TabBar` lit `Ecran.tab.label` directement. Renommer un onglet, ou décider qui l'a dans
sa navigation, se fait à un seul endroit — jamais deux noms différents pour le même écran
entre la barre du bas et son titre.

Correspondance avec le design doc :

| Design | Fichier |
|---|---|
| 2a | `ScreenTalents.tsx` |
| 6a | `ScreenOffres.tsx` |
| 8a / 8b | `ScreenChercher.tsx` |
| 3a | `ScreenEvents.tsx` |
| 4b | `ScreenForum.tsx` |
| 5a2 | `ScreenInvitation.tsx` |
| 5b | `ScreenProfil.tsx` |
| — | `ScreenStagesCandidat.tsx` *(placeholder)* |
| ~~5a~~ | *retiré* |

Ce qui marche déjà : la navigation entre onglets (5 côté candidat, 2 côté entreprise), la
recherche qui filtre vraiment, les filtres de chaque écran, la carte qui tourne, le deck de
profils, les votes du forum, l'entrée directe invitation → app.

Ce qui est volontairement inerte : « Écrire », « Voir », « Publier une offre »,
« Je viens », les pièces (CV / LinkedIn / reco), l'ouverture d'un fil, « Enregistrer » sur
« Qui suis-je ? ».

### `backend/`

Vide pour l'instant, volontairement : le choix technique (langage, base de données,
hébergement) est une vraie décision d'architecture, à prendre ensemble avant d'écrire du
code. `backend/README.md` liste ce qu'il devra couvrir, à partir des écrans déjà dessinés,
et pointe vers `frontend/src/data.js` comme contrat de données provisoire.

---

## À trancher

1. **L'onglet Stages côté candidat** n'existe pas encore. À dessiner.
2. **Comment on atteint « Invitation »** en dehors d'un lien e-mail one-shot, et **comment
   on bascule candidat / entreprise** : deux comptes distincts ? Un choix à l'inscription ?
   Pour l'instant, barre de dev sous le téléphone.
3. **Le modèle entreprise.**
4. **Le choix technique du backend.**
5. **Les données de remplissage** à valider : les faces B de Yanis et Inès, et les boîtes
   Deloitte / BNP Paribas / Sia Partners (seule Rothschild & Co figure dans le design).
