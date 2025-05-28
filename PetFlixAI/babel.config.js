module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        blocklist: null,
        allowlist: null,
        safe: false,
        allowUndefined: true,
        verbose: false,
      }],
      ['module-resolver', {
        root: ['.'],
        alias: {
          '@components': './components',
          '@constants': './constants',
          '@app': './app',
          '@assets': './assets',
          '@services': './services',
          '@utils': './utils',
          '@context': './context'
        },
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.android.js', '.android.tsx', '.ios.js', '.ios.tsx']
      }],
      'react-native-reanimated/plugin'
      // Expo handles environment variables automatically, no need for additional plugins
    ],
  };
}; 