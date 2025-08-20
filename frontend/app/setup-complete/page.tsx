"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoadingScreen } from '@/components/ui/loading-spinner'

interface PendingSignupData {
  flow: 'dealership' | 'sales'
  formData: {
    full_name: string
    email: string
    dealership_name?: string
    location?: string
    phone?: string
  }
  invite_token?: string
}

export default function SetupCompletePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const completeSetup = async () => {
      try {
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('❌ Error getting user:', userError)
          setStatus('error')
          setMessage('Authentication error. Please try signing up again.')
          return
        }
        
        if (!user) {
          console.log('🔍 No user found, waiting for session...')
          // Wait a bit more and try again
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: { user: retryUser } } = await supabase.auth.getUser()
          if (!retryUser) {
            setStatus('error')
            setMessage('No authenticated user found. Please try signing up again.')
            return
          }
        }

        console.log('✅ User authenticated:', user?.id)

        // Check if user already has a profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user!.id)
          .single()

        if (profile) {
          console.log('✅ User profile already exists')
          // User already has profile, redirect based on role
          if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
            router.push('/admin/dashboard')
          } else {
            router.push('/app/leads')
          }
          return
        }

        console.log('🔍 No profile found, checking for pending signup data')

        // Check for pending signup data in localStorage
        const pendingSignupStr = localStorage.getItem('pendingSignup')
        if (!pendingSignupStr) {
          // No pending signup data found - this might happen if user refreshed the page
          // Try to get data from user metadata as fallback
          const userMetadata = user!.user_metadata
          if (userMetadata?.dealership_name && userMetadata?.name) {
            console.log('📝 Using user metadata for setup')
            // We have metadata, create a pending data object
            const pendingData: PendingSignupData = {
              flow: 'dealership',
              formData: {
                full_name: userMetadata.name,
                email: user!.email || '',
                dealership_name: userMetadata.dealership_name,
                location: userMetadata.location || '',
                phone: userMetadata.phone || ''
              }
            }
            
            // Call the post-confirmation API
            const response = await fetch('/api/auth/post-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pendingData)
            })

            const result = await response.json()

            if (result.success) {
              setStatus('success')
              setMessage('Setup completed successfully! Redirecting to dashboard...')
              
              setTimeout(() => {
                router.push(result.redirect)
              }, 2000)
            } else {
              setStatus('error')
              setMessage(result.error || 'Failed to complete setup. Please try again.')
            }
          } else {
            setStatus('error')
            setMessage('No pending signup data found. Please try signing up again.')
          }
          return
        }

        console.log('📝 Found pending signup data')

        const pendingData: PendingSignupData = JSON.parse(pendingSignupStr)

        // Call the post-confirmation API
        const response = await fetch('/api/auth/post-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pendingData)
        })

        const result = await response.json()

        if (result.success) {
          // Clear pending signup data
          localStorage.removeItem('pendingSignup')
          
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
    return <LoadingScreen />
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
