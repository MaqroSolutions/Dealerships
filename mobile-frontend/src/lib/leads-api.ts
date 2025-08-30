import { supabase, Lead } from './supabase';

export const getLeads = async (): Promise<Lead[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        conversations(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
};

export const getLeadById = async (leadId: string): Promise<Lead | null> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        conversations(*)
      `)
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }
};

export const updateLeadStatus = async (leadId: string, status: Lead['status']): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating lead status:', error);
    throw error;
  }
};

export const addConversationMessage = async (
  leadId: string, 
  message: string, 
  sender: 'customer' | 'agent'
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('conversations')
      .insert({
        lead_id: leadId,
        message,
        sender
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error adding conversation message:', error);
    throw error;
  }
};
