import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    if (!process.env.STRIPE_PRODUCT_ID) {
      return NextResponse.json(
        { error: 'Stripe product ID not configured' },
        { status: 500 }
      );
    }

    const { priceId, successUrl, cancelUrl, quantity, customPricing, dealershipId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    let lineItems: any[] = [];

    if (customPricing) {
      // Handle custom pricing for subscription mode
      const { pricePerUnit, setupFee, tier } = customPricing;
      const qty = quantity || 1;

      // Create the recurring subscription item
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Subscription - ${tier}`,
            description: `Monthly subscription for ${tier}`,
          },
          recurring: {
            interval: 'month',
          },
          unit_amount: Math.round(pricePerUnit * 100), // Convert to cents
        },
        quantity: qty,
      });
    } else {
      // Fallback to original behavior
      lineItems = [
        {
          price: priceId,
          quantity: quantity || 1,
        },
      ];
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription', // Always use subscription mode for recurring billing
      success_url: successUrl || `${request.nextUrl.origin}/admin/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/admin/billing?canceled=true`,
      metadata: {
        product_id: priceId,
        dealership_id: dealershipId,
        ...(customPricing && {
          tier: customPricing.tier,
          quantity: quantity,
          price_per_unit: customPricing.pricePerUnit,
          setup_fee: customPricing.setupFee,
        }),
      },
    });

    return NextResponse.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
