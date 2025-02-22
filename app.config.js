import 'dotenv/config';

export default {
  expo: {
    name: "Last.fm Track Tracker",
    slug: "lastfm-track-tracker",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.lastfm.tracktracker"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.lastfm.tracktracker"
    },
    extra: {
      lastFmApiKey: process.env.LASTFM_API_KEY,
      eas: {
        projectId: "3d6e1c7c-8ab7-4863-b856-5df918adabf4"
      }
    }
  }
}; 