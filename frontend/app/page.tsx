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
    <>
      <Hero />
      <FeatureList />
      <Footer />
    </>
  )
}

export default function HomePage() {
  const { user, loading } = useRoleBasedAuth()

  // Always show loading for authenticated users on root page while they get redirected
  if (user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  // Only show landing page for unauthenticated users
  return <LandingContent />
}
