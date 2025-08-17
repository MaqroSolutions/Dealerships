/**
 * Test environment variable loading
 */

export function testEnvironmentVariables() {
  console.log('🔍 Environment Variable Test:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL ? '✅ Set' : '❌ Missing')
  
  // Check if the values are actually valid
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('URL starts with https://:', process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') ? '✅' : '❌')
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Key starts with eyJ:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ') ? '✅' : '❌')
  }
  
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL
  }
}
