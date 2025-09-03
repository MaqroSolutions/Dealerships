import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);
  
  const { dealership_id, tier, quantity, price_per_unit, setup_fee } = session.metadata || {};
  
  if (!dealership_id) {
    console.error('No dealership_id in session metadata');
    return;
  }

  // Get the subscription plan based on the product ID
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('stripe_product_id', session.metadata?.product_id)
    .single();

  if (!plan) {
    console.error('Subscription plan not found for product:', session.metadata?.product_id);
    return;
  }

  // Create subscription record
  const { data: subscription, error } = await supabase
    .from('dealership_subscriptions')
    .insert({
      dealership_id,
      subscription_plan_id: plan.id,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating subscription:', error);
    return;
  }

  // Update dealership with current subscription
  await supabase
    .from('dealerships')
    .update({ current_subscription_id: subscription.id })
    .eq('id', dealership_id);

  // Log the event
  await supabase
    .from('subscription_events')
    .insert({
      dealership_subscription_id: subscription.id,
      event_type: 'created',
      stripe_event_id: session.id,
      event_data: {
        tier,
        quantity,
        price_per_unit,
        setup_fee,
        session_id: session.id,
      },
    });

  console.log('Subscription created successfully:', subscription.id);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  // Update subscription with Stripe data
  const { error } = await supabase
    .from('dealership_subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  const { error } = await supabase
    .from('dealership_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  // Log the event
  const { data: subRecord } = await supabase
    .from('dealership_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subRecord) {
    await supabase
      .from('subscription_events')
      .insert({
        dealership_subscription_id: subRecord.id,
        event_type: 'updated',
        stripe_event_id: subscription.id,
        event_data: {
          status: subscription.status,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
        },
      });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('dealership_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }

  // Log the event
  const { data: subRecord } = await supabase
    .from('dealership_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subRecord) {
    await supabase
      .from('subscription_events')
      .insert({
        dealership_subscription_id: subRecord.id,
        event_type: 'canceled',
        stripe_event_id: subscription.id,
        event_data: {
          canceled_at: subscription.canceled_at,
        },
      });
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  
  if (!invoice.subscription) return;

  // Log the event
  const { data: subRecord } = await supabase
    .from('dealership_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (subRecord) {
    await supabase
      .from('subscription_events')
      .insert({
        dealership_subscription_id: subRecord.id,
        event_type: 'payment_succeeded',
        stripe_event_id: invoice.id,
        event_data: {
          amount_paid: invoice.amount_paid,
          currency: invoice.currency,
        },
      });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id);
  
  if (!invoice.subscription) return;

  // Update subscription status
  await supabase
    .from('dealership_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription as string);

  // Log the event
  const { data: subRecord } = await supabase
    .from('dealership_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (subRecord) {
    await supabase
      .from('subscription_events')
      .insert({
        dealership_subscription_id: subRecord.id,
        event_type: 'payment_failed',
        stripe_event_id: invoice.id,
        event_data: {
          amount_due: invoice.amount_due,
          currency: invoice.currency,
        },
      });
  }
}
