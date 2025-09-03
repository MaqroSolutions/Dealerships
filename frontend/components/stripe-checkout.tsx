"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Loader2, CreditCard, Check, Users, Calculator } from 'lucide-react';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

interface PricingTier {
  minQuantity: number;
  maxQuantity: number | null;
  pricePerUnit: number;
  setupFee: number;
  label: string;
  description: string;
  productId: string;
}

interface StripeCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ onSuccess, onError }: StripeCheckoutProps) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const { toast } = useToast();

  // Define pricing tiers
  const pricingTiers: PricingTier[] = [
    {
      minQuantity: 1,
      maxQuantity: 3,
      pricePerUnit: 500.00,
      setupFee: 0.00,
      label: "Basic",
      description: "1-3 Salespeople",
      productId: "prod_Sz5IHIEbqcYsXs"
    },
    {
      minQuantity: 4,
      maxQuantity: 10,
      pricePerUnit: 1000.00,
      setupFee: 0.00,
      label: "Premium",
      description: "Up to 10 Salespeople",
      productId: "prod_Sz5IjUXqN7W5e4"
    },
    {
      minQuantity: 11,
      maxQuantity: null,
      pricePerUnit: 1500.00,
      setupFee: 0.00,
      label: "Deluxe",
      description: "10+ Salespeople",
      productId: "prod_Sz5HxTV9UWI1mH"
    },
    {
      minQuantity: 1,
      maxQuantity: null,
      pricePerUnit: 0.00,
      setupFee: 0.00,
      label: "Test Product",
      description: "Free testing plan",
      productId: "prod_Sz7Wz92o80HyIb"
    }
  ];

  // Check if Stripe is configured
  useEffect(() => {
    setConfigured(isStripeConfigured());
  }, []);

  // Calculate pricing for a specific tier and quantity
  const calculatePricing = (tier: PricingTier, qty: number) => {
    const monthlyCost = tier.pricePerUnit; // Fixed monthly rate
    const totalFirstMonth = monthlyCost + tier.setupFee;
    return { monthlyCost, totalFirstMonth };
  };

  const handleCheckout = async (tier: PricingTier, quantity: number) => {
    if (!configured) {
      toast({
        title: "Configuration Error",
        description: "Stripe is not properly configured",
        variant: "destructive",
      });
      return;
    }

    try {
      setCheckoutLoading(tier.label);

      // Create checkout session with custom pricing
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: tier.productId, // Use the product ID for this tier
          quantity: quantity,
          dealershipId: 'd660c7d6-99e2-4fa8-b99b-d221def53d20', // TODO: Get from user context
          customPricing: {
            pricePerUnit: tier.pricePerUnit,
            setupFee: tier.setupFee,
            tier: tier.label
          },
          successUrl: window.location.origin + '/admin/billing?success=true',
          cancelUrl: window.location.origin + '/admin/billing?canceled=true',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw new Error(error.message);
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      });
      onError?.(error.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (!configured) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 rounded-3xl blur-xl"></div>
        <Card className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-red-500/30 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Payment Integration</CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Payment system is not configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-300 text-lg">
                Stripe payment integration is not yet configured. Please contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Pricing Tiers */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-xl"></div>
        <Card className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-gray-700/50 backdrop-blur-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Choose Your Plan
            </CardTitle>
            <CardDescription className="text-gray-400 text-lg">
              Click on a plan to start your subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingTiers.map((tier, index) => {
                const { monthlyCost, totalFirstMonth } = calculatePricing(tier, tier.minQuantity);
                return (
                  <div
                    key={index}
                    className="group relative p-6 rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/50 to-gray-900/50 hover:border-blue-500/50 hover:scale-105 transition-all duration-500 cursor-pointer"
                    onClick={() => handleCheckout(tier, 1)}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300">
                        <Users className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-1">
                        {tier.label}
                      </h4>
                      <p className="text-sm text-gray-400 mb-2">
                        {tier.description}
                      </p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                        ${tier.pricePerUnit.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 mb-3">per month</p>
                    </div>
                    <Button
                      disabled={checkoutLoading === tier.label}
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
                    >
                      {checkoutLoading === tier.label ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Get Started
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
