"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Clock, 
  Users, 
  MessageSquare,
  Phone,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react"

function AnalyticsContent() {
  // Mock analytics data
  const metrics = {
    responseTime: {
      average: '2.3 hours',
      improvement: '+15%',
      trend: 'up'
    },
    conversionRate: {
      current: '23.4%',
      improvement: '+8%',
      trend: 'up'
    },
    followUpRate: {
      current: '87%',
      improvement: '+12%',
      trend: 'up'
    },
    totalLeads: {
      current: '1,234',
      improvement: '+22%',
      trend: 'up'
    }
  }

  const salesFunnel = [
    { stage: 'New Leads', count: 156, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Contacted', count: 134, percentage: 86, color: 'bg-yellow-500' },
    { stage: 'Qualified', count: 89, percentage: 57, color: 'bg-orange-500' },
    { stage: 'Proposal', count: 45, percentage: 29, color: 'bg-purple-500' },
    { stage: 'Closed', count: 23, percentage: 15, color: 'bg-green-500' }
  ]

  const teamPerformance = [
    { name: 'John Doe', leads: 45, conversion: '28%', responseTime: '1.2h' },
    { name: 'Sarah Johnson', leads: 38, conversion: '32%', responseTime: '1.8h' },
    { name: 'Mike Wilson', leads: 52, conversion: '25%', responseTime: '2.1h' },
    { name: 'Lisa Brown', leads: 41, conversion: '30%', responseTime: '1.5h' }
  ]

  const recentActivity = [
    { type: 'lead', message: 'New lead received from website', time: '2 min ago', value: '+1' },
    { type: 'call', message: 'Follow-up call completed', time: '15 min ago', value: '5 min' },
    { type: 'meeting', message: 'Test drive scheduled', time: '1 hour ago', value: 'Tomorrow' },
    { type: 'sale', message: 'Vehicle sold - 2023 Toyota Camry', time: '3 hours ago', value: '$28,500' }
  ]

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? 
      <TrendingUp className="w-4 h-4 text-green-400" /> : 
      <TrendingUp className="w-4 h-4 text-red-400 rotate-180" />
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <MessageSquare className="w-4 h-4 text-blue-400" />
      case 'call':
        return <Phone className="w-4 h-4 text-green-400" />
      case 'meeting':
        return <Calendar className="w-4 h-4 text-purple-400" />
      case 'sale':
        return <TrendingUp className="w-4 h-4 text-yellow-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2">
            Track your dealership performance and team metrics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-700 text-gray-300">
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{metrics.responseTime.average}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(metrics.responseTime.trend)}
              <p className="text-xs text-green-400">{metrics.responseTime.improvement}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{metrics.conversionRate.current}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(metrics.conversionRate.trend)}
              <p className="text-xs text-green-400">{metrics.conversionRate.improvement}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Follow-up Rate</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{metrics.followUpRate.current}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(metrics.followUpRate.trend)}
              <p className="text-xs text-green-400">{metrics.followUpRate.improvement}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{metrics.totalLeads.current}</div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(metrics.totalLeads.trend)}
              <p className="text-xs text-green-400">{metrics.totalLeads.improvement}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Funnel */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Sales Funnel</CardTitle>
          <CardDescription className="text-gray-400">
            Track lead progression through your sales process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesFunnel.map((stage, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm text-gray-300">{stage.stage}</div>
                <div className="flex-1 bg-gray-800 rounded-full h-4">
                  <div 
                    className={`${stage.color} h-4 rounded-full transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
                <div className="w-16 text-sm text-gray-300 text-right">{stage.count}</div>
                <div className="w-16 text-sm text-gray-400 text-right">{stage.percentage}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Performance */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Team Performance</CardTitle>
          <CardDescription className="text-gray-400">
            Individual performance metrics for your sales team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamPerformance.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.leads} leads</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-200">{member.conversion}</p>
                    <p className="text-xs text-gray-400">Conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-200">{member.responseTime}</p>
                    <p className="text-xs text-gray-400">Avg Response</p>
                  </div>
                  <Badge variant="outline" className="border-gray-700 text-gray-300">
                    {member.leads > 40 ? 'Top Performer' : 'Good'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Recent Activity</CardTitle>
          <CardDescription className="text-gray-400">
            Latest updates from your dealership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{activity.message}</p>
                  <p className="text-xs text-gray-400">{activity.time}</p>
                </div>
                <Badge variant="outline" className="border-gray-700 text-gray-300">
                  {activity.value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <AnalyticsContent />
    </Suspense>
  )
}
