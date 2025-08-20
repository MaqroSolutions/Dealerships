import { useRoleBasedAuth } from '@/components/auth/role-based-auth-provider'

export interface UserRoleInfo {
  role: string
  dealership_id: string | null
  full_name: string
  loading: boolean
  error: string | null
}

export function useUserRole(): UserRoleInfo {
  const { userInfo, loading } = useRoleBasedAuth()

  if (loading || !userInfo) {
    return {
      role: '',
      dealership_id: null,
      full_name: '',
      loading: true,
      error: null
    }
  }

  // Map old role names to new ones for consistency
  let role = userInfo.role || ''
  if (role === 'admin') {
    role = 'owner'
  }

  return {
    role: role,
    dealership_id: userInfo.dealership_id,
    full_name: userInfo.full_name || '',
    loading: false,
    error: null
  }
}

export function useIsAdmin(): boolean {
  const { role } = useUserRole()
  return role === 'owner' || role === 'manager'
}

export function useIsOwner(): boolean {
  const { role } = useUserRole()
  return role === 'owner'
}
