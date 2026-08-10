# Release mobile — contraintes stores

Ce que les stores exigent, dans quel ordre, et ce qui fige quoi. Les conventions git
(branches, tags, commits) sont dans l'`AGENTS.md` racine ; les contraintes Expo dans
`mobile/AGENTS.md`. Ici, uniquement l'ingénierie de livraison.

Ce fichier n'est **pas** chargé dans le contexte de chaque tâche mobile — c'est voulu, une
checklist de release n'a pas sa place là. Il faut venir le lire.

---

## 1. Comptes développeur

| | Coût | Délai réel | État |
| --- | --- | --- | --- |
| Apple Developer Program | 99 $/an | 1-2 semaines de vérification, **+ le D-U-N-S si organisation** | à ouvrir |
| Google Play Console | 25 $ une fois | jours à ~2 semaines de vérification d'identité | à ouvrir |

**À lancer bien avant d'en avoir besoin.** C'est le chemin critique du projet, et rien dans
le repo ne le débloque.

**Apple — particulier ou organisation ?** Organisation exige un **numéro D-U-N-S** (gratuit
chez Dun & Bradstreet, mais de 5 jours ouvrés à plusieurs semaines) **avant** de pouvoir
s'inscrire, l'inscription prenant elle-même 1-2 semaines. Pour vendre 100 €/an, organisation
est probablement le bon choix — donc le D-U-N-S est la première chose à demander. Particulier
= l'app est listée sous un nom de personne physique, mais c'est plus rapide.

**Google — personnel ou organisation ?** C'est **le délai le plus long du projet**. Un compte
**personnel** doit faire un test fermé avec **12 testeurs inscrits pendant 14 jours
consécutifs** avant de pouvoir seulement *demander* l'accès à la production. Les comptes
organisation en sont exemptés. Sur la route personnelle, la chaîne est : compte →
vérification d'identité → un AAB signé → recruter 12 vraies personnes → 14 jours → demande
d'accès → review. À revérifier au moment de s'y mettre, la politique bouge.

Conséquence pratique : **démarrer le test fermé dès qu'un build existe**, même en données
factices, même sans backend. 14 jours sont 14 jours ; les passer avant d'en avoir besoin est
gratuit.

**Review : 24-48 h en général, mais un rejet coûte un aller-retour.** On ne planifie pas une
démo la veille d'une soumission. Deux amortisseurs déjà en place : les mises à jour OTA
(§5) pour les correctifs JS, et `release/X.Y.x` (voir `AGENTS.md`) pour patcher une version
déjà soumise.

---

## 2. Ce qui fige quoi

Une seule décision en attente en débloque quatre :

```
choisir le domaine
   ├─→ bundle id définitif        (TODO(bundle-id) dans app.config.ts)
   ├─→ apiUrl réel                (api.leclub.club est un placeholder)
   ├─→ URL de politique + support (exigées à la soumission)
   └─→ fiche App Store Connect → ascAppId → eas.json submit.production
```

**Le bundle id est figé par la première soumission à TestFlight *externe* ou à Play
Console** — pas par `eas init`, pas par un build interne. Tant qu'on n'a soumis à personne
d'extérieur, il se change librement.

`eas.json` → `submit.production` est volontairement vide : `ios.ascAppId` est l'identifiant
numérique de la fiche App Store Connect, qui **n'existe pas avant d'avoir créé la fiche**,
donc avant le compte payant. Il faut aussi `ios.appleTeamId` et
`android.serviceAccountKeyPath`. En attendant, `eas submit` demande interactivement : ça ne
bloque pas un build, seulement un submit scripté.

**La clé de service-account Google Play est un `.json`.** Aucune extension du `.gitignore` ne
l'attrape naturellement — des motifs de nom ont été ajoutés à la racine et dans
`.githooks/pre-commit`, mais la bonne réponse reste de **la garder hors du repo** : chemin
absolu, ou fichier d'environnement EAS, pour qu'elle ne soit jamais dans un arbre de travail.

---

## 3. Avant le premier build production

Déjà fait dans `app.config.ts`, listé ici pour qu'on sache pourquoi :

- `ios.supportsTablet: false` — `true` est un engagement (captures iPad exigées, rendu iPad
  évalué en review, toutes orientations attendues par la HIG). À rouvrir seulement si l'iPad
  est réellement dessiné.
- `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` — sinon on remplit le questionnaire
  de conformité export à chaque soumission, et une mauvaise réponse bloque TestFlight.
- `ios.privacyManifests` — sans ça, le scan automatique d'Apple renvoie **ITMS-91053
  « Missing API declaration »** et bloque le build. C'est du meilleur effort : les SDK tiers
  portent leurs propres manifestes, on déclare pour notre code, et le mail d'Apple nomme
  exactement ce qui manque le cas échéant. Seul `NSPrivacyAccessedAPITypes` est appliqué
  automatiquement ; `NSPrivacyCollectedDataTypes` alimente le rapport agrégé, la vraie
  barrière étant le questionnaire (§6).
- `scheme: 'leclub'` — posé avant qu'un lien profond existe, pour que la valeur soit stable.
- Plugin `expo-splash-screen` — l'écran de lancement. Pas bloquant, mais l'asset existait
  sans être branché.
- `expo-updates` + `runtimeVersion` — § mises à jour OTA.
- Plugin `@sentry/react-native/expo` — § observabilité. DSN, organisation, projet et
  `SENTRY_AUTH_TOKEN` (EAS, `secret`, les trois environnements) sont en place.
- Le verrou de version — § verrou. **C'est le seul élément qui doit impérativement être dans
  le premier binaire livré.**

Fait, par lecture du manifeste fusionné :

```bash
# Dans un clone jetable : ça crée mobile/android/ (ignoré par git).
npx expo prebuild --no-install --platform android
# → lire mobile/android/app/src/main/AndroidManifest.xml
```

Verdict : `INTERNET` est légitime (`/config`, EAS Update). `SYSTEM_ALERT_WINDOW`,
`READ_EXTERNAL_STORAGE` et `WRITE_EXTERNAL_STORAGE` sont injectées par les dépendances
natives sans qu'aucune fonctionnalité de l'app ne s'en serve — bloquées via
`android.blockedPermissions` dans `app.config.ts`. `SYSTEM_ALERT_WINDOW` méritait
particulièrement l'attention : Play la classe sensible (liée aux attaques par
superposition), et elle était présente dans `src/main/AndroidManifest.xml` — donc dans
*tous* les variants, y compris la release — pas seulement dans `src/debug/` où React
Native la déclare aussi pour son overlay de développement. `VIBRATE` reste : non sensible,
aucune déclaration Play exigée.

**Ne pas confondre les deux clés** (vérifié contre la doc SDK 57, voir `mobile/AGENTS.md`) :
`android.permissions` **ajoute** des permissions volontaires, il ne restreint rien de ce
qu'une dépendance injecte déjà — `permissions: []` ne retire donc aucune permission
indésirable, ce n'est pas un élagage. Pour bloquer une permission injectée par une lib,
c'est `android.blockedPermissions` (implémenté via `tools:node="remove"` dans le manifeste).

À revoir le jour où une vraie fonctionnalité a besoin de stockage (ex. upload de CV/photo) :
elle passera par les permissions scoped d'`expo-image-picker` ou `expo-document-picker`,
pas par celles bloquées ici.

Confort, pas un requis : les variantes dev et preview n'ont pas d'icône iOS distincte. Android
se teinte par config (`adaptiveIcon.backgroundColor` par variante), iOS exige de vrais PNG
séparés. Utile pour distinguer trois apps sur le même téléphone, ne bloque aucun build.

Numéro de la première version publique : `0.1` (`version` dans `app.config.ts`), pour le
premier build de test. Deux segments suffisent — ni Expo ni Play n'exigent trois chiffres,
et Apple accepte couramment ce format pour `CFBundleShortVersionString`. Apple et Google
acceptent `0.x` — **on ne redescend jamais** ce numéro ensuite, donc les prochains builds de
test avant la sortie publique montent en `0.2`, `0.3`, etc.

Vérifier que la config s'évalue pour les trois variantes — le typecheck seul ne le fait pas,
et c'est aussi ce qui déclenche le garde-fou anti-secrets :

```bash
APP_VARIANT=development npx expo config --type public
APP_VARIANT=preview     npx expo config --type public
APP_VARIANT=production  npx expo config --type public
```

---

## 4. Le verrou de version minimale

`GET /config` renvoie `versionMinimale` ; en dessous, l'app affiche un écran bloquant sans
issue. Contrat dans `packages/core/src/version.ts`, logique dans
`mobile/src/config/miseAJour.ts`, écran dans `mobile/src/screens/ScreenMiseAJour.tsx`.

**Pourquoi c'est urgent alors qu'il n'y a pas de backend.** Un binaire compilé sans le
verrou n'obéira jamais, quoi qu'on lui envoie plus tard. Sans lui dans la v1, le contrat
d'API de la v1 est gelé à vie. Ça ne se rattrape pas — c'est un coupe-circuit qu'on installe
avant de vendre la voiture, pas à distance ensuite.

**La discipline, qui est la partie facile à oublier :**

- **`/config` est la seule route dont le contrat ne peut jamais casser.** On n'y retire
  jamais un champ, on n'en change jamais le type. C'est elle qui parle aux vieux clients ;
  elle doit rester lisible par le plus vieux encore vivant.
- **Ne jamais remonter `versionMinimale` vers une version en ligne depuis moins de 2-3
  semaines.** La review prend 24-48 h *avant* que quiconque mette à jour, puis les gens
  mettent des jours à le faire, et le déploiement progressif de Play fait que la dernière
  version n'est pas sur tous les téléphones le jour de l'approbation. Remonter trop tôt
  bloque des gens qui n'ont rien fait de mal.
- **Remonter est irréversible dans les faits** : tous les binaires plus anciens sont bloqués
  définitivement, y compris ceux dont l'utilisateur ne peut pas mettre à jour (vieil OS).
- **Le verrou échoue ouvert.** Réseau coupé, timeout, 500, JSON illisible → on ne bloque pas.
  Échouer fermé transformerait une panne de notre infra en panne totale sur tous les
  téléphones, *y compris ceux qui ont la dernière version* : le rayon d'action serait
  exactement l'inverse du voulu. Le raisonnement complet est en tête de `miseAJour.ts`.
- **L'application réelle sera côté serveur** : à terme, un **426 Upgrade Required** sur
  n'importe quelle route, routé vers le même écran. `/config` au démarrage n'est que le
  chemin poli, celui qui donne un écran propre au lieu d'un crash.

**Le tester sans backend :**

```bash
# 1. Voir l'écran : flags.verrouVersionForce = true, puis npm start
# 2. Le chemin complet : servir {"versionMinimale":"9.9.9"} sur /config depuis
#    n'importe quel hébergement statique, API_URL vers lui dans mobile/.env,
#    flags.verrouVersion = true.
# 3. Avec "0.0.1" : rien ne doit se passer.
# 4. API_URL vers un port mort : l'app doit fonctionner normalement (échec ouvert).
```

Les deux flags reviennent à `false` avant de commiter — sinon un appel réseau part à chaque
démarrage pour rien. Ils disparaissent le jour où `/config` existe vraiment.

---

## 5. Mises à jour OTA

`expo-updates` est installé et configuré (`updates.url` + `runtimeVersion: { policy:
'appVersion' }`). Un correctif JS part en minutes au lieu d'un aller-retour de review, ce
qu'Apple autorise (règle 2.5.2) **tant que ça ne change pas ce que fait l'app** : corrections
de bugs et retouches de texte oui, fonctionnalité qui esquive la review non.

Même contrainte que le verrou : **un binaire compilé sans `expo-updates` ne recevra jamais
d'OTA.** D'où sa présence avant le premier build.

`policy: 'appVersion'` fait coïncider la frontière de compatibilité OTA avec la frontière de
version store : changer `version` ouvre une nouvelle branche de mises à jour. C'est ce qui
garantit que la version lue à l'exécution (`src/config/env.ts`) reste celle du binaire
installé — et donc que le verrou de version compare la bonne chose.

À savoir : un mauvais OTA peut casser l'app au démarrage. `expo-updates` revient
automatiquement au bundle embarqué, mais un OTA se teste sur le canal `preview` avant
`production`. Les `channel` d'`eas.json` servent enfin à quelque chose.

---

## 6. Observabilité

Sur le web on ouvre la console de quelqu'un à distance. Sur mobile, non : un crash chez un
membre du Club, sans outillage, c'est un message « ça marche pas » et zéro information.
D'où la règle : **aucune build partagée à quelqu'un d'autre que nous sans crash reporting
vérifié.** Les profils `preview` et `production` sont concernés ; `development` ne quitte
pas la machine.

Code : `src/observabilite/sentry.ts` (init et garde-fous), `metro.config.js` (source maps),
plugin `@sentry/react-native/expo` dans `app.config.ts`. Version `~7.11.0`, imposée par
SDK 57 — installée via `npx expo install`, jamais épinglée à la main.

Compte, organisation (`le-club`) et projet React Native (`react-native`) existent ; DSN,
`organization` et `project` sont renseignés dans `app.config.ts`. `SENTRY_AUTH_TOKEN` est
dans `mobile/.env` et sur EAS (`secret`, sur `production`, `preview` et `development`).

Sans DSN, `Sentry.init` ne démarre pas et l'app tourne normalement, sans crash reporting —
no-op explicite, pas panne silencieuse. Ce n'est plus l'état par défaut : depuis que le DSN
est renseigné, tout build `preview` ou `production` envoie.

### Région de données : EU

L'organisation est hébergée dans la **région EU** — c'est visible dans le DSN
(`…ingest.de.sentry.io`), ça se choisit à la création de l'organisation et **ça ne se change
plus ensuite**. Deux conséquences :

- L'API de Sentry répond sur `de.sentry.io`, pas sur `sentry.io`. D'où
  `url: 'https://de.sentry.io/'` dans les options du plugin. Avec le défaut, `sentry-cli`
  interrogerait l'instance US où l'organisation n'existe pas : l'upload des source maps
  échoue, donc le build `preview`/`production` échoue avec lui.
- Les événements (donc les données de crash) sont stockés à Francfort. C'est ce qu'on veut
  pour une structure française — à mentionner dans la politique de confidentialité le jour
  où elle détaille les sous-traitants.

**Un seul projet pour les trois variantes**, séparées par le tag `environment`. Trois
projets voudraient dire trois quotas, trois jetons et trois jeux d'alertes à tenir
synchrones, pour une isolation dont on n'a pas besoin à cette échelle (5 000 erreurs et
10 000 spans par mois offerts).

**Sentry ne démarre pas en développement**, délibérément : le bruit de dev n'a aucune
valeur et consomme le quota. Le flag `sentryEnDev` (`src/config/flags.ts`) le rallume le
temps de vérifier que le tuyau marche de bout en bout. Il n'y a plus de garde « module
natif absent » : le dev client embarque le natif de Sentry comme n'importe quelle build.

### Source maps — deux chemins, pas un

C'est le point qu'on oublie. Sans source maps, une stack pointe du JS minifié : illisible,
donc le crash reporting ne sert à rien.

| Ce qui est livré | Upload des source maps |
| --- | --- |
| Build natif (`eas build`) | **automatique**, dès que `SENTRY_AUTH_TOKEN` est dans l'environnement de build |
| Bundle OTA (`eas update`) | **manuel**, une commande à lancer après chaque update |

```bash
eas update --channel preview --message "…"
npx @sentry/expo-upload-sourcemaps dist
```

La commande d'upload relit `url`, `organization` et `project` dans les options du plugin
d'`app.config.ts` quand `SENTRY_URL` / `SENTRY_ORG` / `SENTRY_PROJECT` sont absents de
l'environnement : seul `SENTRY_AUTH_TOKEN` doit y être. C'est pourquoi la région EU se
règle à un seul endroit et vaut pour les deux chemins d'upload.

L'OTA étant le chemin rapide pour les correctifs JS (§ mises à jour OTA), c'est celui qui
mordra le plus souvent : chaque correctif envoyé sans cette commande produit des stacks
illisibles précisément pendant qu'on répare quelque chose.

Sur `preview` et `production`, `disableAutoUpload` est à `false` : **le build échoue si le
jeton manque**. C'est voulu — ces deux profils partent chez quelqu'un d'autre. Sur
`development` il est à `true`, pour qu'un premier build local ne soit pas bloqué par un
compte Sentry pas encore créé.

### Vérifier que le tuyau marche, de bout en bout

Une fois seulement, sur une build dev-client :

```bash
# 1. flags.sentryEnDev = true dans src/config/flags.ts (sinon rien ne part en dev)
npx eas-cli build --profile development
# 2. lancer l'app, provoquer un crash JS depuis n'importe quel écran :
#    throw new Error('test observabilité')
# 3. l'issue doit apparaître dans Sentry en moins d'une minute, avec :
#      · environment = development
#      · une stack qui nomme le FICHIER et la LIGNE (pas du JS minifié)
#      · un fil d'Ariane montrant les onglets visités avant le crash
# 4. remettre flags.sentryEnDev = false avant de commiter
```

Le point 3 est le vrai test : une issue qui arrive avec une stack illisible signifie que
les source maps ne sont pas montées, et c'est exactement la situation qu'on croit avoir
évitée. Un crash natif se teste avec `Sentry.nativeCrash()`.

### Analytics — pas encore, et pourquoi

Le chiffre qui compte pour ce produit est le **taux de conversion de l'invitation**
(invitation → compte créé → premier événement rejoint). Il n'est pas instrumenté, et c'est
délibéré : sur ces trois étapes, une seule existe en code, et « accepter l'invitation » se
résume aujourd'hui à masquer un écran. Il n'y a ni création de compte, ni paiement, ni
inscription à un événement — et le dénominateur, « invitations envoyées », vit dans un
backend dont la stack n'est pas choisie (`backend/README.md`).

Poser des événements maintenant produirait un catalogue de noms à renommer entièrement le
jour où le vrai parcours existe, et un entonnoir à 100 % sur une seule étape. À reprendre
quand l'authentification et l'inscription aux événements existent — c'est à ce moment-là
qu'il faudra choisir un outil, et mettre à jour le questionnaire de confidentialité
ci-dessous dans la même release.

---

## 7. Confidentialité

Deux choses distinctes, toutes deux exigées à la soumission.

**Une URL de politique hébergée**, saisie dans App Store Connect *et* dans Play Console.
Publiquement joignable en HTTPS sans login, et qui doit **rester** joignable : une URL morte
fait retirer une app. Elle vit dans `frontend/public/confidentialite.html` — une page
statique autonome, que Vite recopie telle quelle dans `dist/`, et qui survit même si le
bundle SPA casse. Même chose pour `frontend/public/support.html` (App Store Connect exige
une Support URL). Pas de backend nécessaire pour les héberger.

**Le questionnaire App Privacy (Apple) / Data Safety (Play)** — une déclaration par type de
donnée. C'est *lui* la barrière, pas le document. Réponses prévues, à garder cohérentes :

| Donnée | Aujourd'hui | Dès qu'il y a des comptes |
| --- | --- | --- |
| Contact Info (nom, e-mail) | non collecté | collecté, lié à l'identité, pas de tracking |
| User Content (profil, forum, avis de parrainage) | non collecté | collecté, lié à l'identité, pas de tracking |
| Identifiers | non collecté | identifiant de compte, lié à l'identité |
| Usage Data / Diagnostics | **Crash Data + Performance Data**, non liés à l'identité | idem, à réévaluer si un analytics arrive |
| Tracking (au sens ATT) | **non** | **non** — et si ça change, il faut ATT + `NSUserTrackingUsageDescription` |

**`Data Not Collected` n'est plus défendable dès le premier build qui embarque un DSN
Sentry.** Il faut déclarer *Crash Data* et, à cause de `tracesSampleRate`, *Performance
Data* — les deux **non liés à l'identité** et **sans tracking**, ce qui est exact parce que
`sendDefaultPii: false` empêche l'envoi de l'IP et de l'identité de l'utilisateur
(`src/observabilite/sentry.ts`). Remonter cette valeur à `true` changerait la réponse au
questionnaire : c'est une décision de conformité, pas un réglage.

`NSPrivacyTracking: false` et `NSPrivacyTrackingDomains: []` restent corrects avec Sentry :
pas d'IDFA, pas de corrélation inter-apps. Sentry porte son propre manifeste de
confidentialité, donc `ios.privacyManifests` n'a pas à déclarer ses accès d'API.

Ça bougera encore avec l'authentification, et le questionnaire doit être mis à jour **dans
la release qui commence à collecter**, pas après.

**Règle générale : ajouter un SDK tiers (Sentry, analytics, publicité) oblige à mettre à
jour, dans la même release, la politique de confidentialité *et* les deux questionnaires *et*
`ios.privacyManifests`.** C'est le genre de dette qui ne se voit pas avant le rejet.

Le RGPD s'applique par ailleurs (structure française) : voir la page elle-même pour le
contenu, et `backend/README.md` pour les trois exigences qui touchent l'architecture
(compte de démo pour le reviewer, suppression de compte dans l'app, rectification des avis
de parrainage).

---

## 8. Avant chaque soumission

- [ ] `main` est verte (`npm run typecheck --workspaces` + `lint`)
- [ ] `version` à jour dans `app.config.ts`, tag annoté `mobile-vX.Y.Z` poussé **avant** le
      build (voir `AGENTS.md`)
- [ ] Les deux flags du verrou sont dans l'état voulu, et `sentryEnDev` est à `false`
- [ ] `SENTRY_AUTH_TOKEN` présent côté EAS — sinon le build échoue (c'est voulu)
- [ ] Une erreur de test remonte dans Sentry avec une stack lisible (§ observabilité)
- [ ] Questionnaire App Privacy / Data Safety à jour si la collecte a changé
- [ ] `ios.privacyManifests` à jour si un SDK a été ajouté
- [ ] Politique de confidentialité et page de support en ligne et joignables
- [ ] Captures d'écran (iPhone uniquement — `supportsTablet: false`)
- [ ] Notes de review + **identifiants du compte de démo** (l'app est sur invitation et
      payante : sans ça, rejet 2.1 « unable to review »)
- [ ] Conformité export : déjà répondue par `ITSAppUsesNonExemptEncryption`
- [ ] Classification d'âge cohérente avec l'âge minimum annoncé dans la politique

---

## 9. Ce qui n'est pas encore nécessaire

À ne pas ajouter par anticipation, mais à ne pas oublier.

| | Devient exigé quand |
| --- | --- |
| `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` | la release qui ajoute la photo de profil. Motif **spécifique** en français : le texte passe-partout est un motif de rejet |
| `NSPrivacyCollectedDataTypes` complet | la release qui commence à collecter — à garder synchrone avec le questionnaire |
| `expo-tracking-transparency` / ATT | seulement si un SDK publicitaire ou de tracking inter-app arrive. Sentry seul ne déclenche pas |
| Sign in with Apple (règle 4.8) | seulement si login social tiers. Un login e-mail/invitation ne déclenche pas |
| Suppression de compte dans l'app (5.1.1(v)) | la release qui ajoute la création de compte. **Non reportable au-delà** |
| IAP / StoreKit / Play Billing | seulement sur la route IAP — voir « À trancher » §6 de la description du projet |
| `assetPatternsToBeBundled` | seulement si des assets doivent voyager en OTA |
