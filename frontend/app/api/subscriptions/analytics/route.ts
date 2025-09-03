import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dealershipId = searchParams.get('dealershipId');

    if (!dealershipId) {
      return NextResponse.json({ error: 'Dealership ID is required' }, { status: 400 });
    }

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('dealership_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          description,
          monthly_price_cents,
          max_salespeople
        )
      `)
      .eq('dealership_id', dealershipId)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Get subscription events for analytics
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('dealership_subscription_id', subscription?.id)
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.error('Error fetching subscription events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch subscription events' }, { status: 500 });
    }

    // Get subscription plan statistics
    const { data: planStats, error: statsError } = await supabase
      .from('subscription_plans')
      .select(`
        name,
        monthly_price_cents,
        dealership_subscriptions!inner (
          id,
          status,
          created_at
        )
      `);

    if (statsError) {
      console.error('Error fetching plan statistics:', statsError);
      return NextResponse.json({ error: 'Failed to fetch plan statistics' }, { status: 500 });
    }

    // Process plan statistics
    const planAnalytics = planStats?.reduce((acc: any, plan: any) => {
      const planName = plan.name;
      if (!acc[planName]) {
        acc[planName] = {
          total_subscriptions: 0,
          active_subscriptions: 0,
          total_revenue: 0,
        };
      }
      
      plan.dealership_subscriptions.forEach((sub: any) => {
        acc[planName].total_subscriptions++;
        if (sub.status === 'active') {
          acc[planName].active_subscriptions++;
          acc[planName].total_revenue += plan.monthly_price_cents;
        }
      });
      
      return acc;
    }, {});

    return NextResponse.json({
      current_subscription: subscription,
      subscription_events: events || [],
      plan_analytics: planAnalytics || {},
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
