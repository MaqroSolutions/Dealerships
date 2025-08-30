import 'dotenv/config';

export default {
  expo: {
    name: "Dealerships Mobile",
    slug: "dealerships-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.maqrodealerships.mobile",
      googleServicesFile: "./ios/GoogleService-Info.plist"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "com.maqrodealerships.mobile",
      googleServicesFile: "./android/app/google-services.json"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [],
    extra: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://dealerships-whats-app.onrender.com',
    }
  }
};
