'use client'

import React from 'react'
import { ConditionalLayout } from './conditional-layout'
import { PremiumSpinner } from './ui/premium-spinner'

interface ConditionalLayoutWrapperProps {
  children: React.ReactNode
}

export function ConditionalLayoutWrapper({ children }: ConditionalLayoutWrapperProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading screen during hydration to prevent mismatches
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <PremiumSpinner size="xl" text="Loading..." />
      </div>
    )
  }

  return <ConditionalLayout>{children}</ConditionalLayout>
}
