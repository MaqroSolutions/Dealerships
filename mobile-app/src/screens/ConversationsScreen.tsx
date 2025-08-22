import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Searchbar,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  car_interest?: string;
  source: string;
  status: string;
  created_at: string;
  last_contact?: string;
  conversation_count: number;
}

const ConversationsScreen: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [searchQuery, leads]);

  const loadLeads = async () => {
    try {
      const response = await apiClient.getLeads();
      setLeads(response.leads || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLeads = async () => {
    setIsRefreshing(true);
    await loadLeads();
    setIsRefreshing(false);
  };

  const filterLeads = () => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads);
      return;
    }

    const filtered = leads.filter(lead =>
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.car_interest && lead.car_interest.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return '#007AFF';
      case 'contacted':
        return '#FF9500';
      case 'qualified':
        return '#34C759';
      case 'proposal':
        return '#AF52DE';
      case 'negotiation':
        return '#FF3B30';
      case 'closed':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <Card style={styles.card} onPress={() => navigation.navigate('ConversationDetail', { leadId: item.id, leadName: item.name })}>
      <Card.Content>
        <View style={styles.leadHeader}>
          <View style={styles.leadInfo}>
            <Text variant="titleMedium" style={styles.leadName}>
              {item.name}
            </Text>
            <Text variant="bodyMedium" style={styles.leadPhone}>
              {item.phone}
            </Text>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {item.status}
          </Chip>
        </View>

        {item.car_interest && (
          <Text variant="bodySmall" style={styles.carInterest}>
            🚗 {item.car_interest}
          </Text>
        )}

        <View style={styles.leadFooter}>
          <Text variant="bodySmall" style={styles.source}>
            Source: {item.source}
          </Text>
          <Text variant="bodySmall" style={styles.date}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View style={styles.conversationInfo}>
          <Ionicons name="chatbubbles-outline" size={16} color="#666" />
          <Text variant="bodySmall" style={styles.conversationCount}>
            {item.conversation_count} messages
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search leads..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredLeads}
        renderItem={renderLead}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshLeads} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No conversations yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              New customer messages will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leadInfo: {
    flex: 1,
    marginRight: 12,
  },
  leadName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  leadPhone: {
    color: '#666',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  carInterest: {
    marginBottom: 8,
    color: '#666',
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  source: {
    color: '#666',
  },
  date: {
    color: '#666',
  },
  conversationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationCount: {
    marginLeft: 4,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
});

export default ConversationsScreen;
