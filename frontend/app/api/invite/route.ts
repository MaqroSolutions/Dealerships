import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, message } = body
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    // For demo purposes, we'll just log the invitation
    console.log('Demo: Invitation sent to:', { email, name, message })
    
    // In production, this would:
    // 1. Store invitation in database
    // 2. Send actual email with signup link
    // 3. Track invitation status
    
    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      email,
      demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    })
    
  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
} 