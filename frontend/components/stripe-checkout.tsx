"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { getStripe, isStripeConfigured } from '@/lib/stripe';
import { useToast } from '@/hooks/use-toast';

interface StripePrice {
  id: string;
  amount: number | null;
  currency: string;
  interval?: string;
  intervalCount?: number;
  type: string;
  nickname?: string;
}

interface StripeCheckoutProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function StripeCheckout({ onSuccess, onError }: StripeCheckoutProps) {
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkConfiguration = () => {
      setConfigured(isStripeConfigured());
    };

    const fetchPrices = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stripe/prices');
        
        if (!response.ok) {
          throw new Error('Failed to fetch pricing');
        }

        const data = await response.json();
        setPrices(data.prices || []);
      } catch (error: any) {
        console.error('Error fetching prices:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing information",
          variant: "destructive",
        });
        onError?.(error.message);
      } finally {
        setLoading(false);
      }
    };

    checkConfiguration();
    if (isStripeConfigured()) {
      fetchPrices();
    } else {
      setLoading(false);
    }
  }, [toast, onError]);

  const handleCheckout = async (priceId: string) => {
    try {
      setCheckoutLoading(priceId);

      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
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

  const formatPrice = (price: StripePrice) => {
    if (price.amount === null) return 'Contact us';
    
    const amount = (price.amount / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: price.currency.toUpperCase(),
    });

    if (price.type === 'recurring' && price.interval) {
      const interval = price.intervalCount && price.intervalCount > 1 
        ? `${price.intervalCount} ${price.interval}s`
        : price.interval;
      return `${amount}/${interval}`;
    }

    return amount;
  };

  if (!configured) {
    return (
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Payment Integration</CardTitle>
          <CardDescription className="text-gray-400">
            Payment system is not configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <p className="text-gray-400">
              Stripe payment integration is not yet configured. Please contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Loading Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (prices.length === 0) {
    return (
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">No Pricing Available</CardTitle>
          <CardDescription className="text-gray-400">
            No pricing plans are currently configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400">
              Please contact support for pricing information.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/70 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-100">Available Plans</CardTitle>
        <CardDescription className="text-gray-400">
          Choose a plan that works for you
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {prices.map((price) => (
            <div
              key={price.id}
              className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-100">
                    {price.nickname || 'Professional Plan'}
                  </h4>
                  <p className="text-2xl font-bold text-blue-400">
                    {formatPrice(price)}
                  </p>
                  {price.type === 'recurring' && (
                    <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/30">
                      Subscription
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={() => handleCheckout(price.id)}
                disabled={checkoutLoading !== null}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {checkoutLoading === price.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
