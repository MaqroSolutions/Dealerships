import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lead, Conversation } from '../lib/supabase';
import { getLeadById, updateLeadStatus, addConversationMessage } from '../lib/leads-api';

interface LeadDetailScreenProps {
  leadId: string;
  onBack: () => void;
}

const statusOptions = [
  { value: 'new', label: 'New', color: 'bg-blue-500' },
  { value: 'warm', label: 'Warm', color: 'bg-yellow-500' },
  { value: 'hot', label: 'Hot', color: 'bg-red-500' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-purple-500' },
  { value: 'cold', label: 'Cold', color: 'bg-gray-500' },
  { value: 'deal_won', label: 'Deal Won', color: 'bg-green-500' },
  { value: 'deal_lost', label: 'Deal Lost', color: 'bg-red-600' },
  { value: 'appointment_booked', label: 'Appointment', color: 'bg-indigo-500' },
];

export default function LeadDetailScreen({ leadId, onBack }: LeadDetailScreenProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      const data = await getLeadById(leadId);
      setLead(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: Lead['status']) => {
    if (!lead) return;

    try {
      await updateLeadStatus(lead.id, newStatus);
      setLead({ ...lead, status: newStatus });
      Alert.alert('Success', 'Lead status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !lead) return;

    setSending(true);
    try {
      await addConversationMessage(lead.id, newMessage.trim(), 'agent');
      
      // Add the message to local state
      const newConversation: Conversation = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        message: newMessage.trim(),
        sender: 'agent',
        lead_id: lead.id,
      };
      
      setLead({
        ...lead,
        conversations: [...(lead.conversations || []), newConversation],
      });
      
      setNewMessage('');
      Alert.alert('Success', 'Message sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Conversation }) => (
    <View className={`mb-3 ${item.sender === 'agent' ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[80%] p-3 rounded-lg ${
          item.sender === 'agent'
            ? 'bg-blue-500 rounded-br-sm'
            : 'bg-gray-200 rounded-bl-sm'
        }`}
      >
        <Text className={item.sender === 'agent' ? 'text-white' : 'text-gray-900'}>
          {item.message}
        </Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1">
        {new Date(item.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading lead details...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Lead not found</Text>
        <TouchableOpacity
          onPress={onBack}
          className="mt-4 px-4 py-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">{lead.name}</Text>
            <Text className="text-sm text-gray-600">{lead.car_interest}</Text>
          </View>
        </View>
      </View>

      {/* Lead Info */}
      <ScrollView className="bg-white mx-4 mt-4 p-4 rounded-lg shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Lead Information</Text>
        
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">{lead.email || 'No email'}</Text>
          </View>
          
          <View className="flex-row items-center">
            <Ionicons name="call-outline" size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">{lead.phone || 'No phone'}</Text>
          </View>
          
          {lead.max_price && (
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={16} color="#6B7280" />
              <Text className="text-gray-700 ml-2">Budget: {lead.max_price}</Text>
            </View>
          )}
          
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text className="text-gray-700 ml-2">Source: {lead.source}</Text>
          </View>
        </View>

        {/* Status Selector */}
        <View className="mt-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() => handleStatusUpdate(status.value as Lead['status'])}
                  className={`px-3 py-2 rounded-full ${
                    lead.status === status.value ? status.color : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      lead.status === status.value ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Conversations */}
      <View className="flex-1 bg-white mx-4 mt-4 rounded-lg shadow-sm">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">Conversation</Text>
        </View>
        
        <FlatList
          data={lead.conversations || []}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-8">
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No messages yet</Text>
            </View>
          }
        />
        
        {/* Message Input */}
        <View className="flex-row items-center p-4 border-t border-gray-200">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 mr-2"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-lg ${
              newMessage.trim() && !sending ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
