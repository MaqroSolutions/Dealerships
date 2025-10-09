"use client"
import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { WelcomeSection } from "@/components/welcome-section"
import { PerformanceOverview } from "@/components/performance-overview"
import { LeadsSection } from "@/components/leads-section"
import { AlertsSection } from "@/components/alerts-section"
import { Hero } from "@/components/hero"
import { FeatureList } from "@/components/feature-list"
import { Footer } from "@/components/footer"
import { LandingNav } from "@/components/landing-nav"
import { PricingSection } from "@/components/pricing-section"
import { useRoleBasedAuth } from "@/components/auth/role-based-auth-provider"

function DashboardContent() {
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get("search") || ""

  return (
    <div className="space-y-8">
      <WelcomeSection />
      <PerformanceOverview />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LeadsSection searchTerm={searchTerm} />
        </div>
        <div>
          <AlertsSection searchTerm={searchTerm} />
        </div>
      </div>
    </div>
  )
}

function LandingContent() {
  return (
    <LandingNav>
      <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <Hero />
        <FeatureList />
        <PricingSection />
      </div>
      <Footer />
    </LandingNav>
  )
}

export default function HomePage() {
  const { user, loading } = useRoleBasedAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    // If still loading after 3 seconds, show timeout message
    const timer = setTimeout(() => {
      if (user && !loading) {
        setShowTimeout(true)
      }
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [user, loading])

  // Show loading for authenticated users while they get redirected
  if (user || loading) {
    if (showTimeout) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center space-y-4">
            <div className="text-gray-400">Redirect taking longer than expected.</div>
            <div className="space-x-4">
              <Link 
                href="/admin/dashboard" 
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Go to Admin Dashboard
              </Link>
              <Link 
                href="/leads" 
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Go to Leads
              </Link>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="text-gray-700">Loading...</div>
      </div>
    )
  }

  // Only show landing page for unauthenticated users
  return <LandingContent />
}
