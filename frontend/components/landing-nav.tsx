"use client"

import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

export function LandingNav({ children }: { children?: React.ReactNode }) {
  // Always show landing page layout for now
  return (
    <div className="min-h-screen w-full bg-gray-950">
      {/* Top navigation for landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-3">
            <div className="h-14 px-3 sm:px-4 flex items-center justify-between rounded-xl bg-gray-900/70 border border-gray-800 backdrop-blur-sm shadow-xl">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="text-white font-semibold text-lg font-['Geist']">Maqro</span>
                </Link>
              </div>

              {/* Center links intentionally removed for a cleaner, premium look */}

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full px-5 py-2 text-gray-200 hover:text-white font-medium transition-colors border border-white/15 hover:bg-white/10 backdrop-blur-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-full px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-0"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}
 