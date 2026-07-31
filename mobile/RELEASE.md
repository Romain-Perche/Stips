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
- `expo-updates` + `runtimeVersion` — §5.
- Le verrou de version — §4. **C'est le seul élément qui doit impérativement être dans le
  premier binaire livré.**

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

**Ne pas confondre les deux clés** (vérifié contre la doc SDK 54, voir `mobile/AGENTS.md`) :
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

## 6. Confidentialité

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
| Usage Data / Diagnostics | non collecté | seulement si Sentry ou un analytics arrive |
| Tracking (au sens ATT) | **non** | **non** — et si ça change, il faut ATT + `NSUserTrackingUsageDescription` |

Aujourd'hui `Data Not Collected` est **honnêtement** défendable : l'app ne fait aucun appel
réseau. Ça devient faux avec l'authentification, et le questionnaire doit être mis à jour
**dans la release qui commence à collecter**, pas après.

**Règle générale : ajouter un SDK tiers (Sentry, analytics, publicité) oblige à mettre à
jour, dans la même release, la politique de confidentialité *et* les deux questionnaires *et*
`ios.privacyManifests`.** C'est le genre de dette qui ne se voit pas avant le rejet.

Le RGPD s'applique par ailleurs (structure française) : voir la page elle-même pour le
contenu, et `backend/README.md` pour les trois exigences qui touchent l'architecture
(compte de démo pour le reviewer, suppression de compte dans l'app, rectification des avis
de parrainage).

---

## 7. Avant chaque soumission

- [ ] `main` est verte (`npm run typecheck --workspaces` + `lint`)
- [ ] `version` à jour dans `app.config.ts`, tag annoté `mobile-vX.Y.Z` poussé **avant** le
      build (voir `AGENTS.md`)
- [ ] Les deux flags du verrou sont dans l'état voulu
- [ ] Questionnaire App Privacy / Data Safety à jour si la collecte a changé
- [ ] `ios.privacyManifests` à jour si un SDK a été ajouté
- [ ] Politique de confidentialité et page de support en ligne et joignables
- [ ] Captures d'écran (iPhone uniquement — `supportsTablet: false`)
- [ ] Notes de review + **identifiants du compte de démo** (l'app est sur invitation et
      payante : sans ça, rejet 2.1 « unable to review »)
- [ ] Conformité export : déjà répondue par `ITSAppUsesNonExemptEncryption`
- [ ] Classification d'âge cohérente avec l'âge minimum annoncé dans la politique

---

## 8. Ce qui n'est pas encore nécessaire

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
