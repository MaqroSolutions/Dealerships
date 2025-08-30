import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://dealerships-whats-app.onrender.com';

export const registerFCMToken = async (userId: string, fcmToken: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/register-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        fcmToken,
      }),
    });

    if (response.ok) {
      console.log('FCM token registered successfully');
      return true;
    } else {
      console.error('Failed to register FCM token:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return false;
  }
};

export const sendTestNotification = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/send-test-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
      }),
    });

    if (response.ok) {
      console.log('Test notification sent successfully');
      return true;
    } else {
      console.error('Failed to send test notification:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};
