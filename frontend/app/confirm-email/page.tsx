"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Mail, ArrowRight, Home } from "lucide-react"
import Link from "next/link"
import { PremiumSpinner } from "@/components/ui/premium-spinner"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function ConfirmEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('No email address found')
      return
    }

    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      toast.success('Verification email resent!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Check your email</h1>
          <p className="text-gray-400 mt-2">We've sent a verification link to</p>
          <p className="text-blue-400 font-medium">{email}</p>
        </div>

        <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6 space-y-4">
            <p className="text-gray-300 text-center">
              Click the link in your email to verify your account and complete setup.
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <PremiumSpinner size="sm" />
                      Resending...
                    </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Resend verification email
                  </div>
                )}
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
}
