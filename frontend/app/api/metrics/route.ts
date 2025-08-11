import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if demo mode is enabled
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    
    if (isDemoMode) {
      // Return mock data for demo
      return NextResponse.json({
        inventoryCount: 47,
        leadsToday: 24,
        leads7d: 156,
        avgResponseTime: "2.4h",
        followUpsDue: 12,
        totalDeals: 8,
        teamSize: 5,
        conversionRate: "32%",
        revenue: "$47,500",
        demoMode: true
      })
    }
    
    // TODO: In production, fetch real metrics from database
    // For now, return basic structure
    return NextResponse.json({
      inventoryCount: 0,
      leadsToday: 0,
      leads7d: 0,
      avgResponseTime: "0h",
      followUpsDue: 0,
      totalDeals: 0,
      teamSize: 0,
      conversionRate: "0%",
      revenue: "$0",
      demoMode: false
    })
    
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
} 