import { NextRequest, NextResponse } from 'next/server'
// Proxy verification to backend API so it stays in sync with invite tokens

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, reason: 'Missing invite token' },
        { status: 400 }
      )
    }

    const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const apiBase = rawBase.replace(/\/$/, '').endsWith('/api') ? rawBase.replace(/\/$/, '') : `${rawBase.replace(/\/$/, '')}/api`
    const resp = await fetch(`${apiBase}/invites/verify?token=${encodeURIComponent(token)}`)
    const json = await resp.json()
    return NextResponse.json(json, { status: 200 })

  } catch (error: any) {
    console.error('Error verifying invite token:', error)
    return NextResponse.json(
      { valid: false, reason: 'Failed to verify invite token' },
      { status: 500 }
    )
  }
}
