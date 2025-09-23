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
          '/reset-password'
        ]
        const isPublicRoute = publicRoutes.includes(pathname) || pathname.includes("/auth/")
        
        if (session?.user) {
          // Always get fresh user info to ensure we have the latest role
          try {
            console.log('RoleBasedAuthProvider: Getting user info for authenticated user...', session.user.id)
            const userInfoResult = await RoleBasedAuthAPI.getCurrentUser()
            console.log('RoleBasedAuthProvider: User info result:', userInfoResult)
            
            if (userInfoResult) {
              setUserInfo(userInfoResult)
              authState.setUser(userInfoResult)
              
              // Now handle routing with the fresh user info
              const userRole = userInfoResult.role;
              console.log('RoleBasedAuthProvider: User role detected:', userRole, 'on path:', pathname, 'isPublicRoute:', isPublicRoute);
              
              // Role-based routing logic - always check for redirects
              if (userRole === 'owner' || userRole === 'manager') {
                // Admin users should go to admin dashboard
                if (pathname === "/" || pathname.startsWith("/app/")) {
                  console.log('RoleBasedAuthProvider: Redirecting admin user to admin dashboard');
                  router.push("/admin/dashboard");
                  return;
                }
              } else if (userRole === 'salesperson') {
                // Salesperson users should go to leads page  
                if (pathname === "/" || pathname.startsWith("/admin/")) {
                  console.log('RoleBasedAuthProvider: Redirecting salesperson to leads dashboard');
                  router.push("/leads");
                  return;
                }
              }
            } else {
              console.log('RoleBasedAuthProvider: No user profile found, user may need to complete setup')
              setUserInfo(null)
              authState.setUser(null)
              // User doesn't have a profile, redirect to setup
              if (pathname !== "/setup-complete" && !isPublicRoute) {
                setTimeout(() => router.push("/setup-complete"), 100);
                return;
              }
            }
          } catch (error) {
            console.error('RoleBasedAuthProvider: Error getting user info:', error)
            setUserInfo(null)
            authState.setUser(null)
            // If there's an error getting profile, redirect to setup
            if (pathname !== "/setup-complete" && !isPublicRoute) {
              setTimeout(() => router.push("/setup-complete"), 100);
              return;
            }
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
          // Check for pending signup data first
          const pendingSignup = localStorage.getItem('pendingSignup')
          if (pendingSignup) {
            // User just signed up, redirect to setup-complete
            router.push("/setup-complete")
            setLoading(false)
            return
          }
          
          // Get user info with role
          const userInfo = await RoleBasedAuthAPI.getCurrentUser()
          setUserInfo(userInfo)
          authState.setUser(userInfo)
          
          // Handle role-based routing after sign in
          if (userInfo) {
            const redirectPath = RouteProtection.getRedirectPath(userInfo)
            if (pathname === "/login" || pathname === "/signup") {
              router.push(redirectPath)
            }
          } else {
            // No profile found, redirect to setup-complete
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
