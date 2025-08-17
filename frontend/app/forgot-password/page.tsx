"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Mail, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Password reset email sent!')
      } else {
        setError(data.detail || "Failed to send reset email. Please try again.")
      }
    } catch (err: any) {
      setError("Failed to send reset email. Please try again.")
      console.error("Forgot password error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-100">Check your email</h1>
            <p className="text-gray-400 mt-2">We've sent you a password reset link</p>
          </div>

          <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="text-center space-y-4">
                <p className="text-gray-300 text-sm">
                  We've sent a password reset link to <strong className="text-gray-100">{email}</strong>
                </p>
                <p className="text-gray-400 text-sm">
                  Click the link in the email to reset your password. The link will expire in 30 minutes.
                </p>
                <Separator className="bg-gray-800" />
                <p className="text-gray-400 text-sm">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    try again
                  </button>
                </p>
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
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Forgot your password?</h1>
          <p className="text-gray-400 mt-2">Enter your email to reset your password</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-gray-100">Reset password</CardTitle>
            <CardDescription className="text-gray-400">
              We'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-800/70 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
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
                    Sending reset link...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
              <Separator className="bg-gray-800" />
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
