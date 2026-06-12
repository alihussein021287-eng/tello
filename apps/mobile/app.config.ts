import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Tello",
  owner: "tello-1",
  slug: "tello-1",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./src/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#1B4FD8",
  },
  scheme: "tello",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.fshsmart.tello",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/icon.png",
      backgroundColor: "#1B4FD8",
    },
    package: "com.fshsmart.tello",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    [
      "expo-splash-screen",
      { image: "./src/assets/splash.png", backgroundColor: "#1B4FD8" },
    ],
  ],
  extra: {
    apiUrl: process.env.API_URL || "https://api.fshsmart.com",
    eas: { projectId: "8e3a8b3e-67b6-4c10-b0cf-f1200740680f" },
  },
})
