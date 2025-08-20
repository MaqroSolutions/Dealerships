import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Create a Supabase client for the Server Component
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Exchange the code for a session
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }
      
      if (session?.user) {
        console.log('🔍 User confirmed email, checking for setup completion...');
        console.log('✅ Session established for user:', session.user.id);
        
        // Check if user has a profile and dealership
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (!profile) {
          console.log('🔍 No profile found, redirecting to setup-complete...');
          // User needs to complete setup - redirect to setup-complete
          return NextResponse.redirect(new URL('/setup-complete', requestUrl.origin));
        } else {
          console.log('✅ User profile already exists, redirecting to dashboard');
          // User already has profile, redirect based on role
          if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
            return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
          } else {
            return NextResponse.redirect(new URL('/app/leads', requestUrl.origin));
          }
        }
      } else {
        console.error('❌ No session established after code exchange');
        return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin));
      }
    } catch (error) {
      console.error('❌ Error in auth callback:', error);
      return NextResponse.redirect(new URL('/login?error=callback_error', requestUrl.origin));
    }
  }

  // No code provided
  console.error('❌ No code provided in auth callback');
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
} 