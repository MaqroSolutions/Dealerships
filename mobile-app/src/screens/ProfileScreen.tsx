import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Avatar,
  List,
  Divider,
  useTheme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.name}>
                {user.full_name}
              </Text>
              <Text variant="bodyMedium" style={styles.role}>
                Sales Representative
              </Text>
              <Text variant="bodySmall" style={styles.email}>
                {user.email}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Contact Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Contact Information
            </Text>
            <List.Item
              title="Phone"
              description={user.phone}
              left={(props) => <List.Icon {...props} icon="phone" />}
              style={styles.listItem}
            />
            <List.Item
              title="Email"
              description={user.email}
              left={(props) => <List.Icon {...props} icon="email" />}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* App Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              App Information
            </Text>
            <List.Item
              title="Version"
              description="1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
              style={styles.listItem}
            />
            <List.Item
              title="Notifications"
              description="Enabled"
              left={(props) => <List.Icon {...props} icon="bell" />}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Quick Actions
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                // Handle refresh data
                Alert.alert('Info', 'Refreshing app data...');
              }}
              style={styles.actionButton}
              icon="refresh"
            >
              Refresh Data
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                // Handle clear cache
                Alert.alert('Info', 'Clearing app cache...');
              }}
              style={styles.actionButton}
              icon="delete"
            >
              Clear Cache
            </Button>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#FF3B30"
          icon="logout"
        >
          Logout
        </Button>

        {/* App Footer */}
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Dealership Sales App v1.0.0
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            Powered by Maqro
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    elevation: 2,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#007AFF',
  },
  profileInfo: {
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  role: {
    color: '#666',
    marginBottom: 4,
  },
  email: {
    color: '#999',
  },
  infoCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  listItem: {
    paddingVertical: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default ProfileScreen;
