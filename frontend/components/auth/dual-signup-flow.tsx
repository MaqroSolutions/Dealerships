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

  // Auto-select sales flow if invite token is present
  useEffect(() => {
    if (inviteToken && currentFlow === 'role-selection') {
      setCurrentFlow('sales-signup')
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
      // Store pending signup data
      const pendingData: PendingSignupData = {
        flow: 'dealership',
        formData: formData
      }
      localStorage.setItem('pendingSignup', JSON.stringify(pendingData))

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.full_name,
            dealership_name: formData.dealership_name,
            location: formData.location,
            phone: formData.phone
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
        await handlePostConfirmation(pendingData)
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
      localStorage.removeItem('pendingSignup')
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

      // Store pending signup data
      const pendingData: PendingSignupData = {
        flow: 'sales',
        formData: formData,
        invite_token: inviteToken
      }
      localStorage.setItem('pendingSignup', JSON.stringify(pendingData))

      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.full_name,
            phone: formData.phone,
            invite_token: inviteToken
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
        await handlePostConfirmation(pendingData)
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign up. Please try again.")
      localStorage.removeItem('pendingSignup')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePostConfirmation = async (pendingData: PendingSignupData) => {
    try {
      const response = await fetch('/api/auth/post-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingData)
      })

      const result = await response.json()

      if (result.success) {
        localStorage.removeItem('pendingSignup')
        toast.success('Account setup completed successfully!')
        router.push(result.redirect)
      } else {
        throw new Error(result.error || 'Failed to complete account setup')
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
            onClick={() => setCurrentFlow('dealership-signup')}
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
            onClick={() => setCurrentFlow('sales-signup')}
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

  const renderDealershipSignup = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Create your dealership</h1>
          <p className="text-gray-400 mt-2">Set up your dealership account and start managing leads</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-100">Dealership Signup</CardTitle>
            <CardDescription className="text-gray-400">Enter your information to create your dealership account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleDealershipSignup} className="space-y-4">
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

              {/* Dealership Name Field */}
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

              {/* Location Field */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-gray-200">Location (Optional)</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="City, State"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Join your dealership</h1>
          <p className="text-gray-400 mt-2">Complete your account setup to join your team</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-100">Account Setup</CardTitle>
            <CardDescription className="text-gray-400">Complete your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSalesSignup} className="space-y-4">
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

              {/* Phone Field */}
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
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

  const renderConfirmEmail = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Check your email</h1>
          <p className="text-gray-400 mt-2">We've sent a verification link to</p>
          <p className="text-blue-400 font-medium">{emailForConfirmation}</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-300 text-center">
              Click the link in your email to verify your account and complete setup.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Resend verification email
              </Button>
              
              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-gray-300"
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
