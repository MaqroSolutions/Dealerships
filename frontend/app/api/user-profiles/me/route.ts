import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedApi } from '@/lib/api-client'

export async function GET(request: NextRequest) {
  try {
    const api = await getAuthenticatedApi()
    const profile = await api.get('/user-profiles/me')
    
    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
