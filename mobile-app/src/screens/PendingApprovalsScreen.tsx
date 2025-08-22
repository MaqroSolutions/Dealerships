import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
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
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

interface PendingApproval {
  id: string;
  lead_id: string;
  lead_name: string;
  customer_phone: string;
  customer_message: string;
  generated_response: string;
  created_at: string;
  status: string;
}

const PendingApprovalsScreen: React.FC = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      const response = await apiClient.getPendingApprovals();
      setApprovals(response.approvals || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApprovals = async () => {
    setIsRefreshing(true);
    await loadApprovals();
    setIsRefreshing(false);
  };

  const handleApprove = async (approvalId: string) => {
    setIsProcessing(true);
    try {
      await apiClient.approveResponse(approvalId);
      Alert.alert('Success', 'Response approved and sent to customer');
      await loadApprovals(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to approve response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (approvalId: string) => {
    setIsProcessing(true);
    try {
      await apiClient.rejectResponse(approvalId);
      Alert.alert('Success', 'Response rejected');
      await loadApprovals(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to reject response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (approvalId: string) => {
    if (!editInstructions.trim()) {
      Alert.alert('Error', 'Please provide edit instructions');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.editResponse(approvalId, editInstructions);
      Alert.alert('Success', 'Response updated with your instructions');
      setIsModalVisible(false);
      setEditInstructions('');
      await loadApprovals(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to edit response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceSend = async (approvalId: string) => {
    if (!customMessage.trim()) {
      Alert.alert('Error', 'Please provide a message to send');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.forceSendMessage(approvalId, customMessage);
      Alert.alert('Success', 'Your custom message sent to customer');
      setIsModalVisible(false);
      setCustomMessage('');
      await loadApprovals(); // Refresh the list
    } catch (error) {
      Alert.alert('Error', 'Failed to send custom message');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setIsModalVisible(true);
  };

  const renderApproval = ({ item }: { item: PendingApproval }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.approvalHeader}>
          <Text variant="titleMedium" style={styles.leadName}>
            {item.lead_name}
          </Text>
          <Chip mode="outlined" style={styles.statusChip}>
            Pending
          </Chip>
        </View>

        <Text variant="bodySmall" style={styles.customerPhone}>
          📱 {item.customer_phone}
        </Text>

        <View style={styles.messageSection}>
          <Text variant="bodySmall" style={styles.sectionTitle}>
            Customer Message:
          </Text>
          <Text variant="bodyMedium" style={styles.customerMessage}>
            {item.customer_message}
          </Text>
        </View>

        <View style={styles.messageSection}>
          <Text variant="bodySmall" style={styles.sectionTitle}>
            AI Suggested Response:
          </Text>
          <Text variant="bodyMedium" style={styles.aiResponse}>
            {item.generated_response}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={() => handleApprove(item.id)}
            loading={isProcessing}
            disabled={isProcessing}
            style={[styles.actionButton, styles.approveButton]}
            icon="check"
          >
            Approve
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleReject(item.id)}
            loading={isProcessing}
            disabled={isProcessing}
            style={[styles.actionButton, styles.rejectButton]}
            icon="close"
          >
            Reject
          </Button>
        </View>

        <View style={styles.secondaryActions}>
          <Button
            mode="text"
            onPress={() => openEditModal(item)}
            disabled={isProcessing}
            style={styles.secondaryButton}
            icon="pencil"
          >
            Edit
          </Button>
          <Button
            mode="text"
            onPress={() => openEditModal(item)}
            disabled={isProcessing}
            style={styles.secondaryButton}
            icon="send"
          >
            Custom Message
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading pending approvals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={approvals}
        renderItem={renderApproval}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshApprovals} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              No pending approvals
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              All customer responses have been approved
            </Text>
          </View>
        }
      />

      {/* Edit/Force Send Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {selectedApproval?.lead_name} - Response Options
            </Text>

            <View style={styles.modalSection}>
              <Text variant="bodyMedium" style={styles.modalSectionTitle}>
                Edit AI Response:
              </Text>
              <TextInput
                label="Edit Instructions"
                value={editInstructions}
                onChangeText={setEditInstructions}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="e.g., Make it more friendly and mention financing options"
                style={styles.textInput}
              />
              <Button
                mode="contained"
                onPress={() => handleEdit(selectedApproval!.id)}
                loading={isProcessing}
                disabled={isProcessing || !editInstructions.trim()}
                style={styles.modalButton}
              >
                Update Response
              </Button>
            </View>

            <View style={styles.modalSection}>
              <Text variant="bodyMedium" style={styles.modalSectionTitle}>
                Send Custom Message:
              </Text>
              <TextInput
                label="Your Message"
                value={customMessage}
                onChangeText={setCustomMessage}
                mode="outlined"
                multiline
                numberOfLines={3}
                placeholder="Type your custom message here..."
                style={styles.textInput}
              />
              <Button
                mode="contained"
                onPress={() => handleForceSend(selectedApproval!.id)}
                loading={isProcessing}
                disabled={isProcessing || !customMessage.trim()}
                style={styles.modalButton}
              >
                Send Custom Message
              </Button>
            </View>

            <Button
              mode="outlined"
              onPress={() => {
                setIsModalVisible(false);
                setEditInstructions('');
                setCustomMessage('');
              }}
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadName: {
    fontWeight: '600',
  },
  statusChip: {
    borderColor: '#FF9500',
  },
  customerPhone: {
    marginBottom: 16,
    color: '#666',
  },
  messageSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  customerMessage: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    color: '#333',
  },
  aiResponse: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    color: '#1976d2',
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#34C759',
  },
  rejectButton: {
    borderColor: '#FF3B30',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  secondaryButton: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    marginBottom: 12,
  },
  modalButton: {
    marginBottom: 8,
  },
  cancelButton: {
    marginTop: 8,
  },
});

export default PendingApprovalsScreen;
