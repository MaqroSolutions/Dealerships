import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedApi } from '@/lib/api-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, location } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Dealership name is required' },
        { status: 400 }
      )
    }

    const api = await getAuthenticatedApi()
    const dealership = await api.post('/dealerships', {
      name,
      location: location || ''
    })

    return NextResponse.json(dealership)
  } catch (error: any) {
    console.error('Error creating dealership:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create dealership' },
      { status: 500 }
    )
  }
}
