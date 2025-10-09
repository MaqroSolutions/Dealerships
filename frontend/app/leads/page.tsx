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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

function LeadsContent() {
  const router = useRouter()
  const { full_name, loading: userLoading } = useUserRole()
  const { toast } = useToast()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [aiInsightsOpen, setAiInsightsOpen] = useState(false)

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
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
        <div className="text-gray-600 text-lg font-medium">Loading your leads...</div>
      </div>
    )
  }

  if (error && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-6 bg-gradient-to-br from-orange-50 to-amber-50 min-h-screen">
        <div className="text-red-500 text-lg font-medium">{error}</div>
        <Button onClick={handleRefresh} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl bg-white/90 backdrop-blur-sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200 shadow-sm'
      case 'warm':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200 shadow-sm'
      case 'new':
        return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 shadow-sm'
      case 'follow-up':
        return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 shadow-sm'
      case 'cold':
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 shadow-sm'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 shadow-sm'
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
    <div className="space-y-8 bg-white min-h-screen p-6 rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-black mb-1">My Leads</h1>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Welcome back, {full_name}. Let's help your customers find their perfect car today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-md hover:shadow-lg transition-all duration-200 rounded-xl bg-white/90 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
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
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">New Leads Today</CardTitle>
            <MessageSquare className="h-5 w-5 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-black leading-none">{leads.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Test Drives Today</CardTitle>
            <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-orange-400 rounded-full shadow-sm"></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-black leading-none">
              {leads.filter(lead => lead.status === 'hot').length}
            </div>
            
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 transition-all duration-200 rounded-2xl shadow-md hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Overdue Follow-ups</CardTitle>
            <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full shadow-sm"></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-black leading-none">
              {leads.filter(lead => lead.status === 'warm').length}
            </div>
            
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 transition-all duration-200 rounded-2xl cursor-pointer shadow-md hover:shadow-lg"
          onClick={() => setAiInsightsOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Highlights</CardTitle>
            <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-sm"></div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-extrabold text-black leading-none">
              {leads.filter(lead => lead.status === 'new').length}
            </div>
            
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search leads by name, email, or car interest..."
                className="pl-12 bg-white/90 border-gray-300 text-black placeholder-gray-500 focus:border-gray-400 focus:ring-gray-200 h-12 text-lg rounded-xl"
              />
            </div>
            <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 h-12 px-6 transition-all duration-200 rounded-xl bg-white/90 backdrop-blur-sm shadow-none">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leads List */}
      <div className="space-y-6">
        {leads.map((lead) => (
          <Card key={lead.id} className="bg-white/90 backdrop-blur-sm border-amber-200 transition-all duration-200 hover:border-amber-300 rounded-2xl shadow-md hover:shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <h3 className="text-xl font-semibold text-black">{lead.name}</h3>
                    <Badge className={`${getStatusBadgeColor(lead.status)} text-sm font-medium px-3 py-1 rounded-full`}>
                      {lead.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800 font-medium">{lead.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800 font-medium">{lead.phone}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800 font-medium">
                          Last contact: {formatDate(lead.last_contact_at)}
                        </span>
                      </div>
                      <div className="text-gray-800">
                        <span className="text-gray-600 font-medium">Interested in:</span> {lead.car_interest}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl">
                    <p className="text-gray-800 leading-relaxed">{lead.message}</p>
                  </div>
                </div>
                
                <div className="ml-6">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 px-6 py-3 rounded-xl shadow-none"
                    onClick={() => router.push(`/conversations/${lead.id}`)}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {leads.length === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
            <CardContent className="p-16 text-center">
              <MessageSquare className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-black mb-3">No leads assigned yet</h3>
              <p className="text-gray-700 text-lg mb-8 max-w-md mx-auto leading-relaxed">
                You'll see your assigned leads here once they're assigned to you by your manager. 
                Or you can start by adding your first lead manually.
              </p>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all duration-200 px-8 py-3 text-lg rounded-xl shadow-none"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Lead
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      {/* AI Insights Dialog */}
      <Dialog open={aiInsightsOpen} onOpenChange={setAiInsightsOpen}>
        <DialogContent className="sm:max-w-xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-black">Highlights</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80 pr-2">
            <div className="space-y-4">
              {/* Entry 1 */}
              <div className="p-4 border border-amber-200 rounded-xl bg-white">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">Update</Badge>
                </div>
                <p className="mt-2 text-sm text-gray-800">
                  John Doe just replied about the <span className="font-medium">2021 Camry</span> — we recommended a test drive for tomorrow.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Customer</div>
                    <div className="font-medium text-gray-800">John Doe</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Interest</div>
                    <div className="font-medium text-gray-800">2021 Camry</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Next action</div>
                    <div className="font-medium text-gray-800">Follow up</div>
                  </div>
                </div>
              </div>

              {/* Entry 2 */}
              <div className="p-4 border border-amber-200 rounded-xl bg-white">
                <div className="flex items-center justify-between">
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">Insight</Badge>
                </div>
                <p className="mt-2 text-sm text-gray-800">
                  The Accord lead has been idle for 2 days. Might be a good time to follow up.
                </p>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Customer</div>
                    <div className="font-medium text-gray-800">Jane Smith</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Interest</div>
                    <div className="font-medium text-gray-800">2020 Accord</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 border border-gray-200">
                    <div className="text-gray-500">Next action</div>
                    <div className="font-medium text-gray-800">Follow up</div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
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
