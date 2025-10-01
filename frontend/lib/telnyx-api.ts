import { getAuthenticatedApi } from './api-client';

export interface TelnyxResponse {
  success: boolean;
  message_id?: string;
  to?: string;
  message?: string;
  error?: string;
}

export interface MessageStatus {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendTelnyxSMS(to: string, body: string): Promise<TelnyxResponse> {
  try {
    const api = await getAuthenticatedApi();
    return api.post<TelnyxResponse>('/telnyx/send-sms', { to, body });
  } catch (error) {
    console.error('Telnyx SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS via Telnyx'
    };
  }
}


export async function getTelnyxMessageStatus(messageId: string): Promise<MessageStatus> {
  try {
    const api = await getAuthenticatedApi();
    return api.get<MessageStatus>(`/telnyx/message-status/${messageId}`);
  } catch (error) {
    console.error('Telnyx message status error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get message status'
    };
  }
}

export async function checkTelnyxHealth(): Promise<{ status: string; message: string; service: string }> {
  try {
    const api = await getAuthenticatedApi();
    return api.get<{ status: string; message: string; service: string }>('/telnyx/health');
  } catch (error) {
    console.error('Telnyx health check error:', error);
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Health check failed',
      service: 'telnyx'
    };
  }
}
