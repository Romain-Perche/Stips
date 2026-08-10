# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Development build, pas Expo Go

Le cycle de développement passe par un **development build** : un binaire qui contient nos
propres dépendances natives plus le client de développement, fabriqué par EAS et installé
une fois sur l'appareil ou l'émulateur. Ensuite tout le travail quotidien est du JS servi
par Metro — rechargement immédiat, aucune recompilation.

```bash
npm run build:dev     # npx eas-cli build --profile development --platform android
npx eas-cli build:run --platform android   # installe le dernier build
npm start             # expo start --dev-client
```

Tout passe par `npx eas-cli`, jamais par un `eas` supposé installé globalement : la CLI
n'est pas une dépendance du projet, et un clone neuf ne l'a pas. `eas.json` exige
`>= 12.0.0`, ce que `npx` satisfait en allant chercher la dernière version.

On ne recompile que lorsque les dépendances **natives** changent : ajout d'une bibliothèque
avec du code natif, montée de SDK Expo. Modifier du TSX n'en demande jamais.

Expo Go n'est plus utilisé et ne doit pas revenir dans le circuit. C'est ce qui plafonnait
le projet : depuis mai 2026 Apple bloque en review les nouvelles builds d'Expo Go, donc le
SDK 54 était la dernière version installable par un simple téléchargement depuis un store.
Le development build supprime cette contrainte — le runtime, c'est nous qui le fabriquons.

Conséquence directe sur le code : plus aucun garde du type « ce module natif est-il présent
dans le runtime ? ». Les trois profils EAS produisent de vraies builds, le natif est là
partout où le code tourne.

## Build natif local

`npm run android` (`expo run:android`) compile sur la machine plutôt que sur EAS. Ce n'est
pas le chemin normal — c'est la porte de sortie quand on débugge un problème natif. Il exige
Android Studio, un JDK supporté par Gradle (Java 25 ne l'est pas : Gradle 8.14 s'arrête à
Java 24) et régénère `mobile/android/`, qui est ignoré par git et jetable.

## Versions

`expo` est sur `~57.x`, le dernier SDK stable. Les versions des modules `expo-*`,
`react-native` et des bibliothèques à code natif ne se choisissent pas à la main : elles
sont fixées par le SDK. Après toute modification de `package.json` :

```bash
npx expo install --check     # signale les écarts
npx expo install --fix       # les corrige
```
