"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LoadingScreen } from '@/components/ui/loading-spinner'

export default function SetupCompletePage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const completeSetup = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setStatus('error')
          setMessage('No authenticated user found')
          return
        }

        // Check if user already has a profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profile) {
          // User already has profile, redirect based on role
          if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
            router.push('/admin/dashboard')
          } else {
            router.push('/app/leads')
          }
          return
        }

        // Get user metadata
        const userMetadata = user.user_metadata
        const dealershipName = userMetadata?.dealership_name
        const fullName = userMetadata?.name

        if (!dealershipName || !fullName) {
          setStatus('error')
          setMessage('Missing user information. Please try signing up again.')
          return
        }

        // Use the database function to handle setup (bypasses RLS)
        const { data: result, error: functionError } = await supabase
          .rpc('handle_initial_setup', {
            p_user_id: user.id,
            p_dealership_name: dealershipName,
            p_full_name: fullName
          })

        if (functionError) {
          console.error('Setup function error:', functionError)
          setStatus('error')
          setMessage('Failed to complete setup. Please try again.')
          return
        }

        if (!result || !result.success) {
          console.error('Setup failed:', result)
          setStatus('error')
          setMessage(result?.message || 'Failed to complete setup. Please try again.')
          return
        }

        // Success - redirect to admin dashboard
        setStatus('success')
        setMessage('Setup completed successfully! Redirecting to dashboard...')
        setTimeout(() => {
          router.push('/admin/dashboard')
        }, 2000)

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
