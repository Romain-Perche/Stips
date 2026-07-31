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

## `GET /config` — la première route, et la seule qui ne casse jamais

Le mobile embarque déjà son client (`mobile/src/config/miseAJour.ts`), désactivé par un flag
en attendant. C'est la route la plus simple du lot et elle n'engage aucun choix de stack :
un fichier JSON statique sur le même hébergement que la politique de confidentialité suffit
à l'activer, des mois avant un vrai backend.

```json
{ "versionMinimale": "1.0.0",
  "urlStore": { "ios": "https://apps.apple.com/…", "android": "https://play.google.com/…" },
  "message": "facultatif — remplace le texte par défaut de l'écran" }
```

Sa forme est écrite dans `packages/core/src/version.ts` (`ConfigDistante`). **On n'y retire
jamais un champ et on n'en change jamais le type** : c'est elle qui dit aux vieux binaires
d'aller se mettre à jour, elle doit donc rester lisible par le plus vieux client encore
vivant. C'est ce qui permet à toutes les *autres* routes de casser leur contrat un jour.

Discipline associée (détaillée dans `mobile/RELEASE.md`) : ne jamais remonter
`versionMinimale` vers une version en ligne depuis moins de 2-3 semaines, et prévoir à terme
un **426 Upgrade Required** sur les autres routes — c'est là qu'est l'application réelle,
`/config` au démarrage n'est que le chemin poli.

## Trois exigences dictées par les stores, pas par le produit

Elles ne sortiraient jamais de la liste d'écrans ci-dessus, et pourtant elles bloquent.

- **Un compte de démo pour le reviewer.** L'app est sur invitation *et* payante : un
  reviewer Apple ne peut pas entrer, et sans identifiants fonctionnels dans les notes de
  review c'est un rejet 2.1 « unable to review ». Il faut un compte semé qui n'expire pas,
  dont l'invitation échappe à la validité de 7 jours, et qui atteint le contenu payant sans
  payer. (Aujourd'hui, en données factices et sans réseau, l'app est reviewable sans compte
  — le besoin naît avec l'authentification.)
- **La suppression de compte depuis l'app** (règle 5.1.1(v) d'Apple). Exigence dure dès
  qu'il y a création de compte, non reportable au-delà. Elle impose une sémantique de
  cascade à décider avec le schéma : que devient l'avis d'un parrain sur un candidat
  supprimé, et que deviennent les avis d'un parrain supprimé sur les autres ?
- **Un chemin de rectification pour les avis de parrainage.** Le parrain écrit une note et
  un commentaire signé *sur* le candidat, présentés comme non modifiables et vus en premier
  par les entreprises. C'est une donnée personnelle sur une personne nommée, collectée
  auprès d'un tiers, qui pilote une décision la concernant : les articles 15 (accès), **16
  (rectification)** et 21 (opposition) du RGPD s'appliquent. « Non modifiable par le
  candidat » se défend comme « il ne réécrit pas les mots du parrain », pas comme « il n'a
  aucun recours ». Il faut donc un droit de réponse ou de contestation, et probablement une
  trace d'audit. **À trancher avant d'écrire le schéma**, pas après.

Rien de tout ça n'est urgent : `packages/core/src/data.ts` sert de contrat de données
provisoire. Quand on construit le backend, cette liste (structure des objets `DATA`, et les
types qui l'accompagnent dans `packages/core/src/types.ts`) est le point de départ le plus
fiable de ce qu'une API doit renvoyer. C'est aussi l'endroit naturel pour un futur
`packages/api` (client HTTP + schémas de validation) une fois la stack choisie — pas avant.
