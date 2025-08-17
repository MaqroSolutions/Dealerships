import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedApi } from '@/lib/api-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dealership_id, full_name, role, timezone } = body

    if (!dealership_id || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: dealership_id, full_name, role' },
        { status: 400 }
      )
    }

    const api = await getAuthenticatedApi()
    const profile = await api.post('/user-profiles', {
      dealership_id,
      full_name,
      role,
      timezone: timezone || 'America/New_York'
    })

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('Error creating user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user profile' },
      { status: 500 }
    )
  }
}
