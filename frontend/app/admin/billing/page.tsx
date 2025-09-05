"use client"

import { Suspense, useEffect, useState } from "react"
import { StripeCheckout } from "@/components/stripe-checkout"
import { getAuthenticatedApi } from "@/lib/api-client"

import "@/styles/modern-billing.css"

function BillingContent() {
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [canceling, setCanceling] = useState<"soft" | "hard" | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const api = await getAuthenticatedApi()
        const sub = await api.get<{ subscription: any }>("/billing/subscription/current")
        const available = await api.get<{ plans: any[] }>("/billing/plans")
        setCurrent(sub.subscription)
        setPlans(available.plans)
      } catch (e) {
        console.error("Failed to load billing data", e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])
  const refresh = async () => {
    try {
      const api = await getAuthenticatedApi()
      const sub = await api.get<{ subscription: any }>("/billing/subscription/current")
      setCurrent(sub.subscription)
    } catch (e) {
      console.error("Failed to refresh subscription", e)
    }
  }

  const cancelAtPeriodEnd = async () => {
    try {
      setCanceling("soft")
      const api = await getAuthenticatedApi()
      await api.post("/billing/subscription/cancel?immediate=false", {})
      await refresh()
    } catch (e) {
      console.error("Cancel (period end) failed", e)
    } finally {
      setCanceling(null)
    }
  }

  const cancelImmediately = async () => {
    try {
      setCanceling("hard")
      const api = await getAuthenticatedApi()
      await api.post("/billing/subscription/cancel?immediate=true", {})
      await refresh()
    } catch (e) {
      console.error("Immediate cancel failed", e)
    } finally {
      setCanceling(null)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl"></div>
        <div className="relative px-6 py-8 sm:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-4 animate-gradient">
              Scale Your
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-float">
                Dealership
              </span>
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Choose the perfect plan for your dealership needs. Volume discounts available for larger teams.
            </p>
          </div>
        </div>
      </div>



      {/* Current Plan */}
      <div className="px-6 sm:px-8 lg:px-12 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-gray-200">
            {loading ? (
              <div>Loading current plan…</div>
            ) : current ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-gray-400">Current plan</div>
                  <div className="text-xl font-semibold">{current.plan?.name} · ${(current.plan?.monthly_price_cents/100).toFixed(2)}/mo</div>
                  <div className="text-xs text-gray-400">Status: {current.status}</div>
                </div>
                <div className="flex items-center gap-3">
                  <a href="#plans" className="text-blue-400 hover:underline">Change plan</a>
                  <div className="h-4 w-px bg-gray-700 hidden sm:block" />
                  <button
                    onClick={cancelAtPeriodEnd}
                    disabled={canceling !== null}
                    className="px-3 py-1.5 rounded-md border border-yellow-600/40 text-yellow-300 hover:bg-yellow-600/10 disabled:opacity-50"
                    title="Cancel at period end"
                  >
                    {canceling === "soft" ? "Cancelling…" : "Cancel at period end"}
                  </button>
                  <button
                    onClick={cancelImmediately}
                    disabled={canceling !== null}
                    className="px-3 py-1.5 rounded-md border border-red-600/40 text-red-300 hover:bg-red-600/10 disabled:opacity-50"
                    title="Cancel immediately"
                  >
                    {canceling === "hard" ? "Cancelling…" : "Cancel now"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Current plan</div>
                  <div className="text-xl font-semibold">No active subscription</div>
                </div>
                <a href="#plans" className="text-blue-400 hover:underline">Choose a plan</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          <div id="plans" className="mb-6 text-gray-300">Select a plan to upgrade or downgrade.</div>
          <StripeCheckout
            onSuccess={() => {
              console.log('Payment successful!');
              // You can add additional success handling here
            }}
            onError={(error) => {
              console.error('Payment error:', error);
              // You can add additional error handling here
            }}
          />
        </div>
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
