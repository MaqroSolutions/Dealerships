import Constants from 'expo-constants';

// Check if we're running in Expo Go vs development build
const isExpoGo = Constants.appOwnership === 'expo';

// Firebase messaging interface for Expo Go compatibility
let messaging: any = null;

// Disable Firebase completely in Expo Go to avoid API key errors
if (!isExpoGo) {
  try {
    // Only import Firebase in development builds, not Expo Go
    const firebaseApp = require('@react-native-firebase/app').default;
    messaging = require('@react-native-firebase/messaging').default;
    
    // Initialize Firebase if not already initialized
    if (!firebaseApp.apps.length) {
      firebaseApp.initializeApp();
    }
  } catch (error) {
    console.log('Firebase initialization failed:', error.message);
    messaging = null;
  }
} else {
  console.log('Firebase disabled in Expo Go to prevent API key errors');
}

export { messaging };

// Request notification permission
export const requestUserPermission = async (): Promise<boolean> => {
  if (isExpoGo || !messaging) {
    console.log('Push notifications not available in Expo Go. Please use a development build.');
    return false;
  }
  
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  if (isExpoGo || !messaging) {
    console.log('FCM tokens not available in Expo Go. Please use a development build.');
    return 'expo-go-placeholder-token';
  }
  
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};
