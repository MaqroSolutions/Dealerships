import Link from "next/link"

export function Footer() {
  return (
    <footer className="relative mt-14 sm:mt-16 border-t border-white/10/0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="text-gray-300 text-sm">© 2024 Maqro. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-gray-200 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-gray-200 transition-colors">
              Terms
            </Link>
            <a href="mailto:hello@maqro.ai" className="text-gray-400 hover:text-gray-200 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}