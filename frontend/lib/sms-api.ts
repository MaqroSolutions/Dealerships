import { getAuthenticatedApi } from './api-client';
import { sendTelnyxSMS } from './telnyx-api';

export interface SMSResponse {
  success: boolean;
  message_id?: string;
  to?: string;
  message?: string;
  error?: string;
}

export async function sendSMS(to: string, body: string): Promise<SMSResponse> {
  try {
    return sendTelnyxSMS(to, body);
  } catch (error) {
    console.error('SMS sending error (telnyx):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS via Telnyx'
    };
  }
}

// Keep legacy function for backward compatibility
// Legacy Vonage function removed: SMS is handled strictly via Telnyx