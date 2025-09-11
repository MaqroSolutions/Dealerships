// No client-side Stripe dependency required when using session.url redirect
export const getStripe = async () => null;
export const isStripeConfigured = () => true;
export const stripeConfig = { publishableKey: undefined, productId: undefined };
