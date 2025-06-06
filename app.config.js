import 'dotenv/config';
import MealPlanScreen from './screens/MealPlanScreen';

module.exports = {
  name: 'MyMeal',
  slug: 'my-meal',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/MyIcon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/MyIcon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.mymeal.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/MyIcon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.mymeal.app'
  },
  web: {
    favicon: './assets/images/MyIcon.png'
  },
  extra: {
    eas: {
      projectId: '238ef8ab-1fc4-4bd3-8195-96aa87b1a739', 
    },
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  },  
  plugins: [
    'expo-router'
  ],
  scheme: 'my-meal',
  experiments: {
    typedRoutes: true
  }
}; 