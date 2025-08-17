import { getAuthenticatedApi } from './api-client';

export interface InviteCreate {
  email: string;
  role_name: 'owner' | 'manager' | 'salesperson';
  expires_in_days?: number;
}

export interface InviteResponse {
  id: string;
  dealership_id: string;
  email: string;
  token: string;
  role_name: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export interface InviteListResponse {
  id: string;
  email: string;
  role_name: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: string;
}

export interface InviteAccept {
  token: string;
  full_name: string;
  password: string;
  phone?: string;
}

export async function createInvite(payload: InviteCreate): Promise<InviteResponse> {
  const api = await getAuthenticatedApi();
  return api.post<InviteResponse>('/invites', payload);
}

export async function getDealershipInvites(): Promise<InviteListResponse[]> {
  const api = await getAuthenticatedApi();
  return api.get<InviteListResponse[]>('/invites');
}

export async function acceptInvite(payload: InviteAccept): Promise<{ success: boolean; message: string; user_id: string }> {
  // This endpoint doesn't require authentication
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invites/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to accept invite');
  }

  return response.json();
}

export async function cancelInvite(inviteId: string): Promise<{ success: boolean; message: string }> {
  const api = await getAuthenticatedApi();
  return api.delete<{ success: boolean; message: string }>(`/invites/${inviteId}`);
}
