"use client"

import { Suspense, useEffect, useState } from "react"
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
import { inventoryApi } from "@/lib/inventory-api"
import { getLeadStats } from "@/lib/leads-api"
import { getDealershipProfile } from "@/lib/user-profile-api"

function AdminDashboardContent() {
  const { role, full_name, loading } = useUserRole()
  const [leadTotal, setLeadTotal] = useState<number | null>(null)
  const [activeInventory, setActiveInventory] = useState<number | null>(null)
  const [activeSalespeople, setActiveSalespeople] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  useEffect(() => {
    let timer: number | undefined
    async function fetchStats() {
      try {
        setRefreshing(true)
        const [leadStats, inventoryCount, team] = await Promise.all([
          getLeadStats().catch(() => ({ total: 0, by_status: {} } as any)),
          inventoryApi.getInventoryCount().catch(() => 0),
          getDealershipProfile().catch(() => [] as any[]),
        ])
        setLeadTotal(typeof leadStats?.total === 'number' ? leadStats.total : 0)
        setActiveInventory(typeof inventoryCount === 'number' ? inventoryCount : 0)
        const salespeopleCount = Array.isArray(team)
          ? team.filter((u: any) => (u?.role || '').toLowerCase() === 'salesperson').length
          : 0
        setActiveSalespeople(salespeopleCount)
      } finally {
        setRefreshing(false)
      }
    }

    if (!loading) {
      fetchStats()
      // Light polling for live update
      timer = window.setInterval(fetchStats, 30000)
    }
    return () => {
      if (timer) window.clearInterval(timer)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-black">Admin Home</h1>
          <p className="text-gray-700 mt-2">
            Welcome back, {full_name}. You're managing your dealership as a {role}.
          </p>
        </div>
        <Badge variant="outline" className="text-gray-700 border-amber-200 bg-white">
          {role === 'owner' ? 'Dealership Owner' : 'Manager'}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Total Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{leadTotal ?? '—'}</div>
            <p className="text-xs text-gray-600">{refreshing ? 'Updating…' : 'Live'}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Active Salespeople</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{activeSalespeople ?? '—'}</div>
            <p className="text-xs text-gray-600">Salespeople in team</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Inventory</CardTitle>
            <Car className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">{activeInventory ?? '—'}</div>
            <p className="text-xs text-gray-600">Active vehicles</p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-black">$2.4M</div>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-black">Quick Actions</CardTitle>
            <CardDescription className="text-gray-700">
              Manage your dealership operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl">
                <Link href="/admin/team">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Team
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                <Link href="/admin/inventory">
                  <Car className="w-4 h-4 mr-2" />
                  View Inventory
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                <Link href="/admin/billing">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Billing
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
          <CardHeader>
            <CardTitle className="text-black">Recent Activity</CardTitle>
            <CardDescription className="text-gray-700">
              Latest updates from your dealership
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">New lead received from website</p>
                  <p className="text-xs text-gray-600">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">Sarah Johnson joined your team</p>
                  <p className="text-xs text-gray-600">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">New vehicle added to inventory</p>
                  <p className="text-xs text-gray-600">3 hours ago</p>
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
