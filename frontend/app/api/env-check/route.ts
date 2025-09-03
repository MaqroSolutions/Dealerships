import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ? 'Set' : 'Missing',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? 'Set' : 'Missing',
    };

    return NextResponse.json({
      message: 'Environment check',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
