"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, ArrowRight, Home, Settings, Users, MessageSquare } from "lucide-react"
import Link from "next/link"
import { PremiumSpinner } from "@/components/ui/premium-spinner"
import { supabase } from '@/lib/supabase'

export default function SetupCompletePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const completeSetup = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ No authenticated user found')
          setStatus('error')
          setMessage('No authenticated user found. Please try signing up again.')
          return
        }

        console.log('✅ User authenticated:', user.id)

        // Check if user already has a profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          console.log('✅ User profile already exists')
          // User already has profile, redirect based on role
          if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
            router.push('/admin/dashboard')
          } else {
            router.push('/leads')
          }
          return
        }

        console.log('🔍 No profile found, checking user metadata')

        // Get signup data from user metadata
        const userMetadata = user.user_metadata
        const signupFlow = userMetadata?.signup_flow
        const signupCompleted = userMetadata?.signup_completed

        if (signupCompleted) {
          console.log('✅ Signup already completed')
          // Signup was completed but profile doesn't exist - this shouldn't happen
          setStatus('error')
          setMessage('Account setup issue detected. Please contact support.')
          return
        }

        if (!signupFlow) {
          console.error('❌ No signup flow found in metadata')
          setStatus('error')
          setMessage('No signup data found. Please try signing up again.')
          return
        }

        console.log('📝 Found signup flow:', signupFlow)

        // Prepare signup data from metadata
        const formData = {
          full_name: userMetadata.name,
          email: user.email || '',
          dealership_name: userMetadata.dealership_name,
          location: userMetadata.location || '',
          phone: userMetadata.phone || ''
        }

        const signupData = {
          flow: signupFlow,
          formData: formData,
          invite_token: userMetadata.invite_token
        }

        // Call the post-confirmation API
        const response = await fetch('/api/auth/post-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(signupData)
        })

        const result = await response.json()

        if (result.success) {
          // Update user metadata to mark signup as completed
          await supabase.auth.updateUser({
            data: { signup_completed: true }
          })

          setStatus('success')
          setMessage('Setup completed successfully! Redirecting to dashboard...')
          
          setTimeout(() => {
            router.push(result.redirect)
          }, 2000)
        } else {
          setStatus('error')
          setMessage(result.error || 'Failed to complete setup. Please try again.')
        }

      } catch (error) {
        console.error('Setup completion error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    completeSetup()
  }, [router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <PremiumSpinner size="xl" text="Loading..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        {status === 'success' ? (
          <div className="text-green-400">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Setup Complete!</h1>
            <p className="text-gray-400">{message}</p>
          </div>
        ) : (
          <div className="text-red-400">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Setup Failed</h1>
            <p className="text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => router.push('/signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
