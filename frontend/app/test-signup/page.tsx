"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function TestSignupPage() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testDealershipSignup = async () => {
    setLoading(true)
    setStatus('Testing dealership signup...')

    try {
      // Test data
      const testData = {
        flow: 'dealership' as const,
        formData: {
          full_name: 'Test Admin',
          email: 'testadmin@example.com',
          dealership_name: 'Test Dealership',
          location: 'Test City, ST',
          phone: '555-123-4567'
        }
      }

      // Store in localStorage
      localStorage.setItem('pendingSignup', JSON.stringify(testData))
      setStatus('Pending signup data stored in localStorage')

      // Create test user
      const { data, error } = await supabase.auth.signUp({
        email: testData.formData.email,
        password: 'testpassword123',
        options: {
          data: {
            name: testData.formData.full_name,
            dealership_name: testData.formData.dealership_name,
            location: testData.formData.location,
            phone: testData.formData.phone
          }
        }
      })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        setStatus(`Signup successful! User ID: ${data.user?.id}\nEmail confirmation required: ${!data.session}`)
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
        setStatus(`Session found! User: ${user.email} (${user.id})`)
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
      const pendingData = localStorage.getItem('pendingSignup')
      if (!pendingData) {
        setStatus('No pending signup data found')
        return
      }

      setStatus('Calling post-confirm API...')

      const response = await fetch('/api/auth/post-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pendingData
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
    localStorage.removeItem('pendingSignup')
    setStatus('Test data cleared')
  }

  const checkPendingData = () => {
    const pendingData = localStorage.getItem('pendingSignup')
    if (pendingData) {
      setStatus(`Pending data found: ${pendingData}`)
    } else {
      setStatus('No pending data found')
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
            onClick={checkPendingData}
            variant="outline"
            className="w-full border-gray-700 text-gray-300"
          >
            Check Pending Data
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
