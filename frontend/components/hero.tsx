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
        {/* Background effects - gradient provided by parent wrapper */}
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)] bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(251,146,60,0.15),transparent),radial-gradient(800px_600px_at_90%_20%,rgba(245,158,11,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,146,60,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-sm font-medium mb-8 shadow-sm">
                <Sparkles className="w-4 h-4" />
                AI-Powered Lead Management
              </div>
              
              {/* Main headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight tracking-[-0.01em] font-geist">
                Never lose a lead again.
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-700 mb-8 sm:mb-10 leading-relaxed font-geist">
              Meet the next generation of dealership software. AI-native, seamless from day one, and built for sales teams.
              </p>

              {/* CTAs */}
              <div className="flex items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-8">
                <a
                  href="/signup"
                  className="group inline-flex items-center justify-center rounded-xl px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60"
                >
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <button
                  onClick={() => {
                    setShowCalEmbed(true)
                    setIsCalendarLoading(true)
                  }}
                  className="inline-flex items-center rounded-xl px-6 sm:px-8 py-3 border border-amber-200 text-gray-700 hover:bg-amber-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30"
                >
                  Book a demo
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Setup in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Free 14-day trial</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Dashboard mockup */}
            <div className="relative">
              <div className="relative bg-white/90 backdrop-blur-sm border border-amber-200 rounded-2xl p-6 shadow-2xl">
                {/* Mockup header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="text-gray-900 font-semibold text-lg font-['Geist']">Maqro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 text-sm">Live</span>
                  </div>
                </div>
                
                {/* Mockup content */}
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-orange-500" />
                        <span className="text-xs text-gray-600">Leads Today</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">24</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-gray-600">Conversions</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">8</div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-gray-600">Team Active</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">12</div>
                    </div>
                  </div>
                  
                  {/* Recent activity */}
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <h4 className="text-gray-900 font-semibold mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700">Agent responded to John D. - 2 min ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700">Lead converted - Sarah M. - 5 min ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-gray-700">New lead assigned - Mike R. - 8 min ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-3 h-3 bg-orange-400 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-2 h-2 bg-amber-400 rounded-full opacity-40 animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
        
        {/* Orbital accents */}
        <div className="absolute -z-10 -top-24 -left-24 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -z-10 -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
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
          
          <div className="relative w-full max-w-5xl h-[600px] bg-white rounded-2xl border border-amber-200 shadow-2xl overflow-hidden">
            {/* Loading State */}
            {isCalendarLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-amber-50 z-10">
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