// Metro doit voir packages/core, qui vit hors de mobile/.
//
// getSentryExpoConfig remplace getDefaultConfig : il renvoie la même config,
// plus le « debug id » posé dans le bundle et la source map que Sentry ira
// chercher au moment de l'upload. Sans lui, les stacks remontent en JS
// minifié — donc illisibles, donc le crash reporting ne sert à rien.
// La personnalisation monorepo ci-dessous tient par-dessus, inchangée.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const path = require('path');

const projet = __dirname;
const racine = path.resolve(projet, '..');

const config = getSentryExpoConfig(projet);

config.watchFolders = [racine];
config.resolver.nodeModulesPaths = [
  path.resolve(projet, 'node_modules'),
  path.resolve(racine, 'node_modules'),
];

module.exports = config;
