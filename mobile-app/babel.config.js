module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // ... outros plugins que vocês já tenham (se houver)
      'react-native-reanimated/plugin', 
    ],
  };
};