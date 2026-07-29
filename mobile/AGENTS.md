# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Pourquoi SDK 54, pas plus récent

Depuis mai 2026, Apple bloque en review les nouvelles builds d'Expo Go : SDK 54 est la
dernière version disponible directement sur l'App Store et le Play Store. Les SDK 55/56/57
existent mais ne s'installent que via `eas go` + TestFlight, le simulateur iOS, ou Expo CLI
sur Android — pas par un simple téléchargement d'Expo Go depuis un store.

Ne remonte pas `expo` au-delà de `~54.x` sans vérifier d'abord l'état actuel sur
https://expo.dev/changelog — sinon quiconque teste avec l'app Expo Go du store retombera
sur l'erreur « Project is incompatible with this version of Expo Go ».
