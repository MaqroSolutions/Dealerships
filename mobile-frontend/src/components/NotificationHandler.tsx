import { useEffect } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { messaging } from '../lib/firebase';

export default function NotificationHandler() {
  useEffect(() => {
    // Check if we're running in Expo Go vs development build
    const isExpoGo = Constants.appOwnership === 'expo';
    
    if (isExpoGo || !messaging) {
      console.log('Notification handling not available in Expo Go. Please use a development build for full functionality.');
      return;
    }

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      
      Alert.alert(
        remoteMessage.notification?.title || 'New Message',
        remoteMessage.notification?.body || 'You have a new message',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
    });

    // Handle background/quit state messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
    });

    // Handle notification opened from background/quit state
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened from background:', remoteMessage);
    });

    // Check if the app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
        }
      });

    return unsubscribe;
  }, []);

  return null; // This component doesn't render anything
}
