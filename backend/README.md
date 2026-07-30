# Backend — Le Club

Dossier réservé. Rien n'est implémenté ici : `frontend/` et `mobile/` fonctionnent
aujourd'hui avec des données factices (`packages/core/src/data.ts`, partagées entre les
deux), sans aucun appel réseau.

## Ce qui manque avant de commencer

Le choix technique (langage, framework, base de données, hébergement) est une décision
d'architecture — **à prendre ensemble avant d'écrire du code ici**, pas à deviner.

## Ce que le backend devra couvrir, quand on s'y met

D'après les écrans déjà dessinés côté `frontend/` :

- **Comptes & parrainage** — un candidat n'existe que parrainé par un maître de stage :
  invitation nominative, note et commentaire signés par le parrain, cotisation.
- **Profils candidats** — bio, stage recherché, disponibilités, expériences, CV, LinkedIn.
- **Profils entreprises** — accès à l'annuaire, recherche de candidats par critères.
- **Offres de stage** — publication côté entreprise, candidature côté candidat.
- **Événements** — liste, inscriptions, places restantes.
- **Forum** — fils, votes, réponses.

Rien de tout ça n'est urgent : `packages/core/src/data.ts` sert de contrat de données
provisoire. Quand on construit le backend, cette liste (structure des objets `DATA`, et les
types qui l'accompagnent dans `packages/core/src/types.ts`) est le point de départ le plus
fiable de ce qu'une API doit renvoyer. C'est aussi l'endroit naturel pour un futur
`packages/api` (client HTTP + schémas de validation) une fois la stack choisie — pas avant.
