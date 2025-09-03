import React from 'react'

interface PremiumSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
}

export function PremiumSpinner({ size = 'md', text, className = '' }: PremiumSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const ringSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative mb-4">
        {/* Outer ring with gradient */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 animate-pulse`}></div>
        {/* Main spinner ring */}
        <div className={`absolute inset-2 ${ringSizeClasses[size]} border-4 border-white/10 rounded-full`}></div>
        {/* Animated spinner with gradient */}
        <div className={`absolute inset-2 ${ringSizeClasses[size]} border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin`}></div>
      </div>
      {text && (
        <p className={`text-white font-medium tracking-wide ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  )
}
