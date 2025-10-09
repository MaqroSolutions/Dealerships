"use client"

import { useState, useEffect } from "react"
import { Search, Bell, User, LogOut } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useRoleBasedAuth } from "@/components/auth/role-based-auth-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const pageNames: Record<string, string> = {
  "/": "Home",
  "/conversations": "Conversations",
  "/templates": "Template Manager",
  "/settings": "Settings",
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const pageName = pageNames[pathname] || "Home"
  const { user, signOut, loading } = useRoleBasedAuth()

  // Initialize search term from URL params
  useEffect(() => {
    const search = searchParams.get("search")
    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  const handleSearch = (value: string) => {
    setSearchTerm(value)

    // Update URL with search parameter
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("search", value)
    } else {
      params.delete("search")
    }

    // Update the URL without causing a page reload
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }

  const getSearchPlaceholder = () => {
    switch (pathname) {
      case "/conversations":
        return "Search conversations..."
      case "/":
        return "Search leads, conversations..."
      default:
        return "Search..."
    }
  }

  // Show search bar only on Dashboard and Conversations pages (removed /templates)
  const showSearchBar = pathname === "/" || pathname === "/conversations"

  return (
    <header className="border-b border-amber-200 bg-white min-w-0 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 min-w-0">
        <div>
          <h1 className="text-2xl font-bold text-black">{pageName}</h1>
        </div>

        <div className="flex items-center gap-4">
          {showSearchBar && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 w-80 bg-white/90 border-gray-300 text-black placeholder-gray-500 focus:border-amber-400 focus:ring-amber-200 transition-all duration-200 rounded-xl h-10"
              />
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-black hover:bg-amber-50 transition-all duration-200 rounded-xl"
          >
            <Bell className="w-5 h-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 hover:text-black hover:bg-amber-50 transition-all duration-200 rounded-xl"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mr-2 bg-white/95 backdrop-blur-sm border-amber-200 text-black shadow-lg rounded-xl">
              <DropdownMenuLabel className="text-gray-700">
                {loading ? 'Loading...' : user?.email || 'My Account'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-amber-200" />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer hover:bg-amber-50 text-gray-700">
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem 
                className="cursor-pointer hover:bg-red-50 text-red-600"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
