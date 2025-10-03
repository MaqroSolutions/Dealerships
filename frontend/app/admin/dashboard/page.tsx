"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Car, 
  MessageSquare, 
  Settings, 
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useUserRole } from "@/hooks/use-user-role"

function AdminDashboardContent() {
  const { role, full_name, loading } = useUserRole()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Admin Home</h1>
          <p className="text-gray-400 mt-2">
            Welcome back, {full_name}. You're managing your dealership as a {role}.
          </p>
        </div>
        <Badge variant="outline" className="text-blue-400 border-blue-400">
          {role === 'owner' ? 'Dealership Owner' : 'Manager'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">1,234</div>
            <p className="text-xs text-green-400">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Salespeople</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">8</div>
            <p className="text-xs text-gray-400">Managing leads</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Inventory</CardTitle>
            <Car className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">156</div>
            <p className="text-xs text-gray-400">Vehicles available</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">$2.4M</div>
            <p className="text-xs text-green-400">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Quick Actions</CardTitle>
            <CardDescription className="text-gray-400">
              Manage your dealership operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/admin/team">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/inventory">
                  <Car className="w-4 h-4 mr-2" />
                  View Inventory
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/billing">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Billing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest updates from your dealership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">New lead received from website</p>
                  <p className="text-xs text-gray-400">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">Sarah Johnson joined your team</p>
                  <p className="text-xs text-gray-400">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">New vehicle added to inventory</p>
                  <p className="text-xs text-gray-400">3 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Management Preview removed per request */}
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  )
}
