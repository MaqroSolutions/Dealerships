import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Stripe secret key not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe inside the handler to ensure updated env is used
    const stripe = new Stripe(secretKey);

    let { priceId, successUrl, cancelUrl, quantity, customPricing, dealershipId } = await request.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    let lineItems: any[] = [];

    // Decide line items based on identifier type
    if (typeof priceId === 'string' && priceId.startsWith('price_')) {
      // Direct catalog price id
      lineItems = [{ price: priceId, quantity: quantity || 1 }];
    } else if (typeof priceId === 'string' && priceId.startsWith('prod_')) {
      // Product id; prefer custom pricing attached to product, else resolve product's default/active monthly price
      if (customPricing) {
        const { pricePerUnit, setupFee, tier } = customPricing;
        const qty = quantity || 1;
        lineItems.push({
          price_data: {
            currency: 'usd',
            product: priceId,
            recurring: { interval: 'month' },
            unit_amount: Math.round(pricePerUnit * 100),
          },
          quantity: qty,
        });
      } else {
        // Resolve a price from the product
        const product = await stripe.products.retrieve(priceId as string, { expand: ['default_price'] });
        let resolvedPriceId: string | null = null;
        const dp: any = (product as any).default_price;
        if (typeof dp === 'string') resolvedPriceId = dp; else if (dp && typeof dp === 'object' && dp.id) resolvedPriceId = dp.id as string;
        if (!resolvedPriceId) {
          const prices = await stripe.prices.list({ product: priceId as string, active: true, limit: 10 });
          const recurring = prices.data.filter(p => p.recurring && p.recurring.interval === 'month');
          const chosen = (recurring[0] || prices.data[0]);
          if (chosen) resolvedPriceId = chosen.id;
        }
        if (!resolvedPriceId) {
          return NextResponse.json({ error: 'No active price found for product' }, { status: 400 });
        }
        lineItems = [{ price: resolvedPriceId, quantity: quantity || 1 }];
      }
    }

    if (!lineItems.length && customPricing) {
      // Handle custom pricing for subscription mode
      const { pricePerUnit, setupFee, tier } = customPricing;
      const qty = quantity || 1;
      // Create the recurring subscription item
      const priceData: any = {
        currency: 'usd',
        recurring: { interval: 'month' },
        unit_amount: Math.round(pricePerUnit * 100),
      };

      // If caller passed a Stripe product ID, attach the Price to that catalog product
      if (priceId && typeof priceId === 'string' && priceId.startsWith('prod_')) {
        priceData.product = priceId;
      } else {
        // Otherwise, use ad-hoc product details
        priceData.product_data = {
          name: `Subscription - ${tier}`,
          description: `Monthly subscription for ${tier}`,
        };
      }

      lineItems.push({ price_data: priceData, quantity: qty });
    }

    if (!lineItems.length) {
      return NextResponse.json({ error: 'No valid price or custom pricing provided' }, { status: 400 });
    }

    // Create Checkout Session
    const sessionConfig: any = {
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
    };

    // Add setup fee as subscription_data if custom pricing
    if (customPricing && customPricing.setupFee > 0) {
      sessionConfig.subscription_data = {
        metadata: {
          setup_fee: customPricing.setupFee.toString(),
          setup_fee_paid: 'false',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, sessionUrl: session.url });

  } catch (error: any) {
    console.error('Error creating checkout session:', error?.message || error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
