"use client"

import { MessageSquare, Settings, LayoutTemplateIcon as Template, Home, Upload, Car, Users, Building2, CreditCard } from 'lucide-react'
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
    title: "Home",
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
    <Sidebar className="border-r border-gray-300 bg-[#f2f1ef]" style={{ backgroundColor: '#f2f1ef' }}>
      <SidebarHeader className="p-6 bg-[#f2f1ef]" style={{ backgroundColor: '#f2f1ef' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold text-black">Maqro</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#f2f1ef] px-4" style={{ backgroundColor: '#f2f1ef' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="text-gray-700 hover:text-black hover:bg-[#e5e4e2] transition-all duration-200 data-[active=true]:bg-[#e5e4e2] data-[active=true]:text-black data-[active=true]:shadow-sm rounded-xl w-full"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-medium">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
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
