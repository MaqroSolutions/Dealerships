"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
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

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-700">Please wait while we check your authentication</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user is authenticated, the role-based auth provider will handle the redirect
  // This should not render for authenticated users as they get redirected
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
              <p className="text-gray-700">Taking you to your dashboard</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Only show landing page for unauthenticated users
  return <LandingContent />
}
