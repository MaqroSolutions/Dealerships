/**
 * Debug utility for Supabase configuration
 */

export function checkSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log('🔍 Supabase Configuration Check:')
  console.log('URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('Anon Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!')
    console.error('Please check your .env file and ensure you have:')
    console.error('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url')
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key')
    return false
  }

  console.log('✅ Supabase configuration looks good!')
  return true
}

export function logSupabaseError(error: any, context: string) {
  console.error(`❌ Supabase Error in ${context}:`, error)
  
  if (error.message?.includes('fetch')) {
    console.error('🔍 This looks like a network/fetch error. Possible causes:')
    console.error('1. Supabase URL is incorrect')
    console.error('2. Network connectivity issues')
    console.error('3. CORS configuration problems')
    console.error('4. Supabase service is down')
  }
  
  if (error.message?.includes('JWT')) {
    console.error('🔍 This looks like an authentication error. Possible causes:')
    console.error('1. Supabase anon key is incorrect')
    console.error('2. JWT token is invalid or expired')
    console.error('3. User is not properly authenticated')
  }
}
