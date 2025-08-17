"use client"

import { useRoleBasedAuth } from "@/components/auth/role-based-auth-provider"
import { LandingNav } from "@/components/landing-nav"
import { AppNav } from "@/components/app-nav"
import { LoadingScreen } from "@/components/ui/loading-spinner"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRoleBasedAuth()

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // Show app layout for authenticated users, landing layout for unauthenticated users
  return user ? (
    <AppNav>{children}</AppNav>
  ) : (
    <LandingNav>{children}</LandingNav>
  )
} 