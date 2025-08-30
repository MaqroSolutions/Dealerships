import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Lead } from '../lib/supabase';

import LeadsScreen from '../screens/LeadsScreen';
import LeadDetailScreen from '../screens/LeadDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();

interface MainTabsProps {
  onSignOut: () => void;
}

export default function MainTabs({ onSignOut }: MainTabsProps) {
  const [selectedLead, setSelectedLead] = useState<string | null>(null);

  const handleLeadPress = (lead: Lead) => {
    setSelectedLead(lead.id);
  };

  const handleBackToLeads = () => {
    setSelectedLead(null);
  };

  const LeadsStackScreen = () => {
    if (selectedLead) {
      return (
        <LeadDetailScreen
          leadId={selectedLead}
          onBack={handleBackToLeads}
        />
      );
    }
    return <LeadsScreen onLeadPress={handleLeadPress} />;
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Leads') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Notifications') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'ellipse';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
          },
        })}
      >
        <Tab.Screen
          name="Leads"
          component={LeadsStackScreen}
          options={{
            tabBarLabel: 'Leads',
          }}
        />
        <Tab.Screen
          name="Notifications"
          children={() => <ChatScreen onSignOut={onSignOut} />}
          options={{
            tabBarLabel: 'Notifications',
          }}
        />
        <Tab.Screen
          name="Profile"
          children={() => <ProfileScreen onSignOut={onSignOut} />}
          options={{
            tabBarLabel: 'Profile',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
