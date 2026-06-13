import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Tello",
  owner: "lgalyi021287",
  slug: "tello-1",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./src/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  scheme: "tello",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.fshsmart.tello",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/icon.png",
      backgroundColor: "#ffffff",
    },
    package: "com.fshsmart.tello",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
  ],
  extra: {
    apiUrl: process.env.API_URL || "https://api.fshsmart.com",
    eas: { projectId: "b37ce26b-6485-46a2-b178-ebcb2fdf10fc" },
  },
})
