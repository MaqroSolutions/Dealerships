import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('🚀 AUTH CALLBACK ROUTE HIT!');
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  console.log('🔑 Code received:', code ? 'YES' : 'NO');

  if (code) {
    const cookieStore = await cookies();
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
    );
    try {
      // Exchange the code for a session
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }
      
      if (session?.user) {
        console.log('✅ Email confirmed, user logged in:', session.user.id);
        
        // Check if this is a password recovery flow
        const isPasswordRecovery = requestUrl.searchParams.get('type') === 'recovery' || 
                                 requestUrl.hash.includes('type=recovery');
        
        if (isPasswordRecovery) {
          console.log('🔐 Password recovery detected, redirecting to reset password page');
          return NextResponse.redirect(new URL('/reset-password?type=recovery', requestUrl.origin));
        }
        
        // Check if user has a profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          // User has profile, redirect to appropriate dashboard
          console.log('✅ User profile exists, redirecting to dashboard');
          if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
            return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
          } else {
            return NextResponse.redirect(new URL('/leads', requestUrl.origin));
          }
        } else {
          // No profile yet, handle post-confirmation setup directly
          console.log('🔍 No profile found, handling post-confirmation setup');
          
          const userMetadata = session.user.user_metadata;
          const signupFlow = userMetadata?.signup_flow;
          const signupCompleted = userMetadata?.signup_completed;

          if (signupCompleted) {
            console.log('❌ Signup marked as completed but no profile exists');
            return NextResponse.redirect(new URL('/login?error=profile_missing', requestUrl.origin));
          }

          if (!signupFlow) {
            console.log('❌ No signup flow found in metadata');
            return NextResponse.redirect(new URL('/login?error=no_signup_data', requestUrl.origin));
          }

          console.log('📝 Processing signup flow:', signupFlow);

          // Prepare signup data from metadata
          const formData = {
            full_name: userMetadata.name,
            email: session.user.email || '',
            dealership_name: userMetadata.dealership_name,
            location: userMetadata.location || '',
            phone: userMetadata.phone || ''
          };

          // Handle the post-confirmation setup
          if (signupFlow === 'dealership') {
            const { data: result, error: functionError } = await supabase.rpc('handle_initial_setup', {
              p_user_id: session.user.id,
              p_dealership_name: formData.dealership_name || 'My Dealership',
              p_full_name: formData.full_name
            });

            if (functionError || !result?.success) {
              console.error('❌ Error in dealership setup:', functionError || result?.error);
              return NextResponse.redirect(new URL('/login?error=setup_failed', requestUrl.origin));
            }

            // Update user metadata to mark signup as completed
            await supabase.auth.updateUser({
              data: { signup_completed: true }
            });

            console.log('✅ Dealership setup completed, redirecting to admin dashboard');
            return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));

          } else if (signupFlow === 'sales') {
            if (!userMetadata.invite_token) {
              console.error('❌ Missing invite token for sales signup');
              return NextResponse.redirect(new URL('/login?error=missing_invite', requestUrl.origin));
            }

            // Call backend to complete invite for existing user
            try {
              const accessToken = session.access_token;
              const rawBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
              const apiBase = rawBase.replace(/\/$/, '').endsWith('/api') ? rawBase.replace(/\/$/, '') : `${rawBase.replace(/\/$/, '')}/api`
              const resp = await fetch(`${apiBase}/invites/complete`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                  token: userMetadata.invite_token,
                  full_name: formData.full_name,
                  phone: formData.phone || null
                })
              });

              if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                console.error('❌ Error in sales signup (backend):', err);
                return NextResponse.redirect(new URL('/login?error=setup_failed', requestUrl.origin));
              }

              // Update user metadata to mark signup as completed
              await supabase.auth.updateUser({
                data: { signup_completed: true }
              });

              console.log('✅ Sales signup completed via backend, redirecting to leads dashboard');
              return NextResponse.redirect(new URL('/leads', requestUrl.origin));
            } catch (e) {
              console.error('❌ Error completing sales signup via backend:', e);
              return NextResponse.redirect(new URL('/login?error=setup_failed', requestUrl.origin));
            }
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
  } else {
    // No code provided
    console.error('❌ No code provided in auth callback');
    return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin));
  }
} 