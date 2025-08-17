import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { getMyProfile } from '@/lib/user-profile-api'
import type { UserProfile } from '@/lib/supabase'

export interface UserRoleInfo {
  role: string
  dealership_id: string | null
  full_name: string
  loading: boolean
  error: string | null
}

export function useUserRole(): UserRoleInfo {
  const { user } = useAuth()
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo>({
    role: '',
    dealership_id: null,
    full_name: '',
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setRoleInfo({
        role: '',
        dealership_id: null,
        full_name: '',
        loading: false,
        error: null
      })
      return
    }

    const fetchUserRole = async () => {
      try {
        setRoleInfo(prev => ({ ...prev, loading: true, error: null }))
        
        const profile = await getMyProfile()
        
        // Map old role names to new ones for consistency
        let role = profile.role || ''
        if (role === 'admin') {
          role = 'owner'
        }
        
        setRoleInfo({
          role: role,
          dealership_id: profile.dealership_id,
          full_name: profile.full_name || '',
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRoleInfo({
          role: '',
          dealership_id: null,
          full_name: '',
          loading: false,
          error: 'Failed to load user role'
        })
      }
    }

    fetchUserRole()
  }, [user])

  return roleInfo
}

export function useIsAdmin(): boolean {
  const { role } = useUserRole()
  return role === 'owner' || role === 'manager'
}

export function useIsOwner(): boolean {
  const { role } = useUserRole()
  return role === 'owner'
}
