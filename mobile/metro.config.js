// Metro doit voir packages/core, qui vit hors de mobile/.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projet = __dirname;
const racine = path.resolve(projet, '..');

const config = getDefaultConfig(projet);

config.watchFolders = [racine];
config.resolver.nodeModulesPaths = [
  path.resolve(projet, 'node_modules'),
  path.resolve(racine, 'node_modules'),
];

module.exports = config;
