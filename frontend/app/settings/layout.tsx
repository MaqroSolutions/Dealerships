"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { User, Settings, Brain } from "lucide-react"

const settingsNavigation = [
  {
    name: "Profile",
    href: "/settings",
    icon: User,
    description: "Manage your personal information and preferences"
  },
  {
    name: "Account",
    href: "/settings/account", 
    icon: Settings,
    description: "Configure timezone, business hours, and application settings"
  },
  {
    name: "AI Settings",
    href: "/settings/ai",
    icon: Brain,
    description: "Customize AI behavior and responses"
  }
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="w-full max-w-none space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-100">Settings</h2>
        <p className="text-gray-400 mt-2">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900/50 border-gray-800 p-1">
            <nav className="space-y-1">
              {settingsNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:text-gray-100 hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <div className="flex flex-col">
                      <span>{item.name}</span>
                      <span className={cn(
                        "text-xs",
                        isActive ? "text-blue-100" : "text-gray-500"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  )
}