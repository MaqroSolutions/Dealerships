/**
 * Refactored signup flow component
 * Handles both admin and salesperson signup with role-based logic
 */

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, Users } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { RoleBasedAuthAPI, UserRole } from "@/lib/auth/role-based-auth"

type SignupStep = 'role-selection' | 'admin-form' | 'salesperson-form'

interface SignupFormData {
  full_name: string
  email: string
  password: string
  dealership_name?: string
  phone?: string
}

export function SignupFlow() {
  const [currentStep, setCurrentStep] = useState<SignupStep>('role-selection')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'salesperson' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  
  const [formData, setFormData] = useState<SignupFormData>({
    full_name: "",
    email: "",
    password: "",
    dealership_name: "",
    phone: "",
  })

  // Auto-select salesperson role if invite token is present
  React.useEffect(() => {
    if (inviteToken && currentStep === 'role-selection') {
      setSelectedRole('salesperson')
      setCurrentStep('salesperson-form')
    }
  }, [inviteToken, currentStep])

  const handleRoleSelection = (role: 'admin' | 'salesperson') => {
    setSelectedRole(role)
    setCurrentStep(role === 'admin' ? 'admin-form' : 'salesperson-form')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await RoleBasedAuthAPI.createDealershipAdmin({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        dealership_name: formData.dealership_name!,
      })

      if (result.success) {
        if (result.requiresEmailVerification) {
          toast.success('Account created! Please check your email to verify your account before completing setup.')
          router.push('/login')
        } else {
          toast.success('Dealership account created successfully!')
          router.push('/admin/dashboard')
        }
      } else {
        setError(result.error || 'Failed to create dealership account')
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSalespersonSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!inviteToken) {
      setError("Salesperson signup requires an invite link. Please contact your dealership admin.")
      setIsLoading(false)
      return
    }

    try {
      const result = await RoleBasedAuthAPI.acceptInvite({
        token: inviteToken,
        full_name: formData.full_name,
        password: formData.password,
        phone: formData.phone,
      })

      if (result.success) {
        toast.success('Account created successfully! You can now sign in.')
        router.push('/login')
      } else {
        setError(result.error || 'Failed to create account')
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToRoleSelection = () => {
    setCurrentStep('role-selection')
    setSelectedRole(null)
    setError(null)
  }

  const renderRoleSelection = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Choose your role</h1>
          <p className="text-gray-400 mt-2">Select how you'll be using Maqro</p>
        </div>

        <div className="space-y-4">
          <Card 
            className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => handleRoleSelection('admin')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100">Dealership Manager</h3>
                  <p className="text-gray-400 text-sm">
                    I'm a GM, Owner, or Marketing Director setting up my dealership
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => handleRoleSelection('salesperson')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-100">Salesperson</h3>
                  <p className="text-gray-400 text-sm">
                    I'm joining an existing dealership via invite link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )

  const renderSignupForm = () => {
    const isAdmin = selectedRole === 'admin'
    const title = isAdmin ? 'Create your dealership' : 'Join your dealership'
    const subtitle = isAdmin 
      ? 'Set up your dealership account and start managing leads' 
      : 'Complete your account setup to join your team'
    const cardTitle = isAdmin ? 'Dealership Signup' : 'Account Setup'
    const cardDescription = isAdmin 
      ? 'Enter your information to create your dealership account'
      : 'Complete your account information'
    const submitText = isAdmin ? 'Create Dealership' : 'Create Account'
    const loadingText = isAdmin ? 'Creating dealership...' : 'Creating account...'
    const onSubmit = isAdmin ? handleAdminSignup : handleSalespersonSignup

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
            <p className="text-gray-400 mt-2">{subtitle}</p>
          </div>

          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-gray-100">{cardTitle}</CardTitle>
              <CardDescription className="text-gray-400">{cardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-200">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Dealership Name Field - Only for admins */}
                {isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="dealership_name" className="text-gray-200">Dealership Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="dealership_name"
                        name="dealership_name"
                        type="text"
                        placeholder="Enter your dealership name"
                        value={formData.dealership_name}
                        onChange={handleInputChange}
                        className="pl-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Phone Field - Only for salespeople */}
                {!isAdmin && (
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-200">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      required
                      disabled={!!inviteToken}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {loadingText}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {submitText}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="flex flex-col space-y-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleBackToRoleSelection}
                  className="text-gray-400 hover:text-gray-300"
                >
                  ← Back to role selection
                </Button>
                
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render based on current step
  switch (currentStep) {
    case 'role-selection':
      return renderRoleSelection()
    case 'admin-form':
    case 'salesperson-form':
      return renderSignupForm()
    default:
      return renderRoleSelection()
  }
}
