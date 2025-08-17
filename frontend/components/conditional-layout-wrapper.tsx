'use client'

import React from 'react'
import { ConditionalLayout } from './conditional-layout'
import { LoadingScreen } from './ui/loading-spinner'

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
    return <LoadingScreen />
  }

  return <ConditionalLayout>{children}</ConditionalLayout>
}
