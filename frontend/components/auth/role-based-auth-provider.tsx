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
    console.log('RoleBasedAuthProvider: Starting auth check...')
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('RoleBasedAuthProvider: Timeout reached, setting loading to false')
      setLoading(false)
    }, 2000)

    const getSession = async () => {
      try {
        console.log('RoleBasedAuthProvider: Getting session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('RoleBasedAuthProvider: Session result:', session ? 'User found' : 'No user')
        
        setUser(session?.user || null)
        
        if (session?.user) {
          // Get user info with role
          const userInfo = await RoleBasedAuthAPI.getCurrentUser()
          setUserInfo(userInfo)
          authState.setUser(userInfo)
        } else {
          setUserInfo(null)
          authState.setUser(null)
        }
        
        setLoading(false)
        
        // Define public routes that don't require authentication
        const publicRoutes = [
          "/login", 
          "/signup", 
          "/", 
          "/confirm-email",
          "/setup-complete"
        ];
        const isPublicRoute = publicRoutes.includes(pathname) || pathname.includes("/auth/");
        
        // Handle role-based routing
        if (session?.user && userInfo) {
          // Don't redirect if on setup-complete or confirm-email pages
          if (pathname === "/setup-complete" || pathname === "/confirm-email") {
            return;
          }
          
          const redirectPath = RouteProtection.getRedirectPath(userInfo)
          
          // Only redirect if user is on a page that doesn't match their role
          const shouldRedirect = (
            (userInfo.isAdmin && !pathname.startsWith('/admin/') && pathname !== '/admin/dashboard') ||
            (!userInfo.isAdmin && !pathname.startsWith('/app/') && pathname !== '/app/leads') ||
            pathname === '/'
          )
          
          if (shouldRedirect) {
            console.log(`RoleBasedAuthProvider: Redirecting ${userInfo.role} to ${redirectPath}`)
            router.push(redirectPath)
          }
        } else if (session?.user && !userInfo) {
          // User is authenticated but has no profile - needs to complete setup
          if (pathname !== "/setup-complete") {
            console.log('RoleBasedAuthProvider: No profile found, redirecting to setup-complete')
            router.push("/setup-complete")
          }
        } else if (!session?.user && !isPublicRoute) {
          console.log('RoleBasedAuthProvider: Redirecting to root')
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
  }, [pathname, router])

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
