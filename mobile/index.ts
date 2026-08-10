// EN PREMIER, avant tout le reste. Les imports ES sont hoistés et exécutés
// dans l'ordre : ce module initialise Sentry pendant son évaluation, donc
// avant que ./App et ses écrans s'évaluent à leur tour. Le descendre sous
// l'import d'App suffirait à laisser passer sans rapport toute erreur levée
// à l'import d'un écran. Voir src/observabilite/sentry.ts.
import './src/observabilite/sentry';

import { registerRootComponent } from 'expo';

import App from './App';

// Équivaut à AppRegistry.registerComponent('main', () => App), en posant en
// plus l'environnement attendu par le runtime natif — dev client comme build
// de production.
registerRootComponent(App);
