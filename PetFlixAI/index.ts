import { registerRootComponent } from 'expo';

import App from './App';

// Expo automatically loads environment variables with EXPO_PUBLIC_ prefix
// from .env files, no need for manual dotenv configuration
// For sensitive values like API keys, use a more secure approach in production

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
