'use client'

import React from 'react'
import { RoleBasedAuthProvider } from './role-based-auth-provider'

interface ClientAuthWrapperProps {
  children: React.ReactNode
}

export function ClientAuthWrapper({ children }: ClientAuthWrapperProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering auth provider until mounted
  if (!mounted) {
    return <>{children}</>
  }

  return <RoleBasedAuthProvider>{children}</RoleBasedAuthProvider>
}
