"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Lock, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    if (!token) {
      setError("Missing reset token. Please use the link from your email.")
      setIsValidating(false)
      return
    }

    try {
      const response = await fetch(`/api/auth/reset-password/validate?token=${token}`)
      const data = await response.json()

      if (data.valid) {
        setTokenValid(true)
      } else {
        setError("Invalid or expired reset token. Please request a new password reset.")
      }
    } catch (err) {
      setError("Error validating reset token. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.")
      setIsLoading(false)
      return
    }

    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError("Password must contain at least one lowercase letter.")
      setIsLoading(false)
      return
    }

    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter.")
      setIsLoading(false)
      return
    }

    if (!/(?=.*\d)/.test(formData.password)) {
      setError("Password must contain at least one number.")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: token,
          password: formData.password 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Password reset successfully!')
      } else {
        setError(data.detail || "Failed to reset password. Please try again.")
      }
    } catch (err: any) {
      setError("Failed to reset password. Please try again.")
      console.error("Reset password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Validating reset link</h1>
            <p className="text-gray-400 mt-2">Please wait while we verify your reset token</p>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Password reset successful!</h1>
            <p className="text-gray-400 mt-2">Your password has been updated</p>
          </div>

          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-300 text-sm">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Sign in with new password
                </Button>
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
                  ← Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Invalid reset link</h1>
            <p className="text-gray-400 mt-2">This reset link is invalid or has expired</p>
          </div>

          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-300 text-sm">
                  {error || "The password reset link you used is invalid or has expired. Please request a new password reset."}
                </p>
                <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300 text-sm">
                  Request new password reset
                </Link>
                <Separator className="bg-gray-800" />
                <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
                  ← Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Reset your password</h1>
          <p className="text-gray-400 mt-2">Enter your new password below</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-100">New password</CardTitle>
            <CardDescription className="text-gray-400">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
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
                <p className="text-xs text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-200">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 pr-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
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
                    Resetting password...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Reset Password
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
                ← Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
