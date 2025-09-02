import { Zap, Target, BarChart3, ShieldCheck, Sparkles } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Respond instantly with AI",
    description: "Automated responses that feel personal and human"
  },
  {
    icon: Target,
    title: "Prioritize high-value leads",
    description: "AI identifies your best opportunities automatically"
  },
  {
    icon: BarChart3,
    title: "Track team performance in real time",
    description: "Monitor conversions and optimize your sales process"
  },
  {
    icon: ShieldCheck,
    title: "Compliant by design",
    description: "Audit trails, opt-outs, and permissioning that scale with you"
  }
]

export function FeatureList() {
  return (
    <div className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-transparent relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Why Dealerships Choose Maqro
          </h2>
          <p className="text-lg sm:text-xl text-gray-300/90 max-w-2xl mx-auto">
            Stop losing leads to slow responses. Start closing deals faster.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.05] transform-gpu hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm sm:text-base text-gray-300/90 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 