"use client"

import { useRoleBasedAuth } from "@/components/auth/role-based-auth-provider"
import { LandingNav } from "@/components/landing-nav"
import { AppNav } from "@/components/app-nav"
import { LoadingScreen } from "@/components/ui/loading-spinner"
import { usePathname } from "next/navigation"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useRoleBasedAuth()
  const pathname = usePathname()

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // Show app layout for authenticated users on admin/* routes or salesperson routes
  if (user && (pathname.startsWith("/admin/") || pathname.startsWith("/leads") || pathname.startsWith("/conversations") || pathname.startsWith("/inventory") || pathname.startsWith("/settings"))) {
    return <AppNav>{children}</AppNav>
  }

  // Default: landing layout for all other cases (unauthenticated users, root page, etc.)
  return <LandingNav>{children}</LandingNav>
} 