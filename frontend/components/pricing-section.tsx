"use client"

import Link from "next/link"
import { Check } from "lucide-react"

const tiers = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    cta: { label: "Get started", href: "/signup" },
    highlight: false,
    features: [
      "Up to 100 conversations/month",
      "Email support",
      "Basic analytics"
    ]
  },
  {
    name: "Growth",
    price: "$199",
    cadence: "/mo",
    cta: { label: "Start 14-day trial", href: "/signup" },
    highlight: true,
    features: [
      "Unlimited leads",
      "AI auto-replies",
      "Team inbox",
      "CRM sync"
    ]
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    cta: { label: "Contact sales", href: "/signup" },
    highlight: false,
    features: [
      "SSO & SCIM",
      "Custom SLAs",
      "Dedicated support"
    ]
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Pricing</h2>
          <p className="mt-3 text-lg sm:text-xl text-gray-300/90">Simple plans that scale with your dealership.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`group relative rounded-2xl p-6 sm:p-8 border transition-all flex flex-col ${
                tier.highlight
                  ? "bg-white/[0.05] border-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
                  : "bg-white/[0.03] border-white/10"
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 right-6 text-xs px-2 py-1 rounded-full bg-purple-600 text-white/90">Most popular</div>
              )}
              <h3 className="text-xl font-semibold text-white">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-white">{tier.price}</span>
                {tier.cadence && <span className="text-gray-400">{tier.cadence}</span>}
              </div>
              <ul className="mt-6 space-y-3">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300/90">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 sm:mt-8" />
              <Link
                href={tier.cta.href}
                className={`mt-auto inline-flex w-full items-center justify-center rounded-full px-6 py-3 font-semibold transition-all ${
                  tier.highlight
                    ? "bg-white text-gray-900 hover:opacity-90"
                    : "border border-white/15 text-white/90 hover:bg-white/5"
                }`}
              >
                {tier.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection


