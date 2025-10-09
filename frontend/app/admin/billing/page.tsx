"use client"

import { Suspense, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { getAuthenticatedApi } from "@/lib/api-client"
import { isStripeConfigured } from "@/lib/stripe"
import { useToast } from "@/hooks/use-toast"
import { 
  Clock, 
  ArrowRight, 
  Check, 
  Users, 
  Zap, 
  Shield, 
  Star,
  Loader2,
  CreditCard,
  Settings,
  Globe,
  Code,
  Search,
  BarChart3,
  Lock,
  MessageSquare,
  Bot,
  Server,
  Eye,
  CheckCircle,
  Crown,
  Headphones
} from "lucide-react"

import "@/styles/modern-billing.css"

interface Plan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice?: number
  features: string[]
  isPopular?: boolean
  isCurrent?: boolean
  productId?: string
  maxSalespeople?: number
}

function BillingContent() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [isYearly, setIsYearly] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const { toast } = useToast()

  // Define our plans based on the landing page pricing
  const planData: Plan[] = [
    {
      id: "pilot",
      name: "Pilot",
      description: "Add Maqro as an extra salesperson for your team",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "Instant AI responses to fresh inquiries",
        "Human-like drafts for nuanced questions",
        "Launch in 1 day"
      ],
      productId: "prod_pilot"
    },
    {
      id: "pro",
      name: "Pro",
      description: "Everything in Pilot",
      monthlyPrice: 800,
      yearlyPrice: 8000, // 2 months free
      features: [
        "After-hours autopilot",
        "Inventory-aware responses",
        "Unlimited leads & users",
        "Response time & engagement analytics",
        "Priority support"
      ],
      isPopular: true,
      isCurrent: false,
      productId: "prod_Sz5IHIEbqcYsXs"
    },
    {
      id: "scale",
      name: "Scale",
      description: "For dealer groups that need advanced integrations and scale",
      monthlyPrice: 0, // Custom pricing
      features: [
        "Multi-store rollout",
        "Native CRM integrations (VinSolutions, Elead, DealerSocket, etc.)",
        "Advanced analytics (conversion, appointments)",
        "SSO & role-based access",
        "Dedicated account manager"
      ],
      productId: "prod_scale"
    }
  ]

  useEffect(() => {
    (async () => {
      try {
        const api = await getAuthenticatedApi()
        const sub = await api.get<{ subscription: any }>("/billing/subscription/current")
        const available = await api.get<{ plans: any[] }>("/billing/plans")
        setCurrent(sub.subscription)
        setPlans(available.plans)
        
        // Mark current plan
        if (sub.subscription) {
          planData.forEach(plan => {
            if (plan.name.toLowerCase() === sub.subscription.plan?.name?.toLowerCase()) {
              plan.isCurrent = true
            }
          })
        }
      } catch (e) {
        console.error("Failed to load billing data", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleCheckout = async (plan: Plan) => {
    if (!isStripeConfigured()) {
      toast({
        title: "Configuration Error",
        description: "Stripe is not properly configured",
        variant: "destructive",
      })
      return
    }

    if (plan.id === "scale") {
      // Open Cal.com in a new tab (same link used on the landing page)
      window.open('https://cal.com/aryan-mundre', '_blank', 'noopener,noreferrer')
      return
    }

    if (plan.id === "pilot") {
      // Handle free plan
      toast({
        title: "Free Pilot",
        description: "You're already on the free pilot!",
      })
      return
    }

    try {
      setCheckoutLoading(plan.id)

      const isCatalogId = typeof plan.productId === 'string' && (plan.productId.startsWith('prod_') || plan.productId.startsWith('price_'))
      const body: any = {
        priceId: plan.productId,
        quantity: 1,
        dealershipId: 'd660c7d6-99e2-4fa8-b99b-d221def53d20', // TODO: Get from user context
        successUrl: window.location.origin + '/admin/billing?success=true',
        cancelUrl: window.location.origin + '/admin/billing?canceled=true',
      }
      if (!isCatalogId) {
        body.customPricing = {
          pricePerUnit: isYearly ? (plan.yearlyPrice || plan.monthlyPrice) : plan.monthlyPrice,
          setupFee: 0,
          tier: plan.name
        }
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId, sessionUrl } = await response.json()

      // Open Checkout in a new tab using the session URL
      if (!sessionUrl) throw new Error('Checkout URL not returned by server')
      window.open(sessionUrl, '_blank', 'noopener,noreferrer')

    } catch (error: any) {
      console.error('Checkout error:', error)
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process",
        variant: "destructive",
      })
    } finally {
      setCheckoutLoading(null)
    }
  }

  const getTrialEndDate = () => {
    if (current?.current_period_end) {
      return new Date(current.current_period_end).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
    return "September 24, 2025" // Fallback
  }

  const isPilot = () => (current?.plan?.name || '').toLowerCase() === 'pilot' || !current
  const isPro = () => (current?.plan?.name || '').toLowerCase() === 'pro'
  const getSummaryLine = () => {
    if (isPilot()) {
      return `Pilot — Free for 14 days (Active, ends ${getTrialEndDate()})`
    }
    if (isPro()) {
      const price = ((current?.plan?.monthly_price_cents || 80000) / 100).toFixed(0)
      return `Pro — $${price} / dealership / month (Active, renews ${getTrialEndDate()})`
    }
    return `Current — renews ${getTrialEndDate()}`
  }

  return (
    <div className="space-y-8 ml-4 bg-white">

        {/* Plan Summary Card */}
        <div className="mb-8">
          <div className="flex items-start mb-4">
            <div className="w-[40%]">
              <h2 className="text-xl font-semibold text-black mb-1">Billing plan</h2>
              <p className="text-gray-700">View and manage your billing plan.</p>
            </div>
            
            <div className="bg-white/90 border border-amber-200 rounded-2xl p-4 shadow-md flex-shrink-0 ml-[0%] min-w-[600px] h-[60px] flex items-center justify-between">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-gray-400">Loading current plan...</span>
                </div>
              ) : current ? (
                <>
                  <div className="flex items-center space-x-6">
                    <div className="text-lg font-semibold text-black">
                      {getSummaryLine()}
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700 font-medium">On trial until {getTrialEndDate()}</span>
                    </div>
                  </div>
                  {isPro() ? (
                    <Button 
                      onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-gray-700 hover:bg-gray-600 text-white rounded-full px-4 py-2"
                    >
                      Manage plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleCheckout({ id: 'pro', name: 'Pro', description: '', monthlyPrice: 800, features: [], productId: 'prod_Sz5IHIEbqcYsXs' } as any)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
                    >
                      Upgrade to Pro
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="text-lg text-gray-600">
                    <span className="font-semibold text-black">Current plan:</span> No active subscription
                  </div>
                  <Button 
                    onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2"
                  >
                    Choose a plan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Plans Section */}
        <div id="plans" className="mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              Simple pricing that scales
            </div>
            <h2 className="text-3xl font-bold text-black mb-2">Plans</h2>
            <p className="text-gray-700">Simple plans that scale with your dealership.</p>
          </div>
          
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700">Save with yearly billing</span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {planData.map((plan, idx) => (
              <div
                key={plan.id}
                className={`group relative rounded-2xl p-6 sm:p-8 border transition-all flex flex-col ${
                  plan.isPopular
                    ? "bg-white/90 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg"
                    : "bg-white/90 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg"
                }`}
              >
                {plan.isCurrent && (
                  <div className="absolute -top-3 right-6 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white/90 font-medium tracking-wide uppercase">
                    Current on Trial
                  </div>
                )}
                {plan.isPopular && !plan.isCurrent && (
                  <div className="absolute -top-3 right-6 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium tracking-wide uppercase">
                    Most Value
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-black tracking-tight font-['Geist']">{plan.name}</h3>
                
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-bold text-black tracking-tight font-['Geist']">
                    {plan.id === 'scale'
                      ? 'Contact us'
                      : (plan.monthlyPrice === 0
                          ? 'Free'
                          : `$${isYearly ? (plan.yearlyPrice || plan.monthlyPrice) : plan.monthlyPrice}`)}
                  </span>
                  {plan.monthlyPrice === 0 ? (
                    plan.id === 'pilot' ? (
                      <span className="text-gray-600 text-sm font-medium font-['Geist']">for 14 days</span>
                    ) : null
                  ) : (
                    <span className="text-gray-600 text-sm font-medium font-['Geist']">
                      {isYearly && plan.yearlyPrice ? (
                        <>
                          /year
                          <div className="text-xs text-gray-500 mt-1">
                            ${((plan.yearlyPrice || plan.monthlyPrice) / 12).toFixed(2)}/dealership/month
                          </div>
                        </>
                      ) : (
                        "/dealership/month"
                      )}
                    </span>
                  )}
                </div>
                
                <p className="mt-3 text-gray-700 text-base font-['Geist'] font-medium leading-relaxed">
                  {plan.description}
                </p>
                
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700 text-sm font-['Geist'] leading-relaxed">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 sm:mt-8" />
                {plan.id !== 'pilot' && (
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={checkoutLoading === plan.id || (plan.id === 'pro' && isPro())}
                    className={`mt-auto inline-flex w-full items-center justify-center rounded-xl px-6 py-3 font-bold text-base transition-all font-['Geist'] ${
                      plan.id === 'pro' && isPro()
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300"
                        : plan.isPopular
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                          : "border border-amber-200 text-gray-700 hover:bg-amber-50 hover:border-amber-300 hover:text-gray-800 transition-all duration-200"
                    }`}
                  >
                    {checkoutLoading === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : plan.id === "scale" ? (
                      "Book a Demo"
                    ) : plan.id === 'pro' && isPro() ? (
                      "Current Plan"
                    ) : (
                      "Upgrade to Pro"
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Section — removed per request */}

        {/* Invoices Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-2">Invoices</h3>
          <div className="bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl shadow-md p-6">
            {isPilot() ? (
              <p className="text-gray-600">No invoices yet.</p>
            ) : (
              <p className="text-gray-600">Invoices will appear here after your first payment.</p>
            )}
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="text-xs text-gray-500">
          Maqro does not store payment details. All billing is encrypted and PCI compliant.
        </div>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <BillingContent />
    </Suspense>
  )
}
