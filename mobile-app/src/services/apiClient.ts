import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://localhost:8000'; // Change this to your backend URL

class ApiClient {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear it
          await SecureStore.deleteItemAsync('auth_token');
          // You might want to redirect to login here
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string) {
    try {
      const response = await this.axiosInstance.post('/api/auth/login', {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.axiosInstance.get('/api/auth/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async registerPushToken(token: string) {
    try {
      const response = await this.axiosInstance.post('/api/auth/push-token', {
        push_token: token,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Conversations
  async getConversations() {
    try {
      const response = await this.axiosInstance.get('/api/conversations');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getConversationHistory(leadId: string) {
    try {
      const response = await this.axiosInstance.get(`/api/conversations/${leadId}/history`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Pending Approvals
  async getPendingApprovals() {
    try {
      const response = await this.axiosInstance.get('/api/conversations/pending-approvals');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async approveResponse(approvalId: string) {
    try {
      const response = await this.axiosInstance.post(`/api/conversations/approve/${approvalId}`, {
        action: 'approve',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async rejectResponse(approvalId: string) {
    try {
      const response = await this.axiosInstance.post(`/api/conversations/approve/${approvalId}`, {
        action: 'reject',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async editResponse(approvalId: string, editInstructions: string) {
    try {
      const response = await this.axiosInstance.post(`/api/conversations/approve/${approvalId}`, {
        action: 'edit',
        edit_instructions: editInstructions,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async forceSendMessage(approvalId: string, customMessage: string) {
    try {
      const response = await this.axiosInstance.post(`/api/conversations/approve/${approvalId}`, {
        action: 'force_send',
        custom_message: customMessage,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Leads
  async getLeads() {
    try {
      const response = await this.axiosInstance.get('/api/leads');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getLead(leadId: string) {
    try {
      const response = await this.axiosInstance.get(`/api/leads/${leadId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Inventory
  async getInventory() {
    try {
      const response = await this.axiosInstance.get('/api/inventory');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
