// EN PREMIER, avant tout le reste. Les imports ES sont hoistés et exécutés
// dans l'ordre : ce module initialise Sentry pendant son évaluation, donc
// avant que ./App et ses écrans s'évaluent à leur tour. Le descendre sous
// l'import d'App suffirait à laisser passer sans rapport toute erreur levée
// à l'import d'un écran. Voir src/observabilite/sentry.ts.
import './src/observabilite/sentry';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
