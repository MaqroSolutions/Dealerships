"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Car, 
  MessageSquare, 
  Clock, 
  Upload, 
  UserPlus, 
  Eye,
  TrendingUp,
  DollarSign,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"
import { DemoAdminSidebar } from "./demo-admin-sidebar"

interface AdminMetrics {
  inventoryCount: number
  leadsToday: number
  leads7d: number
  avgResponseTime: string
  followUpsDue: number
  totalDeals: number
}

export default function DemoAdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    inventoryCount: 47,
    leadsToday: 24,
    leads7d: 156,
    avgResponseTime: "2.4h",
    followUpsDue: 12,
    totalDeals: 8
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-950">
        <DemoAdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-8">
            <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Landing
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Dealership Admin Dashboard</h1>
              <p className="text-gray-400 mt-2">Demo Mode - No Authentication Required</p>
            </div>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            Admin Access
          </Badge>
        </div>

        {/* Demo Notice */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-blue-300 text-sm mt-2">
              This is a preview of the admin dashboard. In production, this would require authentication and admin role.
            </p>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Inventory</CardTitle>
              <Car className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.inventoryCount}</div>
              <p className="text-xs text-gray-400">Active vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Leads Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.leadsToday}</div>
              <p className="text-xs text-gray-400">+{metrics.leads7d} this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Response</CardTitle>
              <Clock className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.avgResponseTime}</div>
              <p className="text-xs text-gray-400">Team average</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Follow-ups Due</CardTitle>
              <MessageSquare className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metrics.followUpsDue}</div>
              <p className="text-xs text-gray-400">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Upload className="h-5 w-5 text-blue-400" />
                Upload Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Add new vehicles to your dealership inventory
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                Manage Inventory
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5 text-green-400" />
                Invite Salespeople
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Send invitations to new team members
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                Send Invites
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Eye className="h-5 w-5 text-purple-400" />
                View Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Monitor team conversations and leads
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                View Conversations
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Links */}
        <div className="flex justify-center gap-4">
          <Link href="/demo/salesperson">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              View Salesperson Dashboard
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
      </div>
    </SidebarProvider>
  )
} 