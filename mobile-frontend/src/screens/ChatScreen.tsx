import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import Constants from 'expo-constants';
import { supabase, getCurrentUser } from '../lib/supabase';
import { requestUserPermission, getFCMToken } from '../lib/firebase';
import { registerFCMToken, sendTestNotification } from '../lib/api';

interface ChatScreenProps {
  onSignOut: () => void;
}

export default function ChatScreen({ onSignOut }: ChatScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [fcmToken, setFCMToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        await setupNotifications(currentUser.id);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
      Alert.alert('Error', 'Failed to initialize user');
    } finally {
      setLoading(false);
    }
  };

  const setupNotifications = async (userId: string) => {
    try {
      setRegistering(true);
      
      // Request permission
      const hasPermission = await requestUserPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications to receive messages'
        );
        return;
      }

      // Get FCM token
      const token = await getFCMToken();
      if (token) {
        setFCMToken(token);
        
        // Register token with backend
        const success = await registerFCMToken(userId, token);
        if (success) {
          Alert.alert('Success', 'Notifications enabled successfully!');
        } else {
          Alert.alert('Warning', 'Failed to register for notifications');
        }
      } else {
        Alert.alert('Error', 'Failed to get notification token');
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
      Alert.alert('Error', 'Failed to setup notifications');
    } finally {
      setRegistering(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleSendTestNotification = async () => {
    if (!user) return;

    setSendingTest(true);
    try {
      const success = await sendTestNotification(user.id);
      if (success) {
        Alert.alert('Success', 'Test notification sent! Check your device.');
      } else {
        Alert.alert('Error', 'Failed to send test notification');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    } finally {
      setSendingTest(false);
    }
  };

  const copyTokenToClipboard = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('Copied', 'FCM token copied to clipboard');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 py-8">
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Dealerships Chat
          </Text>
          <Text className="text-gray-600">
            Welcome, {user?.email || 'User'}!
          </Text>
        </View>

        {registering && (
          <View className="mb-6 p-4 bg-blue-50 rounded-lg">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="ml-2 text-blue-600">
                Setting up notifications...
              </Text>
            </View>
          </View>
        )}

        {isExpoGo && (
          <View className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <Text className="text-yellow-800 font-semibold mb-2">
              ⚠️ Running in Expo Go
            </Text>
            <Text className="text-yellow-700 text-sm">
              Push notifications require a development build. The app will show placeholder tokens and simulate functionality for testing the UI.
            </Text>
          </View>
        )}

        <View className="space-y-4">
          <View className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              FCM Token
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Use this token for manual testing in Firebase Console:
            </Text>
            {fcmToken ? (
              <View>
                <View className="bg-gray-100 p-3 rounded border">
                  <Text className="text-xs font-mono text-gray-800 break-all">
                    {fcmToken}
                  </Text>
                </View>
                <TouchableOpacity
                  className="mt-2 py-2 px-4 bg-gray-600 rounded"
                  onPress={copyTokenToClipboard}
                >
                  <Text className="text-white text-center font-medium">
                    Copy Token
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text className="text-red-500">No FCM token available</Text>
            )}
          </View>

          <View className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              Test Notifications
            </Text>
            <Text className="text-sm text-gray-600 mb-3">
              Send a test notification to verify the setup:
            </Text>
            <TouchableOpacity
              className={`py-3 px-4 rounded-lg ${
                sendingTest || !fcmToken ? 'bg-gray-400' : 'bg-green-600'
              }`}
              onPress={handleSendTestNotification}
              disabled={sendingTest || !fcmToken}
            >
              <Text className="text-white text-center font-medium">
                {sendingTest ? 'Sending...' : 'Send Test Notification'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white p-4 rounded-lg shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 mb-2">
              User Information
            </Text>
            <Text className="text-sm text-gray-600">
              User ID: {user?.id || 'Unknown'}
            </Text>
            <Text className="text-sm text-gray-600">
              Email: {user?.email || 'Unknown'}
            </Text>
          </View>

          <TouchableOpacity
            className="py-3 px-4 bg-red-600 rounded-lg"
            onPress={handleSignOut}
          >
            <Text className="text-white text-center font-medium">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
