/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'IPOCARD',
    slug: 'ipocard-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    assetBundlePatterns: ['**/*'],
    plugins: [
      'expo-camera',
    ],
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_URL,
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          'O IPOCARD precisa da câmara para ler o código QR do cartão estudantil na cantina.',
      },
    },
    android: {
      permissions: ['android.permission.CAMERA'],
    },
  },
};