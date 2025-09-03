#!/usr/bin/env node

// Environment verification script
console.log('🔍 Environment Variables Check\n');

// Backend connection
const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
console.log('Backend API URL:', apiUrl ? '✅' : '❌', apiUrl || 'Missing NEXT_PUBLIC_API_BASE_URL');

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('Supabase URL:', supabaseUrl && !supabaseUrl.includes('your-') ? '✅' : '❌', supabaseUrl || 'Missing NEXT_PUBLIC_SUPABASE_URL');
console.log('Supabase Key:', supabaseKey && !supabaseKey.includes('your-') ? '✅' : '❌', supabaseKey ? 'Set' : 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Stripe
const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeProduct = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_ID;
const stripeSecret = process.env.STRIPE_SECRET_KEY;

console.log('Stripe Publishable Key:', stripePublishable && !stripePublishable.includes('your_') ? '✅' : '❌', stripePublishable ? (stripePublishable.startsWith('pk_') ? 'Valid format' : 'Invalid format') : 'Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
console.log('Stripe Product ID:', stripeProduct ? '✅' : '❌', stripeProduct || 'Missing NEXT_PUBLIC_STRIPE_PRODUCT_ID');
console.log('Stripe Secret Key:', stripeSecret && !stripeSecret.includes('your_') ? '✅' : '❌', stripeSecret ? (stripeSecret.startsWith('sk_') ? 'Valid format' : 'Invalid format') : 'Missing STRIPE_SECRET_KEY');

console.log('\n📋 Summary:');
const allConfigured = apiUrl && 
  supabaseUrl && !supabaseUrl.includes('your-') &&
  supabaseKey && !supabaseKey.includes('your-') &&
  stripePublishable && !stripePublishable.includes('your_') &&
  stripeProduct &&
  stripeSecret && !stripeSecret.includes('your_');

if (allConfigured) {
  console.log('✅ All environment variables are configured!');
  console.log('🚀 You can now test the Stripe integration');
} else {
  console.log('❌ Some environment variables need to be configured');
  console.log('📝 Run ./setup-stripe-env.sh to set up the template');
  console.log('🔑 Then add your actual Supabase and Stripe keys');
}
