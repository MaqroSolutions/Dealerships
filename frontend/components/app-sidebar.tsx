"use client"

import { BarChart3, MessageSquare, Settings, LayoutTemplateIcon as Template, Home, Upload, Car, Users, Building2, TrendingUp, CreditCard } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUserRole } from "@/hooks/use-user-role"

const adminItems = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Team Management",
    url: "/admin/team",
    icon: Users,
  },
  {
    title: "Inventory",
    url: "/admin/inventory",
    icon: Car,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: TrendingUp,
  },
  {
    title: "Billing",
    url: "/admin/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

const salespersonItems = [
  {
    title: "My Leads",
    url: "/leads",
    icon: MessageSquare,
  },
  {
    title: "Conversations",
    url: "/conversations",
    icon: MessageSquare,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Car,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { role, loading } = useUserRole()

  // Determine which items to show based on user role
  const getItems = () => {
    if (loading) return []
    
    if (role === 'owner' || role === 'manager') {
      return adminItems
    } else {
      return salespersonItems
    }
  }

  const items = getItems()

  return (
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-semibold text-gray-100">Maqro</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="text-gray-100 hover:text-white hover:bg-gray-800/50 transition-all duration-200 data-[active=true]:bg-gray-800 data-[active=true]:text-white"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2 text-gray-100">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
