import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { apiClient } from '../services/apiClient';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
  registerPushToken: (token: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Listen for incoming notifications
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const newNotification: Notification = {
        id: notification.request.identifier,
        title: notification.request.content.title || 'New Message',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
        timestamp: new Date(),
      };
      addNotification(newNotification);
    });

    return () => subscription.remove();
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const registerPushToken = async (token: string) => {
    try {
      await apiClient.registerPushToken(token);
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    addNotification,
    clearNotifications,
    registerPushToken,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
