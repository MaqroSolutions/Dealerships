"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Search,
  Filter,
  Plus,
  RefreshCw
} from "lucide-react"
import { useUserRole } from "@/hooks/use-user-role"
import { getMyLeads } from "@/lib/leads-api"
import type { Lead } from "@/lib/supabase"
import { AddLeadDialog } from "@/components/add-lead-dialog"
import { useToast } from "@/hooks/use-toast"

function LeadsContent() {
  const router = useRouter()
  const { full_name, loading: userLoading } = useUserRole()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLeads = async () => {
    try {
      setError(null)
      const data = await getMyLeads()
      setLeads(data)
    } catch (err) {
      console.error("Error fetching leads:", err)
      setError(err instanceof Error ? err.message : "Failed to load leads")
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeads()
  }

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading leads...</div>
      </div>
    )
  }

  if (error && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-400">{error}</div>
        <Button onClick={handleRefresh} variant="outline" className="border-gray-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warm':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'new':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'follow-up':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'cold':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">My Leads</h1>
          <p className="text-gray-400 mt-2">
            Welcome back, {full_name}. Manage your assigned leads and follow up with prospects.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-700 text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchLeads}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{leads.length}</div>
            <p className="text-xs text-gray-400">Assigned to you</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Hot Leads</CardTitle>
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {leads.filter(lead => lead.status === 'hot').length}
            </div>
            <p className="text-xs text-red-400">High priority</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Warm Leads</CardTitle>
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {leads.filter(lead => lead.status === 'warm').length}
            </div>
            <p className="text-xs text-yellow-400">Follow up needed</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">New Leads</CardTitle>
            <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {leads.filter(lead => lead.status === 'new').length}
            </div>
            <p className="text-xs text-blue-400">Need initial contact</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search leads by name, email, or car interest..."
                className="pl-10 bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-4">
        {leads.map((lead) => (
          <Card key={lead.id} className="bg-gray-900/70 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-100">{lead.name}</h3>
                    <Badge className={getStatusBadgeColor(lead.status)}>
                      {lead.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{lead.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{lead.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">
                          Last contact: {formatDate(lead.last_contact_at)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Interested in:</span> {lead.car_interest}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-300">{lead.message}</p>
                  </div>
                </div>
                
                <div className="ml-4">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(`/conversations/${lead.id}`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {leads.length === 0 && (
          <Card className="bg-gray-900/70 border-gray-800">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">No leads assigned yet</h3>
              <p className="text-gray-400 mb-4">
                You'll see your assigned leads here once they're assigned to you by your manager.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Lead
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <LeadsContent />
    </Suspense>
  )
}
