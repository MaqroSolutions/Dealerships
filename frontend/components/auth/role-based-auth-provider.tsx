/**
 * Role-based authentication provider
 * Manages user authentication state and role-based routing
 */

"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { 
  UserAuthInfo, 
  RoleBasedAuthAPI, 
  RouteProtection, 
  authState 
} from "@/lib/auth/role-based-auth"

interface AuthContextType {
  user: User | null
  userInfo: UserAuthInfo | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userInfo: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
})

export function RoleBasedAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<UserAuthInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserInfo(null)
    authState.setUser(null)
    router.push("/")
  }

  const refreshUser = async () => {
    try {
      const userInfo = await RoleBasedAuthAPI.getCurrentUser()
      setUserInfo(userInfo)
      authState.setUser(userInfo)
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  useEffect(() => {
    console.log('RoleBasedAuthProvider: Starting auth check for path:', pathname)
    
    // Clear any existing timeout
    const timeout = setTimeout(() => {
      console.log('RoleBasedAuthProvider: Timeout reached, setting loading to false')
      setLoading(false)
    }, 5000) // Increased timeout

    const getSession = async () => {
      try {
        console.log('RoleBasedAuthProvider: Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('RoleBasedAuthProvider: Session result:', session ? 'User found' : 'No user')
        
        setUser(session?.user || null)
        
        // Define public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/signup',
          '/confirm-email',
          '/setup-complete',
          '/test-signup',
          '/test',
          '/forgot-password',
          '/reset-password',
          '/sms-policy',
          '/privacy-policy'
        ]
        const isPublicRoute = publicRoutes.includes(pathname) || pathname.includes("/auth/")
        
        if (session?.user) {
          // Get user info but don't redirect here - let onAuthStateChange handle it
          try {
            console.log('RoleBasedAuthProvider: Getting user info for authenticated user...', session.user.id)
            const userInfoResult = await RoleBasedAuthAPI.getCurrentUser()
            console.log('RoleBasedAuthProvider: User info result:', userInfoResult)
            
            if (userInfoResult) {
              setUserInfo(userInfoResult)
              authState.setUser(userInfoResult)
            } else {
              console.log('RoleBasedAuthProvider: No user profile found, user may need to complete setup')
              setUserInfo(null)
              authState.setUser(null)
            }
          } catch (error) {
            console.error('RoleBasedAuthProvider: Error getting user info:', error)
            setUserInfo(null)
            authState.setUser(null)
          }
        } else {
          setUserInfo(null)
          authState.setUser(null)
        }
        
        clearTimeout(timeout)
        setLoading(false)
        
        // Handle unauthenticated users on protected routes
        if (!session?.user && !isPublicRoute) {
          console.log('RoleBasedAuthProvider: Redirecting unauthenticated user to root')
          router.push("/")
        }
      } catch (error) {
        console.error('RoleBasedAuthProvider: Error getting session:', error)
        setLoading(false)
        
        // If there's an error, redirect to root
        if (pathname !== "/") {
          router.push("/")
        }
      }
    }
    
    getSession()

    // Listen for auth state changes
    try {
      console.log('RoleBasedAuthProvider: Setting up auth listener...')
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('RoleBasedAuthProvider: Auth state change:', event, session ? 'User found' : 'No user')
        
        setUser(session?.user || null)
        
        if (event === "SIGNED_IN" && session?.user) {
          // Clear any stale signup data
          localStorage.removeItem('pendingSignup')
          
          try {
            // Get user info with role
            const userInfo = await RoleBasedAuthAPI.getCurrentUser()
            setUserInfo(userInfo)
            authState.setUser(userInfo)
            
            // Handle role-based routing after sign in
            if (userInfo) {
              const redirectPath = RouteProtection.getRedirectPath(userInfo)
              console.log('RoleBasedAuthProvider: Redirecting to:', redirectPath)
              router.push(redirectPath)
            } else {
              // No profile found, redirect to setup-complete
              console.log('RoleBasedAuthProvider: No profile found, redirecting to setup')
              router.push("/setup-complete")
            }
          } catch (error) {
            console.error('RoleBasedAuthProvider: Error handling sign in:', error)
            router.push("/setup-complete")
          }
        } else if (event === "SIGNED_OUT") {
          setUserInfo(null)
          authState.setUser(null)
          router.push("/")
        }
        
        setLoading(false)
      })

      return () => {
        console.log('RoleBasedAuthProvider: Cleaning up...')
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    } catch (error) {
      console.error('RoleBasedAuthProvider: Error setting up auth listener:', error)
      setLoading(false)
      clearTimeout(timeout)
    }
  }, [pathname, router]) // Include router in dependencies

  const value = {
    user,
    userInfo,
    loading,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useRoleBasedAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useRoleBasedAuth must be used within a RoleBasedAuthProvider')
  }
  return context
}
