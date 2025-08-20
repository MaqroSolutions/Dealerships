import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Query the invites table for the token
    const { data: invite, error } = await supabase
      .from('invites')
      .select('*')
      .eq('token_hash', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invite) {
      return NextResponse.json(
        { valid: false, reason: 'Invalid or expired invite token' },
        { status: 200 }
      )
    }

    // Get dealership info
    const { data: dealership } = await supabase
      .from('dealerships')
      .select('name')
      .eq('id', invite.dealership_id)
      .single()

    return NextResponse.json({
      valid: true,
      dealership_id: invite.dealership_id,
      dealership_name: dealership?.name || 'Unknown Dealership',
      role_name: invite.role,
      email: invite.email,
      expires_at: invite.expires_at
    })

  } catch (error: any) {
    console.error('Error verifying invite token:', error)
    return NextResponse.json(
      { valid: false, reason: 'Failed to verify invite token' },
      { status: 500 }
    )
  }
}
