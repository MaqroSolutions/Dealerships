import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ClientAuthWrapper } from "@/components/auth/client-auth-wrapper"
import { ConditionalLayoutWrapper } from "@/components/conditional-layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maqro - AI That Closes Your Leads Before Your Competition Does",
  description: "Automated, personalized lead responses for dealerships and sales teams."
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <ClientAuthWrapper>
            <ConditionalLayoutWrapper>
              {children}
            </ConditionalLayoutWrapper>
          </ClientAuthWrapper>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
