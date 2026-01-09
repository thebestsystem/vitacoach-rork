import Constants from "expo-constants";

export const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // In development, usage of localhost might not work on physical devices.
  // We use the hostUri from Expo Constants to determine the dev server IP.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const [ip] = hostUri.split(":");
    return `http://${ip}:8081`;
  }

  // Fallback for web or if hostUri is missing
  return typeof window !== "undefined" ? window.location.origin : "http://localhost:8081";
};
