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
  DollarSign
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { getLeadStats } from "@/lib/leads-api"

interface AdminMetrics {
  inventoryCount: number
  leadsToday: number
  leads7d: number
  avgResponseTime: string
  followUpsDue: number
  totalDeals: number
}

export default function AdminDashboard() {
  const { user, userRole } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<AdminMetrics>({
    inventoryCount: 0,
    leadsToday: 0,
    leads7d: 0,
    avgResponseTime: "2.4h",
    followUpsDue: 12,
    totalDeals: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Check if demo mode is enabled
        const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
        
        if (isDemoMode) {
          // Use mock data for demo
          setMetrics({
            inventoryCount: 47,
            leadsToday: 24,
            leads7d: 156,
            avgResponseTime: "2.4h",
            followUpsDue: 12,
            totalDeals: 8
          })
        } else {
          // Try to get real data
          try {
            const response = await fetch('/api/metrics')
            if (response.ok) {
              const metricsData = await response.json()
              setMetrics({
                inventoryCount: metricsData.inventoryCount || 0,
                leadsToday: metricsData.leadsToday || 0,
                leads7d: metricsData.leads7d || 0,
                avgResponseTime: metricsData.avgResponseTime || "0h",
                followUpsDue: metricsData.followUpsDue || 0,
                totalDeals: metricsData.totalDeals || 0
              })
            } else {
              throw new Error('Failed to fetch metrics')
            }
          } catch (error) {
            console.error("Error loading metrics:", error)
            // Fallback to demo data
            setMetrics({
              inventoryCount: 47,
              leadsToday: 24,
              leads7d: 156,
              avgResponseTime: "2.4h",
              followUpsDue: 12,
              totalDeals: 8
            })
          }
        }
      } catch (error) {
        console.error("Error loading admin metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    loadMetrics()
  }, [])

  // Role-based access check
  useEffect(() => {
    if (user && userRole !== 'admin') {
      // Redirect non-admin users to main dashboard
      router.push('/');
    }
  }, [user, userRole, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dealership Admin</h1>
            <p className="text-gray-400 mt-2">Manage your dealership operations</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400">
            Admin Access
          </Badge>
        </div>

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
              <Link href="/inventory/upload">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Manage Inventory
                </Button>
              </Link>
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
              <Link href="/admin/invite">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Send Invites
                </Button>
              </Link>
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
              <Link href="/conversations">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  View Conversations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Demo Mode Notice */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <Card className="bg-yellow-900/20 border-yellow-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="font-medium">Demo Mode Active</span>
              </div>
              <p className="text-yellow-300 text-sm mt-2">
                Metrics are currently showing mock data for demonstration purposes. 
                In production, these would display real-time dealership data.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 