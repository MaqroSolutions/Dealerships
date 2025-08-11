"use client"

import { BarChart3, MessageSquare, Settings, LayoutTemplateIcon as Template, Home, Upload, Car } from 'lucide-react'
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

const salespersonItems = [
  {
    title: "Dashboard",
    url: "/demo/salesperson",
    icon: Home,
  },
  {
    title: "Conversations",
    url: "/demo/salesperson/conversations",
    icon: MessageSquare,
  },
  {
    title: "Inventory",
    url: "/demo/salesperson/inventory",
    icon: Car,
  },
  {
    title: "Upload Inventory",
    url: "/demo/salesperson/inventory/upload",
    icon: Upload,
  },
  {
    title: "Template Manager",
    url: "/demo/salesperson/templates",
    icon: Template,
  },
  {
    title: "Settings",
    url: "/demo/salesperson/settings",
    icon: Settings,
  },
];

export function DemoSalespersonSidebar() {
  const pathname = usePathname()

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
              {salespersonItems.map((item) => (
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