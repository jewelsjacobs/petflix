module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
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
    ],
  };
}; 