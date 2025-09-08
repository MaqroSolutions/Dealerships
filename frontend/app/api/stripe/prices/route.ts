import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with secret key (server-side only)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
});

export async function GET(request: NextRequest) {
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

    // Get all prices for the specific product
    const prices = await stripe.prices.list({
      product: process.env.STRIPE_PRODUCT_ID,
      active: true,
    });

    // Format the prices for frontend consumption
    const formattedPrices = prices.data.map(price => ({
      id: price.id,
      amount: price.unit_amount,
      currency: price.currency,
      interval: price.recurring?.interval,
      intervalCount: price.recurring?.interval_count,
      type: price.type, // 'one_time' or 'recurring'
      nickname: price.nickname,
    }));

    return NextResponse.json({ prices: formattedPrices });

  } catch (error: any) {
    console.error('Error fetching Stripe prices:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
