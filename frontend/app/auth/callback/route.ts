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
    
    // Exchange the code for a session
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (session?.user) {
      console.log('🔍 User confirmed email, checking for setup completion...');
      
      // Check if user has a profile and dealership
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (!profile) {
        console.log('🔍 No profile found, completing setup...');
        
        // Get user metadata from auth.users
        const userMetadata = session.user.user_metadata;
        const dealershipName = userMetadata?.dealership_name;
        const fullName = userMetadata?.name;
        
        if (dealershipName && fullName) {
          try {
            console.log('🔍 Calling handle_initial_setup function...');
            
            // Use the database function to handle setup (bypasses RLS)
            const { data: result, error: functionError } = await supabase
              .rpc('handle_initial_setup', {
                p_user_id: session.user.id,
                p_dealership_name: dealershipName,
                p_full_name: fullName
              });
            
            if (functionError) {
              console.error('❌ Error calling handle_initial_setup:', functionError);
              throw functionError;
            }
            
            if (result && result.success) {
              console.log('✅ Setup completed successfully:', result);
              // Redirect to admin dashboard
              return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
            } else {
              console.error('❌ Setup failed:', result);
              throw new Error(result?.message || 'Setup failed');
            }
          } catch (error) {
            console.error('❌ Error during setup completion:', error);
            // Redirect to setup completion page to handle the error
            return NextResponse.redirect(new URL('/setup-complete', requestUrl.origin));
          }
        }
      } else {
        console.log('✅ User profile already exists, redirecting to dashboard');
        // User already has profile, redirect based on role
        if (profile.role === 'owner' || profile.role === 'admin' || profile.role === 'manager') {
          return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
        } else {
          return NextResponse.redirect(new URL('/app/leads', requestUrl.origin));
        }
      }
    }
  }

  // Default redirect to setup completion page
  return NextResponse.redirect(new URL('/setup-complete', requestUrl.origin));
} 