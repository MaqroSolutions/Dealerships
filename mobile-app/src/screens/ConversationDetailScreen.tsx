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
  TextInput,
  ActivityIndicator,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../types/navigation';

type RoutePropType = RouteProp<RootStackParamList, 'ConversationDetail'>;

interface Message {
  id: string;
  message: string;
  sender: 'customer' | 'agent' | 'system';
  created_at: string;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  car_interest?: string;
  source: string;
  status: string;
  created_at: string;
}

const ConversationDetailScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { leadId, leadName } = route.params;
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadLeadAndMessages();
  }, [leadId]);

  const loadLeadAndMessages = async () => {
    try {
      const [leadResponse, messagesResponse] = await Promise.all([
        apiClient.getLead(leadId),
        apiClient.getConversationHistory(leadId),
      ]);
      
      setLead(leadResponse.lead || null);
      setMessages(messagesResponse.messages || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadLeadAndMessages();
    setIsRefreshing(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      // This would typically send a message through your backend
      // For now, we'll just add it to the local state
      const tempMessage: Message = {
        id: Date.now().toString(),
        message: newMessage,
        sender: 'agent',
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      
      // TODO: Implement actual message sending through API
      Alert.alert('Info', 'Message sending functionality coming soon!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
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

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'customer' ? styles.customerMessage : styles.agentMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'customer' ? styles.customerBubble : styles.agentBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.sender === 'customer' ? styles.customerText : styles.agentText
        ]}>
          {item.message}
        </Text>
        <Text style={[
          styles.messageTime,
          item.sender === 'customer' ? styles.customerTime : styles.agentTime
        ]}>
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
      {item.sender === 'system' && (
        <Text style={styles.systemMessage}>
          {item.message}
        </Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading conversation...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Lead Header */}
      {lead && (
        <Card style={styles.leadHeader}>
          <Card.Content>
            <View style={styles.leadInfo}>
              <View style={styles.leadDetails}>
                <Text variant="titleLarge" style={styles.leadName}>
                  {lead.name}
                </Text>
                <Text variant="bodyMedium" style={styles.leadPhone}>
                  📱 {lead.phone}
                </Text>
                {lead.email && (
                  <Text variant="bodySmall" style={styles.leadEmail}>
                    ✉️ {lead.email}
                  </Text>
                )}
              </View>
              <View style={styles.leadStatus}>
                <Chip
                  mode="outlined"
                  textStyle={{ color: getStatusColor(lead.status) }}
                  style={[styles.statusChip, { borderColor: getStatusColor(lead.status) }]}
                >
                  {lead.status}
                </Chip>
              </View>
            </View>
            
            {lead.car_interest && (
              <View style={styles.carInterest}>
                <Text variant="bodyMedium" style={styles.carInterestText}>
                  🚗 Interested in: {lead.car_interest}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No messages yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Start the conversation with your customer
            </Text>
          </View>
        }
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.messageInput}
          multiline
          maxLength={500}
        />
        <Button
          mode="contained"
          onPress={handleSendMessage}
          loading={isSending}
          disabled={isSending || !newMessage.trim()}
          style={styles.sendButton}
          icon="send"
        >
          Send
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  leadHeader: {
    margin: 16,
    elevation: 2,
  },
  leadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leadDetails: {
    flex: 1,
    marginRight: 12,
  },
  leadName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  leadPhone: {
    color: '#666',
    marginBottom: 2,
  },
  leadEmail: {
    color: '#666',
  },
  leadStatus: {
    alignSelf: 'flex-start',
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  carInterest: {
    marginTop: 8,
  },
  carInterestText: {
    color: '#666',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  customerMessage: {
    alignItems: 'flex-start',
  },
  agentMessage: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  customerBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  customerText: {
    color: '#333',
  },
  agentText: {
    color: 'white',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  customerTime: {
    color: '#666',
  },
  agentTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  systemMessage: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  messageInput: {
    flex: 1,
    marginRight: 12,
    maxHeight: 100,
  },
  sendButton: {
    alignSelf: 'flex-end',
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

export default ConversationDetailScreen;
