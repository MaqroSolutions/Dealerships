import { PremiumSpinner } from "@/components/ui/premium-spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-md">
        <div className="flex flex-col items-center space-y-4">
          <PremiumSpinner size="lg" />
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Conversations...</h2>
            <p className="text-gray-700">Please wait while we load your conversations</p>
          </div>
        </div>
      </div>
    </div>
  )
}
