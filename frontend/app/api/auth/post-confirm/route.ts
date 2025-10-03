import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface PendingSignupData {
  flow: 'dealership' | 'sales'
  formData: {
    full_name: string
    email: string
    dealership_name?: string
    location?: string
    phone?: string
  }
  invite_token?: string
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Post-confirm API called')
    
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError)
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      console.log('✅ User profile already exists')
      // User already has profile, redirect based on role
      const redirect = existingProfile.role === 'owner' || existingProfile.role === 'manager' 
        ? '/admin/dashboard' 
        : '/leads'
      
      return NextResponse.json({
        success: true,
        redirect,
        message: 'Profile already exists'
      })
    }

    console.log('🔍 No existing profile found, processing signup data')

    const body: PendingSignupData = await request.json()
    const { flow, formData, invite_token } = body

    console.log('📝 Processing flow:', flow, 'for user:', user.id)

    if (flow === 'dealership') {
      // Handle dealership admin signup using the existing function
      return await handleDealershipSignup(supabase, user, formData)
    } else if (flow === 'sales') {
      // Handle salesperson signup
      return await handleSalesSignup(supabase, user, formData, invite_token)
    } else {
      console.error('❌ Invalid signup flow:', flow)
      return NextResponse.json(
        { success: false, error: 'Invalid signup flow' },
        { status: 400 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error in post-confirmation setup:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete setup' },
      { status: 500 }
    )
  }
}

async function handleDealershipSignup(
  supabase: any,
  user: any,
  formData: PendingSignupData['formData']
) {
  try {
    console.log('🏢 Creating dealership for user:', user.id)
    console.log('📝 Dealership data:', formData)

    // Use the existing handle_initial_setup function that bypasses RLS
    const { data: result, error: functionError } = await supabase
      .rpc('handle_initial_setup', {
        p_user_id: user.id,
        p_dealership_name: formData.dealership_name || 'My Dealership',
        p_full_name: formData.full_name
      })

    if (functionError) {
      console.error('❌ Error calling handle_initial_setup:', functionError)
      return NextResponse.json(
        { success: false, error: 'Failed to create dealership: ' + functionError.message },
        { status: 500 }
      )
    }

    if (!result || !result.success) {
      console.error('❌ Setup function failed:', result)
      return NextResponse.json(
        { success: false, error: result?.error || 'Failed to complete setup' },
        { status: 500 }
      )
    }

    console.log('✅ Dealership setup completed:', result)

    return NextResponse.json({
      success: true,
      redirect: '/admin/dashboard',
      message: 'Dealership setup completed successfully'
    })

  } catch (error: any) {
    console.error('❌ Error in dealership signup:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete dealership setup' },
      { status: 500 }
    )
  }
}

async function handleSalesSignup(
  supabase: any,
  user: any,
  formData: PendingSignupData['formData'],
  invite_token?: string
) {
  try {
    console.log('👤 Processing sales signup for user:', user.id)

    if (!invite_token) {
      console.error('❌ Missing invite token')
      return NextResponse.json(
        { success: false, error: 'Missing invite token' },
        { status: 400 }
      )
    }

    // Use the handle_sales_signup function that bypasses RLS
    const { data: result, error: functionError } = await supabase
      .rpc('handle_sales_signup', {
        p_user_id: user.id,
        p_invite_token: invite_token,
        p_full_name: formData.full_name,
        p_phone: formData.phone || null
      })

    if (functionError) {
      console.error('❌ Error calling handle_sales_signup:', functionError)
      return NextResponse.json(
        { success: false, error: 'Failed to complete sales signup: ' + functionError.message },
        { status: 500 }
      )
    }

    if (!result || !result.success) {
      console.error('❌ Sales signup function failed:', result)
      return NextResponse.json(
        { success: false, error: result?.error || 'Failed to complete sales signup' },
        { status: 500 }
      )
    }

    console.log('✅ Sales signup completed:', result)

    return NextResponse.json({
      success: true,
      redirect: '/leads',
      message: 'Account setup completed successfully'
    })

  } catch (error: any) {
    console.error('❌ Error in sales signup:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete account setup' },
      { status: 500 }
    )
  }
}
