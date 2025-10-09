/**
 * Dual signup flow component
 * Handles both dealership admin and salesperson signup with email confirmation
 */

"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Building2, Users, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { PremiumSpinner } from "@/components/ui/premium-spinner"

type SignupFlow = 'role-selection' | 'dealership-signup' | 'sales-signup' | 'confirm-email'

interface SignupFormData {
  full_name: string
  email: string
  password: string
  dealership_name?: string
  location?: string
  phone?: string
}

interface PendingSignupData {
  flow: 'dealership' | 'sales'
  formData: SignupFormData
  invite_token?: string
}

export function DualSignupFlow() {
  const [currentFlow, setCurrentFlow] = useState<SignupFlow>('role-selection')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailForConfirmation, setEmailForConfirmation] = useState<string>('')
  const [inviteDetails, setInviteDetails] = useState<{
    email: string
    dealership_name: string
    role_name: string
  } | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  
  const [formData, setFormData] = useState<SignupFormData>({
    full_name: "",
    email: "",
    password: "",
    dealership_name: "",
    location: "",
    phone: "",
  })


  // Simple invite flow - always go to sales signup if invite token present
  useEffect(() => {
    if (inviteToken && currentFlow === 'role-selection') {
      setCurrentFlow('sales-signup')
      
      // Fetch invite details
      const fetchInviteDetails = async () => {
        try {
          const verifyResponse = await fetch(`/api/invites/verify?token=${inviteToken}`)
          const verifyResult = await verifyResponse.json()
          
          if (verifyResult.valid) {
            setInviteDetails({
              email: verifyResult.email,
              dealership_name: verifyResult.dealership_name,
              role_name: verifyResult.role_name
            })
            
            // Pre-fill the email field
            setFormData(prev => ({
              ...prev,
              email: verifyResult.email
            }))
          }
        } catch (error) {
          console.error('Failed to fetch invite details:', error)
        }
      }
      
      fetchInviteDetails()
    }
  }, [inviteToken, currentFlow])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleDealershipSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Sign up with Supabase, storing signup data in user metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.full_name,
            dealership_name: formData.dealership_name,
            location: formData.location,
            phone: formData.phone,
            signup_flow: 'dealership', // Store flow type in metadata
            signup_completed: false // Track if setup is complete
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      if (data.user && !data.session) {
        // Email confirmation required
        setEmailForConfirmation(formData.email)
        setCurrentFlow('confirm-email')
        toast.success('Account created! Please check your email to verify your account.')
      } else if (data.session) {
        // Email confirmation not required (auto-confirmed)
        await handlePostConfirmation('dealership', formData)
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSalesSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!inviteToken) {
      setError("Salesperson signup requires an invite link. Please contact your dealership admin.")
      setIsLoading(false)
      return
    }

    try {
      // Verify invite token first
      const verifyResponse = await fetch(`/api/invites/verify?token=${inviteToken}`)
      const verifyResult = await verifyResponse.json()

      if (!verifyResult.valid) {
        throw new Error(verifyResult.reason || 'Invalid or expired invite token')
      }

      // Sign up with Supabase, storing signup data in user metadata
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.full_name,
            phone: formData.phone,
            invite_token: inviteToken,
            signup_flow: 'sales', // Store flow type in metadata
            signup_completed: false // Track if setup is complete
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) throw signUpError

      if (data.user && !data.session) {
        // Email confirmation required
        setEmailForConfirmation(formData.email)
        setCurrentFlow('confirm-email')
        toast.success('Account created! Please check your email to verify your account.')
      } else if (data.session) {
        // Email confirmation not required (auto-confirmed)
        await handlePostConfirmation('sales', formData, inviteToken)
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }


  const handlePostConfirmation = async (flow: 'dealership' | 'sales', formData: any, inviteToken?: string) => {
    try {
      const response = await fetch('/api/auth/post-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow, formData, invite_token: inviteToken })
      })

      const result = await response.json()

      if (result.success) {
        // Update user metadata to mark signup as completed
        await supabase.auth.updateUser({
          data: { signup_completed: true }
        })

        toast.success('Account setup completed!')
        router.push(result.redirect)
      } else {
        throw new Error(result.error || 'Failed to complete setup')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete account setup')
    }
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailForConfirmation,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      toast.success('Verification email resent!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email')
    }
  }

  const handleBackToRoleSelection = () => {
    setCurrentFlow('role-selection')
    setError(null)
    setFormData({
      full_name: "",
      email: "",
      password: "",
      dealership_name: "",
      location: "",
      phone: "",
    })
  }

  const renderRoleSelection = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <User className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Choose your role</h1>
          <p className="text-gray-600 mt-2">Select how you'll be using Maqro</p>
        </div>

        <div className="space-y-4">
          <Card 
            className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl cursor-pointer hover:border-orange-400 transition-colors rounded-2xl"
            onClick={() => setCurrentFlow('dealership-signup')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Dealership Manager</h3>
                  <p className="text-gray-600 text-sm">
                    I'm a GM, Owner, or Marketing Director setting up my dealership
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl cursor-pointer hover:border-orange-400 transition-colors rounded-2xl"
            onClick={() => setCurrentFlow('sales-signup')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Salesperson</h3>
                  <p className="text-gray-600 text-sm">
                    I'm joining an existing dealership via invite link
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-orange-600 hover:text-orange-500 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )

  const renderDealershipSignup = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your dealership</h1>
          <p className="text-gray-600 mt-2">Set up your dealership account and start managing leads</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-900">Dealership Signup</CardTitle>
            <CardDescription className="text-gray-600">Enter your information to create your dealership account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleDealershipSignup} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Dealership Name Field */}
              <div className="space-y-2">
                <Label htmlFor="dealership_name" className="text-gray-700">Dealership Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="dealership_name"
                    name="dealership_name"
                    type="text"
                    placeholder="Enter your dealership name"
                    value={formData.dealership_name}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Location Field */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-700">Location (Optional)</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                />
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
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
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <PremiumSpinner size="sm" />
                      Creating dealership...
                    </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Dealership
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

  const renderSalesSignup = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join your dealership</h1>
          {inviteDetails ? (
            <div className="mt-3">
              <p className="text-gray-600">You've been invited to join</p>
              <p className="text-green-600 font-semibold">{inviteDetails.dealership_name}</p>
              <p className="text-gray-600 text-sm">as a {inviteDetails.role_name}</p>
            </div>
          ) : (
            <p className="text-gray-600 mt-2">Complete your account setup to join your team</p>
          )}
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-900">Account Setup</CardTitle>
            <CardDescription className="text-gray-600">Complete your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSalesSignup} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="pl-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                />
              </div>
              
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email {inviteDetails && <span className="text-gray-500 text-sm font-normal">(from invite)</span>}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl ${
                      inviteDetails 
                        ? 'bg-gray-100 cursor-not-allowed opacity-75' 
                        : 'bg-white/90'
                    }`}
                    required
                    disabled={!!inviteDetails}
                    readOnly={!!inviteDetails}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
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
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <PremiumSpinner size="sm" />
                      Creating account...
                    </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create Account
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
                className="text-gray-600 hover:text-gray-800"
              >
                ← Back to role selection
              </Button>
              
              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-orange-600 hover:text-orange-500 font-medium">
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

  const renderConfirmEmail = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
          <p className="text-gray-600 mt-2">We've sent a verification link to</p>
          <p className="text-orange-600 font-medium">{emailForConfirmation}</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-700 text-center">
              Click the link in your email to verify your account and complete setup.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full border-amber-200 text-gray-700 hover:bg-amber-50 rounded-xl"
              >
                Resend verification email
              </Button>
              
              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )


  // Render based on current flow
  switch (currentFlow) {
    case 'role-selection':
      return renderRoleSelection()
    case 'dealership-signup':
      return renderDealershipSignup()
    case 'sales-signup':
      return renderSalesSignup()
    case 'confirm-email':
      return renderConfirmEmail()
    default:
      return renderRoleSelection()
  }
}
