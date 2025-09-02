import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative mt-14 sm:mt-16 border-t border-white/10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-16 w-[60%] rounded-full bg-white/[0.03] blur-2xl" />
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="text-left">
              <span className="text-gray-300 text-sm font-medium">Maqro. © 2025 </span>
              <div className="text-gray-400 text-xs">All rights reserved</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}