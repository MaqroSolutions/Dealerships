import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { supabase, getCurrentUser } from '../lib/supabase';
import { getFCMToken } from '../lib/firebase';

interface ProfileScreenProps {
  onSignOut: () => void;
}

export default function ProfileScreen({ onSignOut }: ProfileScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [fcmToken, setFCMToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      const token = await getFCMToken();
      setFCMToken(token);
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              onSignOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      {/* User Info Section */}
      <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center">
            <Ionicons name="person" size={32} color="white" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-lg font-semibold text-gray-900">
              {user?.email || 'User'}
            </Text>
            <Text className="text-sm text-gray-600">Dealership Agent</Text>
          </View>
        </View>
        
        <View className="space-y-3">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">{user?.email}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">
              Joined {new Date(user?.created_at).toLocaleDateString()}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="key-outline" size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-3">ID: {user?.id?.slice(0, 8)}...</Text>
          </View>
        </View>
      </View>

      {/* App Info Section */}
      <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-3">App Information</Text>
        
        <View className="space-y-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="phone-portrait-outline" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-3">Environment</Text>
            </View>
            <Text className={`text-sm font-medium ${isExpoGo ? 'text-yellow-600' : 'text-green-600'}`}>
              {isExpoGo ? 'Expo Go' : 'Development Build'}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-3">Push Notifications</Text>
            </View>
            <Text className={`text-sm font-medium ${fcmToken && !isExpoGo ? 'text-green-600' : 'text-gray-500'}`}>
              {fcmToken && !isExpoGo ? 'Enabled' : 'Limited in Expo Go'}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="server-outline" size={20} color="#6B7280" />
              <Text className="text-gray-700 ml-3">Backend Connection</Text>
            </View>
            <Text className="text-sm font-medium text-green-600">Connected</Text>
          </View>
        </View>
      </View>

      {/* FCM Token Section (for debugging) */}
      {fcmToken && (
        <View className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            {isExpoGo ? 'Demo Token' : 'FCM Token'}
          </Text>
          <View className="bg-gray-100 p-3 rounded border">
            <Text className="text-xs font-mono text-gray-800 break-all">
              {fcmToken}
            </Text>
          </View>
          <Text className="text-xs text-gray-500 mt-2">
            {isExpoGo 
              ? 'This is a placeholder token for Expo Go testing'
              : 'Use this token for Firebase Console testing'
            }
          </Text>
        </View>
      )}

      {/* Actions Section */}
      <View className="bg-white mx-4 mt-4 mb-8 p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Actions</Text>
        
        <TouchableOpacity
          className="flex-row items-center py-3 border-b border-gray-100"
          onPress={() => Alert.alert('Coming Soon', 'Settings feature will be available soon')}
        >
          <Ionicons name="settings-outline" size={20} color="#6B7280" />
          <Text className="text-gray-700 ml-3 flex-1">Settings</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center py-3 border-b border-gray-100"
          onPress={() => Alert.alert('Help', 'For support, please contact your system administrator')}
        >
          <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
          <Text className="text-gray-700 ml-3 flex-1">Help & Support</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-row items-center py-3"
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="text-red-500 ml-3 flex-1">Sign Out</Text>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
