# Backend — Stips

**Rien n'est encore implémenté ici**, mais la stack et le schéma sont arrêtés (13 août 2026).
`frontend/` et `mobile/` fonctionnent toujours avec des données factices
(`packages/core/src/data.ts`, partagées entre les deux), sans aucun appel réseau.

## La stack

| | |
|---|---|
| Serveur | **Fastify**, TypeScript, dans ce monorepo (`backend/`) |
| Base | **Postgres** |
| Requêtes et migrations | **Drizzle** |
| Base managée, auth, stockage de fichiers | **Supabase**, région UE |
| Hébergement du serveur | **Railway**, région EU West |
| Client HTTP et schémas partagés | un futur `packages/api` |

**Supabase est de l'infrastructure, pas le backend.** Les apps ne parlent jamais à la base
directement et la RLS n'est pas notre couche d'autorisation : elles parlent à Fastify, qui
parle à Postgres. La raison est écrite plus bas dans ce fichier — le contrat additif et le
préfixe `/v1` supposent une couche qu'on contrôle. Dans le modèle « le client parle à la
base », le schéma de tables *est* l'API publique : renommer une colonne casse les binaires
installés, et il n'existe plus aucun endroit où faire vivre `/v1` et `/v2` côte à côte.

Ce qu'on prend de Supabase : Postgres managé et sauvegardé, l'auth par lien magique, le
stockage objet des CV et des photos avec ses URL signées. Ce qu'on ignore : son client JS
côté app, et la RLS comme mécanisme d'autorisation. Le corollaire est qu'il reste
remplaçable — Postgres est standard, le stockage est S3-compatible, l'auth est la seule
pièce à recâbler si on en sort.

Drizzle plutôt que Prisma pour une raison précise : le rang de liste d'attente (plus bas)
s'écrit avec une fonction fenêtre, et on retomberait de toute façon dans du SQL brut.

### Railway, et ses trois pièges

Railway héberge **le serveur, et lui seul** : la base, l'auth et le stockage restent chez
Supabase. Ne pas cliquer sur « add Postgres » dans son tableau de bord — ça créerait une
deuxième base, vide, à côté de la vraie.

- **La région ne vaut pas l'Europe par défaut.** Elle se choisit à la création du service, et un
  serveur aux États-Unis devant une base en Europe annule d'un coup l'argument RGPD *et* ajoute
  un aller-retour transatlantique à chaque requête. `EU West` (Amsterdam), explicitement.
- **Écouter sur `0.0.0.0`, et sur `process.env.PORT`.** C'est la première cause de « ça marche
  en local, 502 en ligne » : Fastify écoute `localhost` par défaut, ce qui est invisible depuis
  l'extérieur du conteneur, et le port est imposé par l'hébergeur.
- **Le monorepo demande des commandes explicites.** Les workspaces npm hissent les dépendances à
  la racine : l'installation doit s'y faire, pas dans `backend/`. En pratique `npm ci` à la
  racine, puis un build et un start ciblés (`-w backend`).

Un conteneur long, pas du serverless : le pooling de connexions Postgres en serverless est un
problème gratuit à cette échelle.

**Railway donne une URL HTTPS immédiatement** (`*.up.railway.app`), donc rien n'attend le nom de
domaine pour déployer — le garde-fou `https` de `mobile/app.config.ts` est même satisfait tel
quel. Le domaine reste souhaitable pour une seule raison, mais elle compte : le formulaire de
parrainage doit être cliqué par un pro qui ne connaît pas Stips, et
`stips-production-a3f2.up.railway.app/parrainage/…` n'inspire pas confiance.

### Auth : lien magique par e-mail, et rien d'autre

- **L'invitation *est* le lien magique.** Le chemin d'entrée et le chemin de connexion sont
  le même mécanisme, avec la même validité limitée. Un seul système à opérer.
- **Pas de login social ⇒ pas de « Sign in with Apple » obligatoire.** La règle 4.8 d'Apple
  ne se déclenche que si l'app propose un login tiers. L'e-mail seul en dispense.
- **Ce mécanisme ne s'écrit pas à la main.** Entropie du jeton, usage unique, expiration,
  rejeu : c'est le seul endroit de la pile où « je le fais moi-même » est un mauvais calcul.

### L'e-mail transactionnel est un composant, pas un détail

Quatre e-mails portent le produit : la demande envoyée au pro, la notification de validation,
l'invitation envoyée au stagiaire, le lien de connexion. **Un lien magique qui tombe en spam
est un membre qui ne peut pas entrer.** Donc un fournisseur d'envoi dédié dès le départ —
l'envoyeur intégré de Supabase Auth est limité en débit et n'est pas fait pour la production
— et SPF/DKIM/DMARC configurés sur le domaine.

### L'échelle ne change aucune de ces décisions

Cible : 100 à 1 000 personnes au départ, 10 000 à 50 000 espérées. Postgres ne bronche pas à
50 000 lignes de `personne`. Ce qui se tend à cette taille est humain, pas technique :

- la validation manuelle des demandes ne survit pas à quelques dizaines par jour, d'où un
  drapeau `admin` délégable plutôt qu'une personne câblée en dur ;
- la modération du forum et de la messagerie devient un poste, pas une tâche ;
- le volume d'e-mails devient une ligne de budget.

Le seul point technique à prévoir est l'index du deck de recherche (`role`, `en_recherche`,
plus un index trigramme sur les noms). Un index, pas une réécriture.

## Deux rôles, et « parrain » n'en est pas un

`personne.role` vaut `membre` ou `pro` : une colonne, pas une table — deux valeurs stables,
et une personne n'a qu'un rôle à la fois.

- **« Parrain » se déduit** de `parrainage` : c'est un pro qui a signé au moins une reco. Pas
  un type de compte, un rôle dans une relation. C'est aussi ce qui permet à un membre de
  devenir pro quatre ans plus tard sans changer d'identité — ses fils de forum, ses
  inscriptions et la reco qu'il a reçue restent accrochés à la même ligne.
- **`admin` est un booléen séparé**, orthogonal au rôle : la personne qui valide les demandes
  est aussi un membre ou un pro. Un troisième rôle ne composerait pas.
- Le changement de rôle a un effet gratuit : le deck filtre sur
  `role = 'membre' AND en_recherche`, donc un membre devenu pro en sort de lui-même.
- **Pas de colonne `sexe`.** Le seul usage réel dans les écrans est l'accord grammatical
  (« marraine », « ta maître de stage ») : ce qui se stocke est donc le terme voulu par la
  personne, nullable, avec un repli neutre. Plus juste fonctionnellement, et conforme à la
  minimisation qu'impose l'article 5.1.c du RGPD.

## Le schéma

Dix-huit tables. Le principe qui les gouverne toutes tient en une phrase : **rien de
dérivable ne se stocke, et rien de mis en forme n'entre en base.** La base garde des nombres,
des dates et des clés étrangères ; les apps écrivent les phrases (voir « DATA décrit une
maquette » plus bas).

| Table | Ce qu'elle porte |
|---|---|
| `personne` | identité, `role`, `admin`, partie 1 du profil, partie 2 nullable (dont `niveau_experience`) + `en_recherche`, `auth_user_id` |
| `entreprise` | nom, secteur, domaine e-mail |
| `experience` | `personne_id` × `entreprise_id`, intitulé, `debut`, `fin` |
| `parrainage` | la reco : note, commentaire, statut, origine, identités en attente |
| `abonnement` | les 100 €/an : période, `stripe_customer_id` |
| `forum` | `slug`, libellé |
| `fil` | `forum_id`, `auteur_id`, titre, corps, `score` |
| `reponse` | `fil_id`, `auteur_id`, corps |
| `vote` | `personne_id` × `fil_id`, `valeur` (+1 / −1) |
| `abonnement_forum` | `personne_id` × `forum_id` |
| `evenement` | date, lieu, `capacite`, `ouverture_inscriptions` |
| `inscription` | `evenement_id` × `personne_id`, `created_at` — l'ordre fait le rang |
| `offre` | `pro_id`, `entreprise_id`, intitulé, publiée le, clôturée le |
| `candidature` | `offre_id` × `personne_id`, `lu_at` |
| `conversation` | la paire, `dernier_message_at` |
| `message` | `conversation_id`, `expediteur_id`, corps, `lu_at` |
| `blocage` | `bloqueur_id` × `bloque_id` |
| `signalement` | qui, quoi, motif |

Six d'entre elles sont de pures tables de liaison — inévitables, et c'est ce qui explique le
compte.

**Pas de table `carte`.** La carte flip n'a aucune donnée propre : ses deux faces sont composées
de `personne`, `parrainage` et `experience`. C'est une route (`GET /v1/talents`), pas une
entité. Une table `carte` serait une vue déguisée, c'est-à-dire la forme d'un écran gravée dans
le schéma, fausse au premier redesign.

**`niveau_experience` est déclaré, pas déduit** — tranché ainsi, contre ma recommandation. La
conséquence à connaître : il peut contredire les lignes d'`experience` affichées juste en
dessous sur le profil complet. C'est un choix de produit assumé — le membre résume lui-même son
niveau — et pas une incohérence à corriger ; mais le jour où les deux divergent visiblement,
c'est là qu'il faut regarder.

### Les valeurs qu'on ne stocke pas

Elles sont toutes dans `DATA` aujourd'hui, en colonne ou fondues dans une chaîne :

| Dans la maquette | En base |
|---|---|
| `pied: '14 inscrits · 4 places'` | `capacite`, et un `COUNT(*)` sur `inscription` |
| `pied: '31 inscrits · complet'` | « complet » se déduit du compte et de la capacité |
| `heures: 2`, `duree: '6 mois'` | des timestamps et des dates |
| `jour: '12'` + `mois: 'SEPT'` | un `timestamptz` |
| `note: 4.6` sur le talent | une note par `parrainage`, la globale est une moyenne |
| `membresTotal: 128`, `passes: 4`, `parrains: 2` | des `COUNT(*)` |
| `meta: 'stips/reco-cv · Léa F. · marraine · 5 h'` | trois clés étrangères et une date |

**Une seule exception, et elle a une raison : les clés de tri.** `fil.score` et
`conversation.dernier_message_at` sont dérivées et pourtant stockées, parce que trier une
liste sur un `COUNT(*)` ou un `MAX()` calculé en sous-requête ne peut pas utiliser d'index.
Ce sont les deux seules. Le critère est « dérivé **et** clé de tri », pas « ça
m'arrangerait ».

`fil.score` mérite d'être relu, parce qu'il ressemble trait pour trait au `votes: 48` de la
maquette que le tableau ci-dessus condamne. La différence est entière : **la source de vérité
reste une ligne par vote** dans `vote`, et `score` n'en est qu'un cache de tri, recalculable
par un `COUNT(*)` à tout moment. Un compteur seul, sans les lignes, ne saurait ni empêcher un
double vote ni le retirer.

### Ce que la base fait, et que le code ne refait pas

- `inscription` en clé primaire `(evenement_id, personne_id)` : la double inscription est
  impossible, sans une ligne de code.
- **Les places se règlent par l'ordre d'arrivée, pas par un verrou.** On insère tout le
  monde ; les `capacite` premiers par `created_at` sont inscrits, les suivants sont en
  attente. Pas de vérification-puis-insertion, donc pas de survente, et une annulation
  promeut le suivant sans rien faire. Plafond connu : *notifier* la personne promue
  demandera un job.
- `experience.entreprise_id` pointe vers une table `entreprise` curée, jamais du texte
  libre : « BNP Paribas », « BNP » et « BNP PARIBAS SA » feraient trois entreprises et
  couperaient en trois les compteurs de la vue Boîtes. Ce qu'un utilisateur saisit
  librement va dans une file de modération, pas directement dans la table.
- Des **UUID**, pas des entiers auto-incrémentés : dans un club privé, des identifiants
  énumérables laissent deviner la taille de l'annuaire et parcourir les profils un par un.

### Deux projections d'une même personne, et jamais `select *`

L'onglet Recherche ne montre que **la partie 1** du profil : photo et description. La partie 2
— stage cherché, disponibilités, niveau d'expérience — et avec elle les notes, les commentaires
de parrainage et le CV, n'apparaissent que dans l'onglet Offres des pros, pour les membres
déclarés en recherche. **Une reco n'est donc jamais lue par un pair.**

Ce n'est pas un filtre de lignes, c'est un **filtre de colonnes** : la même ligne `personne` se
sert sous deux formes selon qui la demande. Deux conséquences :

- **Deux schémas de réponse déclarés séparément dans `packages/api`** — quelque chose comme
  `PersonneAnnuaire` et `PersonneRecrutement`. Le mode de défaillance à empêcher est connu et
  bête : un jour, une route d'annuaire renvoie l'objet complet parce que c'était plus court à
  écrire, et les recos fuient. Un `select *`, ou un type de ligne Drizzle renvoyé tel quel,
  suffit à le produire.
- **Un argument de plus contre la RLS comme couche d'autorisation.** La RLS filtre des lignes ;
  masquer des colonnes selon le rôle du demandeur y demande des vues ou des privilèges par
  colonne. Dans Fastify, c'est une clause `select` et un schéma de sortie.

### Le forum

Les votes restent. **Un vote est une ligne** : `vote(personne_id, fil_id, valeur)`, clé
primaire sur les deux premières colonnes. C'est la base qui interdit alors le double vote, et
retirer son vote devient possible. `valeur` vaut +1 ou −1 — l'écran porte bien deux flèches
(`ScreenForum.tsx`) et le score peut descendre.

⚠️ Le comportement change au passage, et c'est une correction : aujourd'hui l'écran laisse
cliquer ▲ autant de fois qu'on veut. Avec une ligne par personne et par fil, un second clic
modifie ou annule le vote au lieu de l'empiler.

Les deux tris de l'écran retombent sur des colonnes indexées : « Populaire » sur `fil.score`,
« Récent » sur `fil.created_at`. Le vote ne porte que sur les fils, pas sur les réponses —
c'est ce que fait l'écran, et une table suffit.

`forum` est une table de deux colonnes plutôt qu'un `CHECK` ou une énumération Postgres, et
c'est la cible d'échelle qui tranche : à 10 000 membres la liste des forums bougera (par
école, par secteur), et ajouter une valeur à une énumération est une migration à chaque fois
— une table, c'est un `INSERT`. Elle donne en plus une vraie clé étrangère à
`abonnement_forum`, et un endroit où poser plus tard une description ou une visibilité par
rôle.

### La messagerie

Le bouton « Contacter » est sur la face A de la carte : la messagerie n'est plus une
hypothèse. En tête-à-tête seulement, sans groupe et sans pièce jointe.

`conversation(a_id, b_id)` avec un index unique sur la paire ordonnée, puis
`message(conversation_id, expediteur_id, corps, created_at, lu_at)`. La table `conversation`
existe pour une seule raison : sans elle, lister ses conversations demande de normaliser la
paire avec `LEAST`/`GREATEST` dans une sous-requête. Ça marche, et c'est exactement le genre
d'astuce qu'on redéchiffre à 3 h du matin. Trois colonnes rendent la requête ennuyeuse et
indexable.

Non lus : `COUNT(*)` sur les messages de mes conversations où `expediteur_id <> moi` et
`lu_at IS NULL`.

**`blocage` et `signalement` ne sont pas optionnelles.** La règle 1.2 d'Apple s'applique dès
qu'il y a du contenu généré par les utilisateurs — le forum et la messagerie en sont — et
elle exige quatre choses : un filtrage, un moyen de signaler, un moyen de bloquer un
utilisateur abusif, un contact publié. `blocage(bloqueur_id, bloque_id)` fait deux colonnes
et conditionne l'insertion d'un message. C'est une contrainte de mise en ligne, pas une
prévision.

**Tout le monde peut écrire à tout le monde** — tranché. Donc aucune table d'autorisation, et
une conséquence à assumer : `blocage` n'est plus une case à cocher pour le store, c'est le
**seul frein du système**. Avec un annuaire ouvert et 50 000 comptes, le message non sollicité
est le vecteur d'abus par défaut. Deux garde-fous, et aucun des deux n'est une table : une
**limite de débit** à l'envoi (les n premiers messages par jour vers des personnes qui ne
t'ont jamais répondu), et le chemin de signalement. Le blocage se vérifie à l'insertion d'un
message.

## Le flux d'inscription

Deux origines, **une seule table**. Un `parrainage` porte un `statut` et une `origine` ; le
chemin « le pro invite » démarre simplement plus loin dans la même machine à états.

Les états sont nommés par ce qu'ils attendent, ce qui rend le raccourci du second chemin
lisible d'un coup d'œil :

```
 stagiaire_demande ──▶ attente_pro ──▶ attente_validation ──┐
                                                             ├──▶ attente_acceptation ──▶ acceptee
 pro_invite ─────────────────────────────────────────────────┘
                       (pro déjà vérifié : pas de validation)

 sorties, à toute étape : refusee · expiree
```

- **`attente_pro`** — le stagiaire donne son nom, son e-mail et celui de son maître de stage.
  Ça crée la ligne et envoie au pro un lien porteur d'un jeton. Le jeton, plutôt qu'une URL
  publique, fait trois choses : le formulaire arrive prérempli avec l'identité du stagiaire
  (moins de friction à l'endroit critique), on sait quel pro a été sollicité, et il n'existe
  aucun point d'entrée public à spammer.
- **`attente_validation`** — le pro a rempli la note et le commentaire, sur une page web
  servie par `frontend/`, sans compte et sans installer l'app. La création d'un compte pro est
  proposée **après**, jamais comme préalable. Validation manuelle, et sans back-office : deux
  liens à jeton dans l'e-mail de notification (valider / refuser) suffisent au volume actuel,
  à remplacer par un écran quand les liens deviendront pénibles.
- **`attente_acceptation`** — **le chemin `pro_invite` démarre ici** : un pro déjà dans Stips
  est déjà vérifié, sa parole n'a pas à repasser par une validation.
- **`acceptee`** — le stagiaire ouvre le lien dans l'app, son compte est créé, le membre
  existe.

⚠️ Le raccourci déplace la charge anti-abus, il ne la supprime pas : à partir du deuxième pro,
c'est une **chaîne de confiance**, et un seul compte pro négligent peut injecter des membres
arbitraires. Le garde-fou qui coûte le moins cher n'est pas une file de validation mais un
**plafond** — n invitations par pro et par mois. Un compteur, pas une étape.

**`parrainage` ne peut pas n'avoir que des clés étrangères.** Aux deux premières étapes, ni le
stagiaire ni parfois le pro n'ont de compte : la table porte donc à la fois `filleul_id` /
`parrain_id` nullables **et** `filleul_email`, `filleul_nom`, `parrain_email`, `parrain_nom` en
texte, remplis au dépôt et complétés par les clés à l'acceptation.

**`parrain_nom` ne s'efface jamais**, y compris quand la clé étrangère finit par exister. Un
membre doit pouvoir dire qui l'a parrainé même si ce pro n'a jamais créé de compte — c'est la
moitié de la valeur de la reco. Deux effets, un bon et un à assumer :

- L'affichage « parrainé par Léa Ferrand » se lit sur `parrainage`, sans jointure vers
  `personne`. Une colonne au lieu d'un `LEFT JOIN` qui pourrait ne rien trouver.
- Le nom d'un pro survit donc à la suppression de son compte. C'est défendable — une reco
  anonyme ne vaut rien, et l'attribution est constitutive du document — mais ça **doit être
  écrit dans le formulaire qu'il signe**, pas découvert après. C'est la même décision de
  cascade que la règle 5.1.1(v) impose de trancher, vue du côté du parrain.

Ce n'est donc pas une duplication à regretter : une reco est **l'instantané d'une
déclaration**, et le nom sous lequel elle a été signée fait partie du dossier — c'est
exactement ce qu'exige la trace d'audit décrite plus bas.

> Alternative écartée : créer la ligne `personne` tout de suite, avec un statut `invitee`.
> Le schéma serait plus propre, mais toute requête listant des membres devrait filtrer sur
> ce statut — un filtre qu'on oublie une fois, et des gens qui n'ont rien accepté
> apparaissent dans l'annuaire. Le mode de défaillance est pire que la duplication.

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

## Quatre exigences dictées par les stores, pas par le produit

Elles ne sortiraient jamais de la liste d'écrans, et pourtant elles bloquent.

- **Un compte de démo pour le reviewer.** L'app est sur invitation *et* payante : un
  reviewer Apple ne peut pas entrer, et sans identifiants fonctionnels dans les notes de
  review c'est un rejet 2.1 « unable to review ». Il faut un compte semé qui n'expire pas,
  dont l'invitation échappe à la validité de 7 jours, et qui atteint le contenu payant sans
  payer. (Aujourd'hui, en données factices et sans réseau, l'app est reviewable sans compte
  — le besoin naît avec l'authentification.)
- **La modération du contenu généré** (règle 1.2). Le forum et la messagerie en produisent :
  filtrage, signalement, blocage d'un utilisateur abusif, contact publié. D'où les tables
  `blocage` et `signalement` — voir « La messagerie » plus haut.
- **La suppression de compte depuis l'app** (règle 5.1.1(v) d'Apple). Exigence dure dès
  qu'il y a création de compte, non reportable au-delà. La sémantique de cascade est
  tranchée, et elle n'est pas uniforme — chaque clé étrangère répond à une question
  différente :

  | Ce qui est supprimé | Ce qui devient |
  |---|---|
  | Un membre | sa reco part avec lui — elle ne parle que de lui (`ON DELETE CASCADE`) |
  | Un pro | les recos qu'il a écrites **restent** : elles portent sur d'autres personnes, et `parrain_nom` les attribue déjà sans lui (`ON DELETE SET NULL` sur `parrain_id`) |
  | L'un ou l'autre | ses messages restent chez leurs destinataires, l'expéditeur devenant « compte supprimé » |

## Le droit de réponse sur les recos, et pourquoi « la reco est forcément bonne » ne suffit pas

L'intuition est raisonnable : on ne recommande que quelqu'un qu'on recommanderait, donc le mot
est élogieux, donc personne n'est lésé, donc pas besoin de recours. **Elle ne tient pas, et pour
quatre raisons distinctes.**

- **L'article 16 ne parle pas de gentillesse, il parle d'exactitude.** « Autonome dès la
  deuxième semaine » peut être faux — mauvaise équipe, mauvaise durée, mauvais poste, homonyme
  — tout en étant flatteur. Élogieux et inexact ne s'excluent pas.
- **La note est un classement, et un classement blesse même quand il est bon.** Le filtre
  `4.5+` existe dans le design : un 4,3 est *absolument* excellent et *relativement*
  éliminatoire. C'est bien une donnée qui pilote une décision défavorable concernant la
  personne, indépendamment du commentaire.
- **L'article 14 s'applique quoi qu'il arrive.** La donnée est collectée auprès d'un tiers, pas
  de l'intéressé : il faut l'informer de ce qui est stocké, par qui, et pour quoi. Cette
  obligation ne dépend d'aucune appréciation sur le contenu.
- **L'hypothèse est fausse à l'échelle.** À 10 000 membres et par chaînes d'invitation, il y
  aura des recos tièdes écrites par politesse, des brouilles après coup, des erreurs
  factuelles, des confusions de personnes, et un jour une reco de représailles. Le design
  n'offre aujourd'hui aucun geste pour aucun de ces cas.

**La bonne nouvelle est que la mise en conformité est presque gratuite** — pas de workflow de
contestation à construire :

| Article | Ce qu'il faut | Coût |
|---|---|---|
| 15 (accès) | le membre voit sa note, son commentaire et qui l'a écrit | déjà fait — c'est l'écran d'invitation |
| 14 (information) | le dire au moment de l'invitation | une phrase |
| 16 (rectification) | un « signaler une erreur » qui remonte à un admin | **`signalement` avec `cible_type = 'parrainage'`** — la table existe déjà |

**Le recours est le signalement, et rien d'autre.** Pas de colonne `reponse_filleul`, pas de
droit de réponse affiché : le membre qui n'aime pas sa reco la signale, un admin regarde. Coût
en schéma : **zéro** — une valeur d'énumération de plus dans une table qui existe déjà. Le
principe tient quand même : « non modifiable » veut dire *il ne réécrit pas les mots du
parrain*, pas *il n'a aucun recours*.

⚠️ Ce qui reste, en revanche, n'est pas dans le schéma mais dans le **processus** : l'article
12.3 donne **un mois** pour répondre à une demande de rectification, et l'admin doit pouvoir
agir pour de vrai — demander au pro de corriger, annoter, ou retirer la reco. Une file de
signalements que personne ne relève ne vaut pas mieux que pas de recours du tout. Reporté avec
le reste dans « avant la mise en ligne réelle ».

> À faire relire par un juriste avant la mise en ligne réelle — le raisonnement ci-dessus est
> standard, mais la donnée en jeu (avis nominatif d'un tiers pilotant l'accès à un stage) est
> précisément celle sur laquelle on ne devine pas.

Rien de tout ça n'est urgent tant qu'il n'y a ni compte ni réseau — mais tout se décide avec le
schéma, pas après lui.

## Avant la mise en ligne réelle

**L'objectif actuel est une app de démo**, pas une mise en production : les quatre points
ci-dessous sont délibérément reportés. Ils ne coûtent rien à écrire plus tard, mais chacun
bloque une vraie mise en ligne, donc ils sont listés ici pour ne pas être redécouverts en
review.

| À faire | Pourquoi ça bloque |
|---|---|
| Un compte de démo pour le reviewer Apple | app sur invitation *et* payante → rejet 2.1 « unable to review » sans identifiants fonctionnels |
| Un plafond d'invitations par pro et par mois | seul garde-fou de la chaîne de confiance, une fois la validation manuelle sautée pour les pros inscrits |
| Une limite de débit sur l'envoi de messages | tout le monde peut écrire à tout le monde : c'est le vecteur d'abus par défaut |
| La divulgation dans le formulaire du pro | son nom reste attaché à la reco même s'il supprime son compte — ça se dit avant, pas après |
| Quelqu'un qui relève les signalements sous un mois | c'est le seul recours sur une reco, et l'article 12.3 du RGPD fixe le délai |

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

### Le mécanisme, maintenant que la stack est arrêtée

Backend TypeScript dans ce monorepo, donc : **des schémas zod partagés, et les types TS
inférés depuis eux.** Une seule déclaration, et la validation à l'exécution vient avec.

Leur destination est un futur **`packages/api`** (client HTTP + schémas), **pas
`packages/core`** : core est délibérément pur — zéro dépendance runtime, `lib` ES2023 sans
`DOM`, au point que `fetch` n'y est même pas typé (voir l'en-tête de
`packages/core/src/version.ts`). Un client réseau n'y entre pas.

⚠️ **Les types que Drizzle infère ne sont pas le contrat d'API.** Drizzle décrit des lignes
de table ; `packages/api` décrit ce qui passe sur le réseau, et les deux doivent rester deux
déclarations distinctes. Renvoyer un type de ligne Drizzle tel quel recolle le format de fil
à la forme des tables — exactement ce qu'on refuse en n'exposant pas la base directement, un
niveau plus bas. Le contrat est fait pour survivre à un renommage de colonne ; c'est tout son
intérêt.

### Valider aux frontières, dans les deux cas

Un type TypeScript ne garantit rien à l'exécution : il décrit ce que le backend a promis,
pas ce qu'il a envoyé. Toute donnée qui entre est donc validée avant usage. Le geste existe
déjà en miniature dans `mobile/src/config/miseAJour.ts` : la réponse de `/config` est
vérifiée avant d'être crue, et une réponse malformée dégrade vers `null` au lieu de lever.
Aujourd'hui c'est un `typeof` d'une ligne — c'est le réflexe qui se généralise, pas la ligne.
