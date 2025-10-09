"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { PremiumSpinner } from "@/components/ui/premium-spinner"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordReset, setPasswordReset] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have a valid password reset session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Session error:", error)
          setIsValidSession(false)
          return
        }

        // Check if this is a password recovery session
        const isRecovery = searchParams.get('type') === 'recovery' || 
                          session?.user?.recovery_sent_at ||
                          window.location.hash.includes('type=recovery')
        
        if (session && isRecovery) {
          setIsValidSession(true)
        } else {
          setIsValidSession(false)
        }
      } catch (err) {
        console.error("Error checking session:", err)
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setPasswordReset(true)
      toast.success('Password updated successfully!')
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.")
      console.error("Password update error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <PremiumSpinner size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
            <p className="text-gray-600 mt-2">Verifying your reset link</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error if invalid session
  if (isValidSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <span className="text-xl font-bold text-white">!</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Invalid Reset Link</h1>
            <p className="text-gray-600 mt-2">This password reset link is invalid or has expired</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 text-center">
                The password reset link may have expired or already been used. Please request a new one.
              </p>
              
              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Request New Reset Link
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
  }

  // Show success state
  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Password Updated</h1>
            <p className="text-gray-600 mt-2">Your password has been successfully reset</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700 text-center">
                You can now sign in with your new password.
              </p>
              
              <Button
                onClick={() => router.push('/login')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-2">
                  Continue to Sign In
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="text-gray-600 mt-2">Choose a strong password for your account</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-900">Reset Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                    minLength={6}
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/90 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
                    Updating password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Update Password
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Remember your password?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}