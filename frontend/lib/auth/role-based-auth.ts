/**
 * Role-based authentication and authorization utilities
 * Centralized module for handling user roles and permissions
 */

import React from 'react'
import { supabase } from '../supabase'
import { getAuthenticatedApi } from '../api-client'

// Role hierarchy and permissions
export const ROLE_HIERARCHY = {
  salesperson: 1,
  manager: 2,
  owner: 3,
  admin: 3, // Alias for owner
} as const

export type UserRole = keyof typeof ROLE_HIERARCHY

export interface UserAuthInfo {
  id: string
  email: string
  role: UserRole
  dealership_id: string | null
  full_name: string
  isAdmin: boolean
  isOwner: boolean
  isManager: boolean
  isSalesperson: boolean
}

export interface InviteData {
  id: string
  email: string
  role_name: UserRole
  token: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

// Role checking utilities
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function isAdminRole(role: string): boolean {
  return role === 'owner' || role === 'admin' || role === 'manager'
}

export function isOwnerRole(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

export function normalizeRole(role: string): UserRole {
  if (role === 'admin') return 'owner'
  return role as UserRole
}

// Authentication state management
class AuthStateManager {
  private currentUser: UserAuthInfo | null = null
  private listeners: Set<(user: UserAuthInfo | null) => void> = new Set()

  setUser(user: UserAuthInfo | null) {
    this.currentUser = user
    this.notifyListeners()
  }

  getUser(): UserAuthInfo | null {
    return this.currentUser
  }

  subscribe(listener: (user: UserAuthInfo | null) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentUser))
  }
}

export const authState = new AuthStateManager()

// API functions for role-based operations
export class RoleBasedAuthAPI {
  /**
   * Get current user's authentication info with role
   */
  static async getCurrentUser(): Promise<UserAuthInfo | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      // Call the Next.js API route instead of backend API
      const response = await fetch('/api/user-profiles/me')
      
      if (!response.ok) {
        if (response.status === 404) {
          // User doesn't have a profile yet - this is normal during signup
          return null
        }
        throw new Error(`Failed to get user profile: ${response.status}`)
      }
      
      const profile = await response.json()
      const role = normalizeRole(profile.role || 'salesperson')
      
      return {
        id: user.id,
        email: user.email || '',
        role,
        dealership_id: profile.dealership_id,
        full_name: profile.full_name || '',
        isAdmin: isAdminRole(role),
        isOwner: isOwnerRole(role),
        isManager: role === 'manager',
        isSalesperson: role === 'salesperson',
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  /**
   * Create dealership and admin user
   */
  static async createDealershipAdmin(data: {
    email: string
    password: string
    full_name: string
    dealership_name: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { name: data.full_name }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user account')

      // Create dealership
      const api = await getAuthenticatedApi()
      const dealership = await api.post('/dealerships', {
        name: data.dealership_name,
        location: ''
      })

      // Create user profile
      await api.post('/user-profiles', {
        dealership_id: dealership.id,
        full_name: data.full_name,
        role: 'owner',
        timezone: 'America/New_York',
      })

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Accept invite and create user account
   */
  static async acceptInvite(data: {
    token: string
    full_name: string
    password: string
    phone?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invites/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to accept invite')
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Create invite for new team member
   */
  static async createInvite(data: {
    email: string
    role_name: UserRole
    expires_in_days?: number
  }): Promise<{ success: boolean; invite?: InviteData; error?: string }> {
    try {
      const api = await getAuthenticatedApi()
      const invite = await api.post('/invites', data)
      return { success: true, invite }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all invites for current dealership
   */
  static async getDealershipInvites(): Promise<InviteData[]> {
    try {
      const api = await getAuthenticatedApi()
      return await api.get('/invites')
    } catch (error) {
      console.error('Error fetching invites:', error)
      return []
    }
  }

  /**
   * Cancel an invite
   */
  static async cancelInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const api = await getAuthenticatedApi()
      await api.delete(`/invites/${inviteId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Route protection utilities
export class RouteProtection {
  /**
   * Get redirect path based on user role
   */
  static getRedirectPath(user: UserAuthInfo | null): string {
    if (!user) return '/login'
    
    if (user.isAdmin) {
      return '/admin/dashboard'
    } else {
      return '/app/leads'
    }
  }

  /**
   * Check if user can access admin routes
   */
  static canAccessAdmin(user: UserAuthInfo | null): boolean {
    return user?.isAdmin ?? false
  }

  /**
   * Check if user can access specific admin feature
   */
  static canAccessFeature(user: UserAuthInfo | null, requiredRole: UserRole): boolean {
    if (!user) return false
    return hasRoleLevel(user.role, requiredRole)
  }
}

// Hook for role-based authentication
export function useRoleBasedAuth() {
  const [user, setUser] = React.useState<UserAuthInfo | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      const userInfo = await RoleBasedAuthAPI.getCurrentUser()
      setUser(userInfo)
      authState.setUser(userInfo)
      setLoading(false)
    }

    loadUser()

    const unsubscribe = authState.subscribe(setUser)
    return unsubscribe
  }, [])

  return {
    user,
    loading,
    isAdmin: user?.isAdmin ?? false,
    isOwner: user?.isOwner ?? false,
    isManager: user?.isManager ?? false,
    isSalesperson: user?.isSalesperson ?? false,
    hasPermission: (requiredRole: UserRole) => user ? hasRoleLevel(user.role, requiredRole) : false,
  }
}
