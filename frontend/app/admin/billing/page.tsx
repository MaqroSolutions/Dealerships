"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Download, 
  Calendar,
  DollarSign,
  Users,
  Settings,
  CheckCircle,
  AlertCircle
} from "lucide-react"

function BillingContent() {
  // Mock billing data
  const currentPlan = {
    name: 'Professional Plan',
    price: '$299',
    period: 'month',
    features: [
      'Up to 10 team members',
      'Unlimited leads',
      'Advanced analytics',
      'CRM integration',
      'Priority support'
    ],
    nextBilling: '2024-02-20',
    status: 'active'
  }

  const billingHistory = [
    {
      id: '1',
      date: '2024-01-20',
      amount: '$299.00',
      status: 'paid',
      description: 'Professional Plan - January 2024'
    },
    {
      id: '2',
      date: '2023-12-20',
      amount: '$299.00',
      status: 'paid',
      description: 'Professional Plan - December 2023'
    },
    {
      id: '3',
      date: '2023-11-20',
      amount: '$299.00',
      status: 'paid',
      description: 'Professional Plan - November 2023'
    }
  ]

  const usageMetrics = {
    teamMembers: {
      current: 8,
      limit: 10,
      percentage: 80
    },
    leads: {
      current: 1234,
      limit: 'Unlimited',
      percentage: 0
    },
    storage: {
      current: '2.3 GB',
      limit: '10 GB',
      percentage: 23
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'paid':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'overdue':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Billing & Subscription</h1>
          <p className="text-gray-400 mt-2">
            Manage your subscription and view billing history
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-700 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Download Invoices
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Settings className="w-4 h-4 mr-2" />
            Manage Plan
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-100">Current Plan</CardTitle>
              <CardDescription className="text-gray-400">
                Your active subscription details
              </CardDescription>
            </div>
            <Badge className={getStatusBadgeColor(currentPlan.status)}>
              {currentPlan.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">{currentPlan.name}</h3>
                  <p className="text-2xl font-bold text-blue-400">
                    {currentPlan.price}<span className="text-sm text-gray-400">/{currentPlan.period}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Next billing: {new Date(currentPlan.nextBilling).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-100">Usage This Month</h4>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Team Members</span>
                    <span className="text-gray-400">
                      {usageMetrics.teamMembers.current}/{usageMetrics.teamMembers.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`${getUsageBarColor(usageMetrics.teamMembers.percentage)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${usageMetrics.teamMembers.percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Leads</span>
                    <span className="text-gray-400">
                      {usageMetrics.leads.current} / {usageMetrics.leads.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Storage</span>
                    <span className="text-gray-400">
                      {usageMetrics.storage.current} / {usageMetrics.storage.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div 
                      className={`${getUsageBarColor(usageMetrics.storage.percentage)} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${usageMetrics.storage.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Payment Method</CardTitle>
          <CardDescription className="text-gray-400">
            Your current payment method for billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">Visa ending in 4242</p>
                <p className="text-xs text-gray-400">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Billing History</CardTitle>
          <CardDescription className="text-gray-400">
            Your recent invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {billingHistory.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">{invoice.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-200">{invoice.amount}</span>
                  <Badge className={getStatusBadgeColor(invoice.status)}>
                    {invoice.status.toUpperCase()}
                  </Badge>
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Available Plans</CardTitle>
          <CardDescription className="text-gray-400">
            Compare plans and upgrade if needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-100 mb-2">Starter</h4>
              <p className="text-2xl font-bold text-gray-200 mb-4">$99<span className="text-sm text-gray-400">/month</span></p>
              <ul className="space-y-2 mb-4">
                <li className="text-sm text-gray-300">• Up to 3 team members</li>
                <li className="text-sm text-gray-300">• 500 leads/month</li>
                <li className="text-sm text-gray-300">• Basic analytics</li>
                <li className="text-sm text-gray-300">• Email support</li>
              </ul>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300">
                Current Plan
              </Button>
            </div>
            
            <div className="p-4 border border-blue-500 rounded-lg bg-blue-500/10">
              <h4 className="text-lg font-semibold text-gray-100 mb-2">Professional</h4>
              <p className="text-2xl font-bold text-blue-400 mb-4">$299<span className="text-sm text-gray-400">/month</span></p>
              <ul className="space-y-2 mb-4">
                <li className="text-sm text-gray-300">• Up to 10 team members</li>
                <li className="text-sm text-gray-300">• Unlimited leads</li>
                <li className="text-sm text-gray-300">• Advanced analytics</li>
                <li className="text-sm text-gray-300">• CRM integration</li>
                <li className="text-sm text-gray-300">• Priority support</li>
              </ul>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Current Plan
              </Button>
            </div>
            
            <div className="p-4 border border-gray-700 rounded-lg">
              <h4 className="text-lg font-semibold text-gray-100 mb-2">Enterprise</h4>
              <p className="text-2xl font-bold text-gray-200 mb-4">$599<span className="text-sm text-gray-400">/month</span></p>
              <ul className="space-y-2 mb-4">
                <li className="text-sm text-gray-300">• Unlimited team members</li>
                <li className="text-sm text-gray-300">• Unlimited leads</li>
                <li className="text-sm text-gray-300">• Custom analytics</li>
                <li className="text-sm text-gray-300">• API access</li>
                <li className="text-sm text-gray-300">• Dedicated support</li>
                <li className="text-sm text-gray-300">• Custom integrations</li>
              </ul>
              <Button variant="outline" className="w-full border-gray-700 text-gray-300">
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <BillingContent />
    </Suspense>
  )
}
