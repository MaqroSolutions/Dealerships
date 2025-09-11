"use client"

import Link from "next/link"
import { Check, Star, X } from "lucide-react"
import { PremiumSpinner } from "./ui/premium-spinner"
import { useState } from "react"

const tiers = [
  {
    name: "Pilot",
    price: "Free",
    cadence: "for 14 days",
    cta: { label: "Start Free Pilot", href: "/signup" },
    highlight: false,
    description: "Add Maqro as an extra salesperson for your team",
    features: [
      "Instant AI responses to fresh inquiries",
      "Human-like drafts for nuanced questions",
      "Launch in 1 day"
    ]
  },
  {
    name: "Pro",
    price: "$800",
    cadence: "/dealership/month",
    cta: { label: "Upgrade to Pro", href: "/signup" },
    highlight: true,
    description: "Everything in Pilot",
    features: [
      "After-hours autopilot",
      "Inventory-aware responses",
      "Unlimited leads & users",
      "Response time & engagement analytics",
      "Priority support"
    ]
  },
  {
    name: "Scale",
    price: "Contact us",
    cadence: "",
    cta: { label: "Book a Demo", href: "#", isDemo: true },
    highlight: false,
    description: "For dealer groups that need advanced integrations and scale",
    features: [
      "Multi-store rollout",
      "Native CRM integrations (VinSolutions, Elead, DealerSocket, etc.)",
      "Advanced analytics (conversion, appointments)",
      "SSO & role-based access",
      "Dedicated account manager"
    ]
  }
]

export function PricingSection() {
  const [showCalEmbed, setShowCalEmbed] = useState(false)
  const [isCalendarLoading, setIsCalendarLoading] = useState(true)

  const handleDemoClick = (e: React.MouseEvent, isDemo: boolean) => {
    if (isDemo) {
      e.preventDefault()
      setShowCalEmbed(true)
      setIsCalendarLoading(true)
    }
  }

  return (
    <section id="pricing" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[80%] rounded-full bg-purple-500/10 blur-3xl" />
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            Simple pricing that scales
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4 font-['Geist']">Pricing</h2>
          <p className="text-xl sm:text-2xl text-gray-300/90 max-w-2xl mx-auto font-['Geist'] font-light">Simple plans that scale with your dealership.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`group relative rounded-2xl p-6 sm:p-8 border transition-all flex flex-col ${
                tier.highlight
                  ? "bg-white/[0.05] border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)]"
                  : "bg-white/[0.03] border-white/10 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 right-6 text-xs px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white/90 font-medium tracking-wide uppercase">Most Value</div>
              )}
              <h3 className="text-2xl font-bold text-white tracking-tight font-['Geist']">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-['Geist']">{tier.price}</span>
                {tier.cadence && <span className="text-gray-400 text-sm font-medium font-['Geist']">{tier.cadence}</span>}
              </div>
              <p className="mt-3 text-gray-300/90 text-base font-['Geist'] font-medium leading-relaxed">{tier.description}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300/90 text-sm font-['Geist'] leading-relaxed">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 sm:mt-8" />
              <Link
                href={tier.cta.href}
                onClick={(e) => handleDemoClick(e, tier.cta.isDemo || false)}
                className={`mt-auto inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-bold text-base transition-all font-['Geist'] ${
                  tier.highlight
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                    : "border border-white/15 text-white/90 hover:bg-white/5 hover:border-white/25 hover:text-white transition-all duration-200"
                }`}
              >
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Cal.com Calendar Modal */}
      {showCalEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Simple Close Button - Top Right Corner */}
          <button
            onClick={() => setShowCalEmbed(false)}
            className="fixed top-6 right-6 z-60 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-5xl h-[600px] bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">

            {/* Loading State */}
            {isCalendarLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#171717] z-10">
                <div className="text-center">
                  <PremiumSpinner />
                  <p className="text-white text-sm font-medium tracking-wide font-['Geist']">Loading calendar...</p>
                </div>
              </div>
            )}

            {/* Calendar iframe */}
            <div className="h-full">
              <iframe
                src="https://cal.com/aryan-mundre?embed=true"
                width="100%"
                height="100%"
                frameBorder="0"
                className="bg-transparent"
                title="Book a demo with Maqro"
                onLoad={() => setIsCalendarLoading(false)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PricingSection


