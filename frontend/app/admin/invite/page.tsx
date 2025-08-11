"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useAuth } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"

export default function InvitePage() {
  const { user, userRole } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    message: "You've been invited to join our dealership team on Maqro. Please sign up to get started!"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [invitedEmails, setInvitedEmails] = useState<string[]>([])

  // Role-based access check
  useEffect(() => {
    if (user && userRole !== 'admin') {
      // Redirect non-admin users to main dashboard
      router.push('/');
    }
  }, [user, userRole, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call the invite API
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          message: formData.message
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send invitation')
      }

      const result = await response.json()
      
      // Add to invited list
      setInvitedEmails(prev => [...prev, formData.email])
      
      // Reset form
      setFormData(prev => ({
        ...prev,
        email: "",
        name: ""
      }))
      
      toast.success(`Invitation sent to ${formData.email}`)
    } catch (error) {
      toast.error("Failed to send invitation")
      console.error("Invite error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Invite Salespeople</h1>
            <p className="text-gray-400 mt-2">Send invitations to new team members</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite Form */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Send Invitation</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="salesperson@dealership.com"
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="name" className="text-gray-300">Name (Optional)</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Smith"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-300">Custom Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Add a personal message..."
                    className="bg-gray-800 border-gray-700 text-white"
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Invites */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitedEmails.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-sm">
                    No invitations sent yet
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitedEmails.map((email, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-white text-sm">{email}</div>
                        <div className="text-gray-400 text-xs">Invitation sent</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Demo Notice */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-blue-300 text-sm mt-2">
              In production, this would send actual email invitations with signup links. 
              For the demo, invitations are simulated.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 