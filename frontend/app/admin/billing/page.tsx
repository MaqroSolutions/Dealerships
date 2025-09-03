"use client"

import { Suspense } from "react"
import { StripeCheckout } from "@/components/stripe-checkout"

import "@/styles/modern-billing.css"

function BillingContent() {
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



      {/* Pricing Section */}
      <div className="px-6 sm:px-8 lg:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
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
