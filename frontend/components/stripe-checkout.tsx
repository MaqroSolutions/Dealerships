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
      maxQuantity: 5,
      pricePerUnit: 50.00,
      setupFee: 500.00,
      label: "1-5 Salespeople"
    },
    {
      minQuantity: 6,
      maxQuantity: 20,
      pricePerUnit: 40.00,
      setupFee: 500.00,
      label: "6-20 Salespeople"
    },
    {
      minQuantity: 21,
      maxQuantity: 50,
      pricePerUnit: 30.00,
      setupFee: 500.00,
      label: "21-50 Salespeople"
    },
    {
      minQuantity: 51,
      maxQuantity: null,
      pricePerUnit: 25.00,
      setupFee: 500.00,
      label: "51+ Salespeople"
    }
  ];

  // Check if Stripe is configured
  useEffect(() => {
    setConfigured(isStripeConfigured());
  }, []);

  // Calculate pricing for a specific tier and quantity
  const calculatePricing = (tier: PricingTier, qty: number) => {
    const monthlyCost = qty * tier.pricePerUnit;
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
          priceId: 'price_1S1yKyFVu6VsADxGxisd3PIN', // Use your existing price ID
          quantity: quantity,
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
                    onClick={() => handleCheckout(tier, tier.minQuantity)}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-blue-500 group-hover:to-purple-500 flex items-center justify-center transition-all duration-300">
                        <Users className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">
                        {tier.label}
                      </h4>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-1">
                        ${tier.pricePerUnit.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400 mb-3">per salesperson/month</p>
                      <div className="px-3 py-1 rounded-full bg-gray-700/50 text-xs text-gray-300 mb-4">
                        Setup: ${tier.setupFee.toFixed(2)}
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">Starting at</p>
                        <p className="text-xl font-bold text-white">${totalFirstMonth.toFixed(2)}</p>
                        <p className="text-xs text-gray-500">first month</p>
                      </div>
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
