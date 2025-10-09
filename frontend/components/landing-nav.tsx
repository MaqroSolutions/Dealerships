"use client"

import Link from "next/link"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"

export function LandingNav({ children }: { children?: React.ReactNode }) {
  // Always show landing page layout for now
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Top navigation for landing page */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-3">
            <div className="h-14 px-3 sm:px-4 flex items-center justify-between rounded-xl bg-white/90 border border-amber-200 backdrop-blur-sm shadow-lg">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <span className="text-gray-900 font-semibold text-lg font-['Geist']">Maqro</span>
                </Link>
              </div>

              {/* Center links intentionally removed for a cleaner, premium look */}

              {/* Navigation buttons */}
              <div className="flex items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-xl px-5 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors border border-amber-200 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/30 focus-visible:ring-offset-0"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-xl px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-0"
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
 