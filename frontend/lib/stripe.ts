import { loadStripe, Stripe } from '@stripe/stripe-js';

// Stripe publishable key (safe for client-side)
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key. Check your .env.local file for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.');
}

// Singleton pattern for Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey || '');
  }
  return stripePromise;
};

// Stripe configuration
export const stripeConfig = {
  publishableKey: stripePublishableKey,
  productId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID,
  // Note: Secret key should only be accessed server-side, not here
};

// Helper function to check if Stripe is configured
export const isStripeConfigured = (): boolean => {
  return !!(stripeConfig.publishableKey && stripeConfig.productId);
};
