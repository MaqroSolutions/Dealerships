"use client"

import { ArrowRight, X, TrendingUp, Users, MessageSquare, Clock, CheckCircle, Sparkles } from "lucide-react"
import { PremiumSpinner } from "./ui/premium-spinner"
import { useState } from "react"

export function Hero() {
  const [showCalEmbed, setShowCalEmbed] = useState(false)
  const [isCalendarLoading, setIsCalendarLoading] = useState(true)

  const handleCalendarLoad = () => {
    setIsCalendarLoading(false)
  }

  return (
    <>
      <div className="relative min-h-[80vh] sm:min-h-[85vh] flex items-start justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-24 sm:pt-32">
        {/* Background gradient + subtle grid */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950 to-gray-950">
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(59,130,246,0.15),transparent),radial-gradient(800px_600px_at_90%_20%,rgba(168,85,247,0.12),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4" />
                AI-Powered Lead Management
              </div>
              
              {/* Main headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight tracking-[-0.01em] font-geist">
                Never lose a lead again.
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-300/90 mb-8 sm:mb-10 leading-relaxed font-geist">
              Meet the next generation of dealership software. AI-native, seamless from day one, and built for sales teams.
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-8">
                <a
                  href="/signup"
                  className="group inline-flex items-center justify-center rounded-full px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <button
                  onClick={() => {
                    setShowCalEmbed(true)
                    setIsCalendarLoading(true)
                  }}
                  className="inline-flex items-center rounded-full px-6 sm:px-8 py-3 border border-white/15 text-white/90 hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Book a demo
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Free 14-day trial</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Dashboard mockup */}
            <div className="relative">
              <div className="relative bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
                {/* Mockup header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="text-white font-semibold text-lg font-['Geist']">Maqro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-emerald-400 text-sm">Live</span>
                  </div>
                </div>
                
                {/* Mockup content */}
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-400">Leads Today</span>
                      </div>
                      <div className="text-2xl font-bold text-white">24</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-gray-400">Conversions</span>
                      </div>
                      <div className="text-2xl font-bold text-white">8</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Team Active</span>
                      </div>
                      <div className="text-2xl font-bold text-white">12</div>
                    </div>
                  </div>
                  
                  {/* Recent activity */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-300">Agent responded to John D. - 2 min ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">Lead converted - Sarah M. - 5 min ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span className="text-gray-300">New lead assigned - Mike R. - 8 min ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-purple-400 rounded-full opacity-40 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
        
        {/* Orbital accents */}
        <div className="absolute -z-10 -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -z-10 -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Cal.com Embed Modal */}
      {showCalEmbed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          {/* Simple Close Button - Top Right Corner */}
          <button
            onClick={() => setShowCalEmbed(false)}
            className="fixed top-6 right-6 z-60 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-5xl h-[600px] bg-gray-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Loading State */}
            {isCalendarLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#171717] z-10">
                <PremiumSpinner size="xl" text="Loading calendar..." />
              </div>
            )}
            
            {/* Cal.com Embed */}
            <div className="h-full">
              <iframe
                src="https://cal.com/aryan-mundre?embed=true"
                width="100%"
                height="100%"
                frameBorder="0"
                className="bg-transparent"
                title="Book a demo with Maqro"
                onLoad={handleCalendarLoad}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
} 