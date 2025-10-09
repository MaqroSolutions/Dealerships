import { Zap, Target, BarChart3, ShieldCheck, Sparkles, Building2, Clock, Lock, Zap as ZapIcon } from "lucide-react"

const features = [
  {
    icon: Building2,
    title: "CRM-Friendly by Design",
    description: "Seamlessly sits on top of your CRM so your team doesn't change workflows. Your CRM stays the system of record."
  },
  {
    icon: Clock,
    title: "AI Speed-to-Lead",
    description: "Responds to new leads in under two minutes with human-like, inventory-aware messages that keep customers engaged."
  },
  {
    icon: Lock,
    title: "Security & Compliance",
    description: "Your data stays yours — never used to train external models. Fully encrypted and built for dealer compliance."
  },
  {
    icon: ZapIcon,
    title: "Enterprise Reliability",
    description: "From single rooftops to dealer groups, Maqro scales with you. Always on, always accurate, and built for trust."
  }
]

export function FeatureList() {
  return (
    <div className="py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-[80%] rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -bottom-24 right-1/2 -translate-x-1/2 h-64 w-[80%] rounded-full bg-amber-500/10 blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 tracking-[-0.02em] leading-tight font-['Geist']">
            Why Dealerships Choose Maqro
          </h2>
          <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-['Geist'] font-light">
            Stop losing leads to slow responses. Start closing deals faster.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 sm:p-10 rounded-2xl border border-amber-200 bg-white/90 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-orange-300 flex flex-col items-center text-center h-full relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10 w-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-amber-600/20 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-amber-200">
                  <feature.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight font-['Geist']">
                  {feature.title}
                </h3>
                <p className="text-base text-gray-700 leading-relaxed font-['Geist'] font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 