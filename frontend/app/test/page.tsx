"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDealershipSignup = async () => {
    setLoading(true)
    setStatus('Testing dealership signup...')

    try {
      // Create test user with metadata
      const { data, error } = await supabase.auth.signUp({
        email: 'testadmin@example.com',
        password: 'testpassword123',
        options: {
          data: {
            name: 'Test Admin',
            dealership_name: 'Test Dealership',
            location: 'Test City, ST',
            phone: '555-123-4567',
            signup_flow: 'dealership',
            signup_completed: false
          }
        }
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus(`Signup successful! User ID: ${data.user?.id}\nEmail confirmation required: ${!data.session}\nMetadata stored: ${JSON.stringify(data.user?.user_metadata, null, 2)}`)
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testSession = async () => {
    setLoading(true)
    setStatus('Testing session...')

    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setStatus(`Session error: ${error.message}`)
      } else if (user) {
        setStatus(`Session found! User: ${user.email} (${user.id})\nMetadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
      } else {
        setStatus('No session found')
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testPostConfirm = async () => {
    setLoading(true)
    setStatus('Testing post-confirm...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setStatus('No authenticated user found')
        return
      }

      const userMetadata = user.user_metadata
      const signupFlow = userMetadata?.signup_flow

      if (!signupFlow) {
        setStatus('No signup flow found in metadata')
        return
      }

      setStatus('Calling post-confirm API with metadata...')

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

      const response = await fetch('/api/auth/post-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })

      const result = await response.json()
      setStatus(`Post-confirm result: ${JSON.stringify(result, null, 2)}`)
    } catch (error: any) {
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const clearTestData = () => {
    setStatus('Test data cleared (metadata remains in user account)')
  }

  const checkMetadata = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setStatus(`User metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
    } else {
      setStatus('No user found')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Card className="bg-gray-900/70 border-gray-800 backdrop-blur-sm shadow-xl w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-gray-100">Test Signup Flow</CardTitle>
          <CardDescription className="text-gray-400">
            Test the dual signup system step by step
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testDealershipSignup}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Testing...' : '1. Test Dealership Signup'}
          </Button>

          <Button 
            onClick={testSession}
            disabled={loading}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            {loading ? 'Testing...' : '2. Test Session'}
          </Button>

          <Button 
            onClick={testPostConfirm}
            disabled={loading}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            {loading ? 'Testing...' : '3. Test Post-Confirm'}
          </Button>

          <Button 
            onClick={checkMetadata}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            Check User Metadata
          </Button>

          <Button 
            onClick={clearTestData}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            Clear Test Data
          </Button>

          {status && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">{status}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
