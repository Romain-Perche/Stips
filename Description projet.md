# Stips

*Description mise à jour au 27 juillet 2026 — remplace le PDF initial. Reflète ce qui a
été validé dans le design doc (`Le Club.dc.html`, 8 tours — nom d'alors, renommé Stips
depuis), les arbitrages donnés ensuite, et l'organisation en `frontend/` / `backend/`.*

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
| Noir de Stips | `#14140f` (cartes pleines, boutons, onglet actif) |
| Textes | `#77746a` secondaire · `#8a877c` micro-labels · `#a5a296` inactif |
| Cartes | blanc `#fff`, bordure `rgba(0,0,0,.1)`, rayon 16 |
| Titres & chiffres | **Instrument Serif** — italique pour les citations |
| Interface | **Outfit** |
| Micro-labels capitales | **JetBrains Mono** 10px, `letter-spacing: .08em` |
| Format | mobile, cadre 380 × 800 |
| Type de compte | `#780000` Stipeur · `#003049` Pro |

La dernière ligne est la **seule** entorse au « sans couleur d'accent », et elle est
délibérée : en haut à gauche de chaque écran, là où une maquette de téléphone met l'heure,
le rôle sous lequel on est connecté, écrit dans sa couleur. Rien d'autre dans l'app ne
porte ces deux teintes, ce qui est exactement ce qui les rend lisibles d'un coup d'œil.
Une seule déclaration, `ROLES` dans `packages/core/src/tokens.ts` : le libellé y sert
aussi au bandeau de bascule de rôle, en capitales.

Vocabulaire d'interface récurrent : micro-label mono au-dessus de chaque bloc, filtres
carrés (rayon 7), boutons contour en pilule qui se remplissent de noir au survol, onglet
actif marqué `◈` / inactif `◇`, avatars hachurés en attendant les photos.

---

## Entrée dans Stips

**On n'entre que parrainé, et il y a deux chemins pour y arriver.** Les deux produisent le
même objet — une recommandation signée par un pro, qui fait exister un membre — et ne
diffèrent que par qui commence, et par le fait que le pro ait déjà un compte ou non. C'est
une seule table `parrainage` avec un statut, pas deux mécanismes (voir
`backend/README.md`).

| | Le stagiaire demande | Le pro invite |
|---|---|---|
| Initié par | le futur membre | un pro déjà dans Stips |
| Le pro remplit | un formulaire **web**, sans installer l'app | l'app |
| Peut aussi | créer son compte pro à la fin du formulaire | — |
| Validation manuelle | oui | **non** — le pro est déjà vérifié |
| Le stagiaire reçoit | un lien qui ouvre l'app | un lien qui ouvre l'app |

**Le formulaire du pro est une page web, ni un PDF ni l'app.** C'est le point de conversion
le plus critique du produit : un pro qui rend un service à son stagiaire. Lui demander
d'installer une application pour remplir un formulaire, c'est la friction maximale au pire
endroit. Un PDF, lui, ne valide rien, ne se signe pas de façon traçable, se retape à la
main, et casse la trace d'audit qu'impose l'article 16 du RGPD sur cette donnée précise
(voir `backend/README.md`). La proposition de créer un compte pro arrive **à la fin** du
formulaire, une fois le service rendu — jamais avant.

L'invitation reçue par le stagiaire est ce que montre déjà `ScreenInvitation.tsx` : la note
et le commentaire du parrain (non modifiables), le rappel du prix, 7 jours de validité.
Accepter entre directement dans l'app.

> Écarté : l'écran intermédiaire « parrainage en 3 temps » (code + reco en attente de
> signature + cotisation) qui figurait dans une version précédente. Retiré à la demande —
> l'invitation suffit, le prix y est déjà annoncé.

---

## Les deux rôles : MEMBRE et PRO

Deux rôles, et deux seulement. **« Parrain » n'en est pas un troisième** : c'est ce qu'est un
pro ayant signé au moins une recommandation, donc une propriété déduite et non un type de
compte. Un membre qui devient pro quatre ans plus tard garde le même compte, ses fils de
forum et la reco qu'il a reçue.

**Un pro a accès à presque tout** : les mêmes cinq onglets qu'un membre, avec deux
différences seulement.

| Onglet | MEMBRE | PRO |
|---|---|---|
| Recherche | l'annuaire — **partie 1 des profils seulement** | identique |
| Stages / Offres | les offres des pros, et la candidature | ses offres, les candidatures reçues, **et le deck des membres en recherche** |
| Agenda | identique | identique |
| Forum | identique | identique |
| Qui suis-je ? | partie 1 **et** partie 2 | partie 1 seulement |

**La carte flip a quitté l'onglet Recherche pour l'onglet Offres des pros.** C'est ce qui
règle la question des recos : l'annuaire ne montre que la partie 1 d'un profil — photo et
description — donc **un membre ne lit jamais la note ni le commentaire de parrainage d'un
autre membre**. Tout ce qui est sensible (notes, commentaires, CV, partie 2) ne se voit que
côté pro, et seulement pour les membres qui se sont déclarés en recherche.

> Arbitrage : la liste initiale portait deux onglets côté pro pour publier une offre
> (« mettre des offres de stage » et « proposer des stages »). Fondus en un seul — c'est le
> même geste, et « Offres » existe déjà (`ScreenOffres.tsx`). Les membres en recherche n'y
> réapparaissent pas non plus : c'est exactement ce que sert l'onglet Recherche. Ce que
> montre « Offres », que Recherche ne montre pas, ce sont les **candidatures reçues**.

Cette symétrie n'est pas cosmétique : elle veut dire que la liste d'onglets par rôle dans
`App.tsx` diffère d'un seul écran, et que la vue entreprise à 2 onglets a disparu.

### Les onglets, en détail

- **Recherche** — l'annuaire, avec sa bascule **Personnes / Boîtes** (`ScreenChercher.tsx`,
  écrans 8a / 8b). Ne montre que la partie 1 des profils, avec un badge `PRO` sur les
  pros et un bouton pour écrire. Côté Boîtes : on cherche un endroit d'abord, on voit combien
  de membres y sont passés et combien de parrains y sont actifs, puis qui y était.

- **Stages** (membre) — *premier jet écrit, web et mobile* (`ScreenStagesCandidat.tsx`).
  Les offres publiées par les pros, filtre Tout / Mes candidatures, et un bouton « Postuler »
  par offre. En bas, le pendant du « Publier une offre » du pro : un rappel que c'est la
  partie 2 de « Qui suis-je ? » qui rend visible.

- **Offres** (pro) — l'espace de recrutement, qui porte trois choses : les offres en ligne
  avec leur nombre de candidatures reçues et non lues, les candidatures de chacune derrière
  son « Voir », et le **deck de cartes flip** des membres déclarés en recherche — une carte à
  la fois, qu'on fait tourner en tapant dessus.

  | Face A | Face B |
  |---|---|
  | Le qualificatif choisi par le parrain (`Autonomie`) | Le stage recherché |
  | Le parrain et son rôle | Les disponibilités |
  | Son commentaire, en italique | |
  | Bouton **Contacter** | |

  Un bouton sur la carte ouvre le **profil complet** : toutes les notes, tous les
  commentaires, le CV. C'est un troisième état, au-delà des deux faces.

  Une **bascule interne** à deux entrées, Offres / Talents, du même genre que le
  Personnes / Boîtes de Recherche, avec le titre qui change selon la section. Écrite, web et
  mobile (`ScreenOffres.tsx`). Les candidatures ne sont **pas** une troisième entrée : elles
  appartiennent à une offre, donc elles vivent derrière le « Voir » de cette offre — un niveau
  de profondeur, pas un onglet. Le deck n'y est pas recopié : `ScreenTalents.tsx` n'exporte
  plus qu'un `TalentDeck`, que cette section monte. Et les compteurs de candidatures y sont
  **calculés** depuis `DATA.candidatures`, jamais lus dans `Offre.recues` — sinon la carte
  annonce 12 et le détail en montre 2.
- **Agenda** — « A vos agendas ». Chaque événement porte sa date en gros, le nombre
  d'inscrits, les places restantes, et une action (« Je viens », « Liste d'attente »,
  « Me prévenir » pour ceux qui n'ont pas encore ouvert).
- **Forum** — des forums thématiques façon Reddit : `stips/stage-fiance`, `stips/reco-cv`,
  `stips/foot-du-jeudi`. Chacun porte des **fils**, qui portent eux-mêmes des réponses —
  le slug est le forum, pas le fil. Pièces jointes, bouton flottant pour ouvrir un fil.
- **Qui suis-je ?** — en **deux parties** :
  - *Partie 1*, pour tout le monde : photo et une courte description de soi.
  - *Partie 2*, réservée aux membres et remplie seulement si une recherche de stage est
    envisagée : stage recherché, disponibilités, 3 expériences maximum, CV et LinkedIn,
    avec un bouton « Aperçu ». **C'est le fait de remplir cette partie qui met un membre
    dans le deck Recherche** — un seul interrupteur, pas deux notions à synchroniser.

### Ce que cette révision retire

Une seule chose : **les catégories d'événement** (`Sport` / `Bar` / `Atelier`), et avec elles
la rangée de filtres de l'Agenda.

Les votes du forum et la vue Boîtes, un temps candidats à la suppression, restent tous les
deux. Le vote change en revanche de comportement : une personne a **un** vote par fil, donc
un second clic sur ▲ le modifie ou l'annule au lieu de l'empiler comme aujourd'hui. Voir
`backend/README.md` § le forum.

✅ Le code applique ce modèle depuis le 16 août 2026, côté web **et** mobile : `Role` vaut
`'membre' | 'pro'`, les deux rôles ont les cinq mêmes onglets à un écran près,
`ScreenTalents.tsx` n'est plus un onglet mais le `TalentDeck` monté par `ScreenOffres.tsx`,
la partie 2 de « Qui suis-je ? » ne s'affiche que pour un membre, et `DATA` a perdu ses
`cats`. Reste la correction du type `Offre` (voir `TODO.md`).

---

## Modèle économique

- **Membres** : 100 €/an → accès à la plateforme + tous les événements (foot, ateliers,
  soirées, bières incluses). C'est affiché tel quel à l'inscription.
- **Pros** : **gratuit**, et c'est désormais un choix assumé plutôt qu'une question ouverte.
  Un pro accède à presque tout sans payer : c'est la contrepartie du parrainage, qui est ce
  qui alimente le produit. Le revenu vient donc entièrement des membres, et une commission
  à l'embauche resterait la seule piste côté pro si elle devait s'ouvrir un jour.

⚠️ Si le paiement passe par l'in-app purchase, Apple et Google prélèvent 15 à 30 % — soit
environ 15 €/membre/an à intégrer au modèle, pas un détail technique. Voir « À trancher », son
entrée *in-app purchase* : la formulation de ce que les 100 € achètent détermine si l'IAP est
obligatoire.

---

## Où en est le code

```
Stips/
├── frontend/                  ← l'app, un fichier par onglet
│   ├── package.json           React + TypeScript, scaffoldé avec Vite
│   ├── index.html             point d'entrée Vite : polices, <div id="root">
│   └── src/
│       ├── main.tsx           monte <App/>, importe styles.css
│       ├── App.tsx            le routeur : rôle × onglet
│       ├── types.ts           le seul type non partageable (TabScreen, propre au web)
│       ├── tokens.ts          ré-export de la palette de @stips/core
│       ├── atoms.tsx           briques communes : StatusBar, Card, TabBar, Screen…
│       ├── role.ts             le rôle courant, par contexte (badge + partie 2)
│       ├── DevChrome.tsx        barre de dev hors du téléphone (échafaudage, pas l'app)
│       ├── styles.css           le seul <style> global (cadre téléphone, carte flip…)
│       └── screens/
│           ├── ScreenChercher.tsx        Recherche (les deux rôles)
│           ├── ScreenStagesCandidat.tsx  Stages (membre, placeholder)
│           ├── ScreenEvents.tsx          Agenda (les deux rôles)
│           ├── ScreenForum.tsx           Forum (les deux rôles)
│           ├── ScreenProfil.tsx          Qui suis-je ? (les deux rôles)
│           ├── ScreenTalents.tsx         le deck de cartes flip, monté par Offres (plus un onglet)
│           ├── ScreenOffres.tsx          Offres (pro)
│           └── ScreenInvitation.tsx      écran d'entrée (pas un onglet)
├── mobile/                     le portage React Native (Expo) — voir plus bas
├── packages/core/              @stips/core : types, DATA, palette, logo, version
└── backend/
    └── README.md               stack arrêtée, rien d'implémenté — voir plus bas
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
  membre: [ScreenChercher, ScreenStagesCandidat, ScreenEvents, ScreenForum, ScreenProfil],
  pro:    [ScreenChercher, ScreenOffres,         ScreenEvents, ScreenForum, ScreenProfil],
};
```

et `TabBar` lit `Ecran.tab.label` directement. Renommer un onglet, ou décider qui l'a dans
sa navigation, se fait à un seul endroit — jamais deux noms différents pour le même écran
entre la barre du bas et son titre.

Cinq onglets de chaque côté, un seul écran de différence. `ScreenChercher.tsx` est dans la
nav des deux rôles ; `ScreenTalents.tsx` n'y est plus — le deck de cartes est monté par
`ScreenOffres.tsx` et n'est plus un onglet à lui seul. La même liste, mot pour mot, existe
dans `mobile/App.tsx` : les deux doivent bouger ensemble.

Le rôle courant n'est en revanche **pas** une prop qui descend d'écran en écran : deux
consommateurs seulement (le badge de la barre d'état, la partie 2 de « Qui suis-je ? »),
mais tous les deux profondément enfouis, et côté mobile React Navigation ne transmet que
ses propres props. D'où un contexte, `RoleCtx` (`frontend/src/role.ts` et
`mobile/src/role.ts`), dont la valeur `null` — personne n'est connecté — est ce qui fait
qu'aucun badge n'apparaît sur l'écran d'invitation.

Correspondance avec le design doc :

| Design | Fichier |
|---|---|
| 2a | `ScreenTalents.tsx` — absorbé par l'onglet Offres du pro, plus un onglet |
| 6a | `ScreenOffres.tsx` — devient l'espace de recrutement (offres + candidatures + deck) |
| 8a / 8b | `ScreenChercher.tsx` — l'onglet Recherche des deux rôles, partie 1 seulement |
| 3a | `ScreenEvents.tsx` |
| 4b | `ScreenForum.tsx` |
| 5a2 | `ScreenInvitation.tsx` |
| 5b | `ScreenProfil.tsx` |
| — | `ScreenStagesCandidat.tsx` *(placeholder)* |
| ~~5a~~ | *retiré* |

Ce qui marche déjà : la navigation entre onglets (5 de chaque côté, un seul écran de
différence), le badge de rôle en haut à gauche, la recherche qui filtre vraiment, les
filtres de chaque écran, la carte qui tourne, le deck de profils derrière la bascule
Offres / Talents, le détail des candidatures d'une offre, la candidature à un stage, les
votes du forum, l'entrée directe invitation → app.

Ce qui est volontairement inerte : « Écrire », « Voir », « Publier une offre »,
« Je viens », les pièces (CV / LinkedIn / reco), l'ouverture d'un fil, « Enregistrer » sur
« Qui suis-je ? ».

### `mobile/` — le portage React Native (Expo)

Les mêmes écrans, portés en React Native : mêmes noms de fichiers et mêmes données (`DATA`
et les types qui la composent viennent tous deux de `packages/core`, plus de copie
jumelle), mais primitives RN (`View`/`Text`/`Pressable`) au lieu des `div`/`span`, React
Navigation à la place du routeur maison, et Reanimated à la place des transitions CSS.

**Le développement passe par un development build, pas par Expo Go.** Un binaire qui
contient nos propres dépendances natives et le client de développement, fabriqué par EAS et
installé une fois ; ensuite Metro sert le JS et le rechargement est immédiat. On ne
recompile qu'en cas de changement de dépendance native. C'est ce qui a permis de sortir du
SDK 54 : Expo Go plafonnait le projet, puisque Apple bloque en review ses nouvelles builds
depuis mai 2026. Expo est désormais sur le dernier SDK stable — voir `mobile/AGENTS.md`.

Deux pièges du portage web → RN, corrigés, à garder en tête pour les prochains écrans :

- **Pas de `transform-style: preserve-3d` en React Native.** Les enfants ne partagent pas
  l'espace 3D du parent. La carte flip ne peut donc pas se faire « un conteneur qui tourne
  + une face contre-tournée » comme sur le web : chaque face porte sa propre rotation
  (A 0→180°, B 180→360°) et on bascule la visibilité à mi-course, quand les deux sont de
  profil. Voir `src/screens/ScreenTalents.tsx`.
- **En RN tout est flex.** Le web pouvait neutraliser `alignItems` avec `display: block` ;
  en RN il s'applique toujours, et un `alignItems:'flex-end'` laissé sur un conteneur en
  colonne pousse le contenu à droite au lieu du bas. C'était la cause des titres d'écran
  décalés.

### `backend/`

Vide pour l'instant, volontairement : le choix technique (langage, base de données,
hébergement) est une vraie décision d'architecture, à prendre ensemble avant d'écrire du
code. `backend/README.md` liste ce qu'il devra couvrir, à partir des écrans déjà dessinés,
et pointe vers `packages/core/src/data.ts` comme contrat de données provisoire.

---

## À trancher

1. **Les données de remplissage des boîtes** : Deloitte, BNP Paribas et Sia Partners sont
   inventées — seule Rothschild & Co figure dans le design. Les faces B ne sont plus une
   question : elles viennent de la partie 2 de « Qui suis-je ? », donc de ce que le membre a
   saisi.
2. **Les 100 €/an : in-app purchase ou paiement web ?** Décision business autant que
   technique, à prendre avant la release qui introduit le paiement — mais ses conséquences
   sur la copie et sur le backend se décident avant, elles.

   **Ce qui est en jeu.** La règle 3.1.1 d'Apple impose l'IAP pour le contenu numérique
   (15-30 % de commission). Mais la règle **3.1.5(a)** dit l'inverse pour les biens et
   services consommés **hors** de l'app. Or les 100 € achètent « accès à la plateforme +
   tous les événements » : l'annuaire, le forum et les offres sont numériques, les
   événements sont des services du monde réel. **La façon dont on formule ce que les 100 €
   achètent détermine quelle règle s'applique.** Vendus comme *accès aux événements*, avec
   les fonctions numériques offertes avec le compte, il y a un vrai argument 3.1.5(a).
   Vendus comme *accès à la plateforme*, Apple y lit un abonnement numérique. Ce n'est pas
   une garantie — les reviewers varient — mais c'est un cadrage à décider délibérément et
   à tenir de façon cohérente entre le site, l'écran d'invitation et les CGU, plutôt qu'à
   découvrir en review.

   **Le contournement web** (payer sur le web, l'app ne fait que débloquer) est légal, mais
   l'app ne doit alors **ni mentionner ni lier** le paiement externe.

   **Conséquence immédiate, dans les deux cas :** la ligne « 100 € / an, tout compris »
   affichée sous le CTA de l'écran d'invitation (§ Écrans, invitation) change. Route web →
   elle disparaît, et « C'est quoi Stips ? » ne doit pas mener à une page avec un bouton
   de paiement. Route IAP → elle devient un bloc de divulgation complet (nom de
   l'abonnement, durée, prix par période, contenu, liens vers Confidentialité **et** CGU).
   C'est aujourd'hui la seule mention de paiement de toute l'app.

   Coût de la route IAP, à chiffrer comme repli : 30 % la 1re année puis 15 % chez Apple,
   15 % chez Google, ou 15 % à plat via le Small Business Program ; plus la validation de
   reçu côté serveur, le « restore purchases » obligatoire, et l'accord Paid Apps avec ses
   formulaires bancaires et fiscaux (encore un parcours d'identité de plusieurs jours).

### Tranché depuis

- **Les rôles** — deux, `membre` et `pro`, un pro accède à presque tout, « parrain » est une
  propriété déduite. Remplace « deux comptes distincts ? » et « le modèle entreprise ».
- **La stack backend** — Fastify + Drizzle + Postgres derrière notre propre API. Voir
  `backend/README.md`.
- **Le chemin d'entrée** — deux origines, une seule table `parrainage`, formulaire web pour
  le pro sans compte. Pas de validation manuelle quand le pro a déjà un compte : il est déjà
  vérifié. Le nom du parrain est conservé même s'il n'a jamais créé de compte.
- **Les recos ne sont pas visibles par les pairs** — l'annuaire s'arrête à la partie 1, et
  la carte flip vit dans l'onglet Offres du pro.
- **Les votes du forum restent**, avec un vote par personne et par fil.
- **La vue Boîtes reste**, dans l'onglet Recherche.
- **Tout le monde peut écrire à tout le monde** — donc pas de table d'autorisation, mais un
  blocage et une limite de débit qui deviennent le seul frein.
- **La cascade de suppression de compte** — la reco part avec le membre supprimé, les recos
  écrites par un pro supprimé restent, les messages restent chez leurs destinataires.
- **Le recours sur une reco est le signalement**, et rien d'autre : pas de droit de réponse
  affiché, zéro colonne ajoutée. « La reco est forcément bonne » ne suffisait pas
  juridiquement — le raisonnement est dans `backend/README.md`.
- **L'objectif immédiat est une app de démo** — les quatre points qui bloquent une vraie mise
  en ligne sont parqués dans `backend/README.md` § avant la mise en ligne réelle.
