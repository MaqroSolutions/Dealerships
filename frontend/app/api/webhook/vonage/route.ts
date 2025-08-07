import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Vonage webhook parameters
    const from = formData.get('msisdn') as string; // Customer's phone number
    const to = formData.get('to') as string; // Your Vonage number
    const text = formData.get('text') as string; // Message content
    const messageId = formData.get('messageId') as string;
    const timestamp = formData.get('message-timestamp') as string;
    
    console.log('Incoming Vonage message:', { from, to, text, messageId, timestamp });
    
    if (!from || !text) {
      console.log('Missing required parameters');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Find the lead by phone number
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('id, name, user_id, dealership_id')
      .eq('phone', from)
      .single();

    if (leadError || !leads) {
      console.log('No lead found for phone number:', from);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get the salesperson's phone number
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('phone')
      .eq('user_id', leads.user_id)
      .single();

    if (profileError || !userProfile?.phone) {
      console.log('No salesperson phone found for lead:', leads.id);
      return NextResponse.json({ error: 'Salesperson not found' }, { status: 404 });
    }

    // Save the incoming message to conversations
    const { error: conversationError } = await supabase
      .from('conversations')
      .insert({
        lead_id: leads.id,
        message: text,
        sender: 'customer'
      });

    if (conversationError) {
      console.log('Error saving conversation:', conversationError);
      return NextResponse.json({ error: 'Failed to save conversation' }, { status: 500 });
    }

    // Forward the message to the salesperson
    const salespersonPhone = userProfile.phone;
    const forwardMessage = `Message from ${leads.name} (${from}): ${text}`;
    
    // Send SMS to salesperson using Vonage
    const apiKey = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;
    const vonageFrom = process.env.VONAGE_PHONE_NUMBER;

    if (!apiKey || !apiSecret || !vonageFrom) {
      console.log('Vonage credentials not set');
      return NextResponse.json({ error: 'Vonage credentials not set' }, { status: 500 });
    }

    const url = 'https://rest.nexmo.com/sms/json';
    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('api_secret', apiSecret);
    params.append('to', salespersonPhone);
    params.append('from', vonageFrom);
    params.append('text', forwardMessage);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      console.log('Failed to forward message to salesperson');
      return NextResponse.json({ error: 'Failed to forward message' }, { status: 500 });
    }

    const data = await res.json();
    
    if (data.messages && data.messages[0] && data.messages[0].status === '0') {
      console.log('Message forwarded successfully to salesperson');
      return NextResponse.json({ 
        success: true, 
        messageId: data.messages[0]['message-id'],
        forwardedTo: salespersonPhone
      });
    } else {
      const errorMessage = data.messages?.[0]?.['error-text'] || 'Failed to forward message';
      console.log('Vonage delivery error:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

  } catch (error) {
    console.log('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
