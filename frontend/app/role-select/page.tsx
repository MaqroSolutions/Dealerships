"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, ArrowRight, Building2, MessageSquare } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { updateMyProfile } from "@/lib/user-profile-api"
import { toast } from "sonner"

export default function RoleSelectPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userRole } = useAuth()
  
  const action = searchParams.get('action') || 'signup' // Default to signup

  // If user is already authenticated and has a role, redirect them
  useEffect(() => {
    if (user && userRole) {
      if (userRole === 'admin') {
        router.push('/admin')
      } else {
        router.push('/')
      }
    }
  }, [user, userRole, router])

  const handleRoleSelect = async (role: string) => {
    setIsLoading(true)
    setSelectedRole(role)

    try {
      // Store the selected role in sessionStorage for the auth process
      sessionStorage.setItem('selectedRole', role)
      
      // Redirect to the appropriate authentication page
      if (action === 'signin') {
        router.push('/login')
      } else {
        router.push('/signup')
      }
    } catch (error) {
      console.error('Error setting role:', error)
      toast.error('Failed to set role. Please try again.')
      setSelectedRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  const roles = [
    {
      id: 'admin',
      title: 'Dealership Admin',
      description: 'Manage your dealership operations, team, and inventory',
      icon: Shield,
      color: 'bg-purple-600',
      features: [
        'Upload and manage inventory',
        'Invite and manage salespeople',
        'View all team conversations',
        'Access analytics and metrics',
        'Manage dealership settings'
      ]
    },
    {
      id: 'salesperson',
      title: 'Salesperson',
      description: 'Handle leads, conversations, and customer interactions',
      icon: Users,
      color: 'bg-blue-600',
      features: [
        'Manage your leads and conversations',
        'Upload inventory for approval',
        'Access conversation templates',
        'Track your performance',
        'Schedule test drives'
      ]
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100">
            {action === 'signin' ? 'Sign In' : 'Sign Up'} - Choose Your Role
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl mx-auto">
            Select how you'll be using Maqro. This will determine your dashboard and available features after {action === 'signin' ? 'signing in' : 'creating your account'}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className={`bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl transition-all duration-200 hover:bg-gray-900/90 cursor-pointer ${
                selectedRole === role.id ? 'ring-2 ring-blue-500 bg-gray-900/90' : ''
              }`}
              onClick={() => !isLoading && handleRoleSelect(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-12 h-12 ${role.color} rounded-lg flex items-center justify-center mb-4`}>
                  <role.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-100">{role.title}</CardTitle>
                <CardDescription className="text-gray-400">
                  {role.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {role.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button
                  className={`w-full ${role.color} hover:opacity-90 transition-all duration-200`}
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRoleSelect(role.id)
                  }}
                >
                  {isLoading && selectedRole === role.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Setting up...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {action === 'signin' ? 'Sign In' : 'Sign Up'} as {role.title}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
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
                For the demo, you can select either role to see the different interfaces. 
                After {action === 'signin' ? 'signing in' : 'signing up'}, you'll be redirected to the appropriate dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            You can change your role later in your account settings
          </p>
        </div>
      </div>
    </div>
  )
} 