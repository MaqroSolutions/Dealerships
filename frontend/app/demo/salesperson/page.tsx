"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WelcomeSection } from "@/components/welcome-section"
import { PerformanceOverview } from "@/components/performance-overview"
import { LeadsSection } from "@/components/leads-section"
import { AlertsSection } from "@/components/alerts-section"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DemoSalespersonSidebar } from "./demo-salesperson-sidebar"

export default function DemoSalespersonDashboard() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-950">
        <DemoSalespersonSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Landing
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-white">Salesperson Dashboard</h1>
                  <p className="text-gray-400 text-sm">Demo Mode - No Authentication Required</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Salesperson
              </Badge>
            </div>
          </div>

      {/* Demo Notice */}
      <div className="p-6">
        <Card className="bg-blue-900/20 border-blue-500/30 max-w-7xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-blue-300 text-sm mt-2">
              This is a preview of the salesperson dashboard. In production, this would require authentication and salesperson role.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content - Same as existing salesperson dashboard */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <WelcomeSection />
          <PerformanceOverview />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LeadsSection searchTerm="" />
            </div>
            <div>
              <AlertsSection searchTerm="" />
            </div>
          </div>
        </div>
      </div>

          {/* Navigation Links */}
          <div className="p-6 border-t border-gray-800">
            <div className="flex justify-center gap-4 max-w-7xl mx-auto">
              <Link href="/demo/admin">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  View Admin Dashboard
                </Button>
              </Link>
              <Link href="/role-select?action=signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Try Full Demo Flow
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
} 