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

## Versionner l'API : `/v1`, et `/config` en dehors

Les routes métier vivent toutes sous un préfixe de version — `/v1/talents`, `/v1/events`,
`/v1/offres`. `/config` reste à la racine.

Ce n'est pas une inconséquence. **Un préfixe de version sert à pouvoir éteindre `/v1`** :
servir `/v1` et `/v2` côte à côte le temps que les vieux binaires disparaissent, puis
débrancher le premier. Si le binaire périmé interrogeait `/v1/config`, `/v1` ne pourrait
jamais s'éteindre — le couper couperait du même geste le seul canal par lequel on lui
apprend qu'il est périmé. Le préfixe perdrait exactement la propriété pour laquelle on
l'ajoute.

| | `/config` | `/v1/…` |
| --- | --- | --- |
| Parle de | l'app | le produit |
| Authentification | aucune | oui |
| Contrat | immortel | remplaçable par `/v2` |
| Peut être servi par | un JSON statique | le backend seul |

`apiUrl` (dans `extra` de `mobile/app.config.ts`) reste la racine du domaine, sans `/v1` :
la version appartient au chemin, pas au binaire. La ranger dans `apiUrl` la gèlerait dans
chaque build, et passer à `/v2` demanderait une soumission store — soit l'inverse du but.

### Additif veut dire : on ajoute, on ne retire pas, on ne retype pas

Le mobile n'a pas de bouton « tout le monde recharge la page ». Une v0.3 installée
aujourd'hui appellera encore ce backend dans un an. Trois gestes, trois statuts :

| Geste | Statut |
| --- | --- |
| Ajouter un champ | libre — s'il est optionnel, ou s'il a une valeur pour les lignes existantes |
| Retirer un champ | on continue de le servir tant qu'un binaire vivant le lit |
| Changer le type d'un champ | jamais |

Retyper est le piège le plus tentant parce que ça ressemble à une correction : passer
`note: '4.6'` à `note: 4.6` assainit le schéma et casse en silence le binaire qui faisait
`note.startsWith(…)`. Le nom n'a pas bougé, rien ne prévient. Un champ qui doit changer de
type change de nom : on ajoute le nouveau, on sert les deux, on retire l'ancien quand plus
personne ne le lit.

**Le seul cas où « additif » ne protège pas** : changer le *sens* d'un champ à nom et type
constants — `dispo` qui donnait la date de début et donnerait celle de fin, `passes` qui
comptait les passages et compterait les places. Aucun typecheck, aucun 426, aucun test de
contrat ne l'attrape : les deux côtés compilent et l'app affiche une donnée fausse. Ça se
traite comme un retrait — nouveau nom, période de recouvrement.

### Ce que `/v1` ne dispense pas de faire

Ouvrir `/v2` ne fait disparaître personne. Tant qu'un binaire installé lit `/v1`, `/v1`
vit : c'est `versionMinimale` qui le condamne, pas la mise en ligne de `/v2`. Le préfixe
achète le droit de casser le contrat, il n'abrège pas le délai — et le **426** évoqué plus
haut est ce qui rend la condamnation effective sur ces routes-là. Discipline de remontée
dans `mobile/RELEASE.md`.

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

Rien de tout ça n'est urgent tant qu'il n'y a ni compte ni réseau — mais les trois se
décident avec le schéma, pas après lui.

## D'où viennent les types

`packages/core/src/data.ts` et `packages/core/src/types.ts` tiennent lieu de contrat
provisoire, et restent le point de départ le plus fiable pour savoir *ce que* l'API devra
renvoyer. La règle de sens, elle, est ferme dès maintenant.

**Les types descendent du backend vers les apps, jamais l'inverse.** `types.ts` est
provisoire et le restera : le jour où un backend existe, c'est lui la source, et ces
interfaces sont remplacées — pas resynchronisées à la main. Sinon la même vérité est
maintenue à trois endroits et diverge au premier oubli.

### `DATA` décrit une maquette, pas une base

C'est la réserve à garder en s'en servant : ces objets ont été écrits pour alimenter un
rendu, pas pour modéliser des données. Quatre écarts, tous présents aujourd'hui :

- **Des chaînes déjà mises en forme.** `pied: '14 inscrits · 4 places'`,
  `dispo: 'Janv. → Juin 2027 · 6 mois'`, `meta: 'club/reco-cv · Léa F. · marraine · 5 h'`,
  `jour: '12'` + `mois: 'SEPT'`. Une API qui renverrait ça figerait la typographie française
  dans le serveur — et `pied: '31 inscrits · complet'` montre où ça mène : un compte et un
  état fondus dans la même chaîne, illisibles séparément. **Le serveur renvoie des nombres
  et des dates ; les apps écrivent les phrases.**
- **Une incohérence de type déjà installée.** `Invitation.note` est une `string` (`'4.6'`),
  `Talent.note` un `number` (`4.9`) — deux vérités pour la même notion, exactement ce qu'un
  contrat unique élimine.
- **Des liens par nom.** `Talent.parrain: 'Léa Ferrand'` désigne la même personne qu'une
  entrée de `membres`, sans clé étrangère ; il faudra des identifiants. Dans la même veine,
  `membresTotal: 128` est un compteur d'affichage désolidarisé de `membres.length`.
- **Des doublons présentation / donnée**, dont la bonne moitié est déjà là : `dispoEte`
  (`boolean`) à côté de `dispo`, `heures` (`number`) à côté de `meta`. C'est cette moitié-là
  qui ressemble à ce que l'API doit renvoyer.

### Le mécanisme se choisit avec la stack

Le principe ci-dessus n'en dépend pas ; sa mise en œuvre si. Deux voies, une seule à retenir
le moment venu :

- **Backend TypeScript dans ce monorepo** → des schémas partagés (zod ou équivalent), types
  inférés depuis eux. Une seule déclaration, et la validation à l'exécution vient avec.
- **Backend dans un autre langage, ou service externe** → le backend publie son schéma
  (OpenAPI, introspection) et les types TS en sont **générés** par un script. Générés, pas
  recopiés : une recopie est une divergence à retardement.

Dans les deux cas la destination est un futur **`packages/api`** (client HTTP + schémas),
**pas `packages/core`** : core est délibérément pur — zéro dépendance runtime, `lib` ES2023
sans `DOM`, au point que `fetch` n'y est même pas typé (voir l'en-tête de
`packages/core/src/version.ts`). Un client réseau n'y entre pas. À créer une fois la stack
choisie, pas avant.

### Valider aux frontières, dans les deux cas

Un type TypeScript ne garantit rien à l'exécution : il décrit ce que le backend a promis,
pas ce qu'il a envoyé. Toute donnée qui entre est donc validée avant usage. Le geste existe
déjà en miniature dans `mobile/src/config/miseAJour.ts` : la réponse de `/config` est
vérifiée avant d'être crue, et une réponse malformée dégrade vers `null` au lieu de lever.
Aujourd'hui c'est un `typeof` d'une ligne — c'est le réflexe qui se généralise, pas la ligne.
