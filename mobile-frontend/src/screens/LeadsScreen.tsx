import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead } from '../lib/supabase';
import { getLeads } from '../lib/leads-api';

interface LeadsScreenProps {
  onLeadPress: (lead: Lead) => void;
}

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  warm: 'bg-yellow-100 text-yellow-800', 
  hot: 'bg-red-100 text-red-800',
  'follow-up': 'bg-purple-100 text-purple-800',
  cold: 'bg-gray-100 text-gray-800',
  deal_won: 'bg-green-100 text-green-800',
  deal_lost: 'bg-red-100 text-red-800',
  appointment_booked: 'bg-indigo-100 text-indigo-800',
};

const statusIcons = {
  new: 'star-outline',
  warm: 'flame-outline',
  hot: 'flame',
  'follow-up': 'time-outline',
  cold: 'snow-outline',
  deal_won: 'checkmark-circle',
  deal_lost: 'close-circle',
  appointment_booked: 'calendar',
};

export default function LeadsScreen({ onLeadPress }: LeadsScreenProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => onLeadPress(item)}
    >
      <View style={styles.leadHeader}>
        <View style={styles.leadInfo}>
          <Text style={styles.leadName}>{item.name}</Text>
          <Text style={styles.leadCar}>{item.car_interest}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Ionicons 
            name={statusIcons[item.status] as any} 
            size={12} 
            color="#FFFFFF"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {item.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <Ionicons name="mail-outline" size={14} color="#6B7280" />
        <Text style={styles.contactText}>{item.email || 'No email'}</Text>
      </View>

      <View style={styles.contactRow}>
        <Ionicons name="call-outline" size={14} color="#6B7280" />
        <Text style={styles.contactText}>{item.phone || 'No phone'}</Text>
      </View>

      {item.max_price && (
        <View style={styles.contactRow}>
          <Ionicons name="cash-outline" size={14} color="#6B7280" />
          <Text style={styles.contactText}>Budget: {item.max_price}</Text>
        </View>
      )}

      <View style={styles.leadFooter}>
        <Text style={styles.lastContactText}>
          Last contact: {formatDate(item.last_contact_at)}
        </Text>
        <View style={styles.messagesRow}>
          <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
          <Text style={styles.messagesText}>
            {item.conversations?.length || 0} messages
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getStatusStyle = (status: string) => {
    const statusStyles: { [key: string]: any } = {
      new: { backgroundColor: '#3B82F6' },
      warm: { backgroundColor: '#F59E0B' },
      hot: { backgroundColor: '#EF4444' },
      'follow-up': { backgroundColor: '#8B5CF6' },
      cold: { backgroundColor: '#6B7280' },
      deal_won: { backgroundColor: '#10B981' },
      deal_lost: { backgroundColor: '#DC2626' },
      appointment_booked: { backgroundColor: '#6366F1' },
    };
    return statusStyles[status] || { backgroundColor: '#6B7280' };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading leads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leads</Text>
        <Text style={styles.headerSubtitle}>{leads.length} total leads</Text>
      </View>

      {leads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>
            No leads yet
          </Text>
          <Text style={styles.emptySubtitle}>
            Your customer leads will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          renderItem={renderLead}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  leadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  leadCar: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  leadFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastContactText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
});
