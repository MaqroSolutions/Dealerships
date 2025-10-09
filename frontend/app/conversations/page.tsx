"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { getLeadsWithConversations, type LeadWithConversationSummary } from "@/lib/conversations-api"

const statusColors = {
  new: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200 shadow-sm",
  warm: "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200 shadow-sm",
  hot: "bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border-red-200 shadow-sm",
  "follow-up": "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200 shadow-sm",
  cold: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 shadow-sm",
  "appointment_booked": "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-200 shadow-sm",
  "deal_won": "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 shadow-sm",
  "deal_lost": "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200 shadow-sm",
}

const statusDescriptions = {
  new: "Just contacted Lead within 1 day",
  warm: "Lead has just responded to the email",
  hot: "Lead is in a 3+ email thread with the agent",
  "follow-up": "Lead has not responded for 1-4 days",
  cold: "Lead has not responded for 4+ days",
  "appointment_booked": "Customer has scheduled an appointment",
  "deal_won": "Deal closed successfully",
  "deal_lost": "Deal was lost or customer went elsewhere",
}

export default function Conversations() {
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get("search") || ""
  
  const [conversations, setConversations] = useState<LeadWithConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch conversations on component mount
  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true)
        setError(null)
        console.log('Starting to fetch conversations...')
        const data = await getLeadsWithConversations()
        console.log('Fetched conversations data:', data)
        setConversations(data)
      } catch (err) {
        console.error('Error fetching conversations:', err)
        let errorMessage = 'Failed to fetch conversations'
        
        if (err instanceof Error) {
          if (err.message.includes('User not authenticated')) {
            errorMessage = 'You need to be logged in to view conversations'
          } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
            errorMessage = 'Unable to connect to the server. Please check if the backend is running on http://localhost:8000'
          } else {
            errorMessage = err.message
          }
        }
        
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Use useMemo to filter conversations based on search term
  const filteredConversations = useMemo(() => {
    if (searchTerm) {
      return conversations.filter(
        (conversation) =>
          conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (conversation.car_interest && conversation.car_interest.toLowerCase().includes(searchTerm.toLowerCase())) ||
          conversation.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
          conversation.status.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    return conversations
  }, [searchTerm, conversations])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-black">Conversations</h2>
            <p className="text-gray-700 text-lg">Manage your lead conversations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600 text-lg font-medium">Loading conversations...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-black">Conversations</h2>
            <p className="text-gray-700 text-lg">Manage your lead conversations</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-500 mb-2">Error loading conversations</h3>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black">Conversations</h2>
          <p className="text-gray-700 text-lg">Manage your lead conversations ({conversations.length} leads)</p>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredConversations.map((conversation, index) => (
          <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
            <Card
              className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg transition-all duration-200 hover:border-amber-300 cursor-pointer rounded-2xl"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-amber-100 border border-amber-200 rounded-full flex items-center justify-center">
                        <span className="text-amber-800 font-semibold">
                          {conversation.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-xs text-white font-medium">{conversation.unreadCount}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-black text-lg">{conversation.name}</h4>
                        <Badge
                          className={`${statusColors[conversation.status as keyof typeof statusColors]} text-sm font-medium px-3 py-1 rounded-full`}
                          title={statusDescriptions[conversation.status as keyof typeof statusDescriptions]}
                        >
                          {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                        </Badge>
                        {conversation.conversationCount > 0 && (
                          <span className="text-sm text-gray-600">
                            {conversation.conversationCount} message{conversation.conversationCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-1 font-medium">{conversation.car_interest}</p>
                      <p className="text-gray-700 text-sm">{conversation.lastMessage}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-sm">{conversation.lastMessageTime}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredConversations.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversations found</h3>
          <p className="text-gray-600">Try adjusting your search terms.</p>
        </div>
      )}
      
      {filteredConversations.length === 0 && !searchTerm && !loading && (
         <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No conversations yet</h3>
          <p className="text-gray-600">Start by creating some leads to see conversations here.</p>
        </div>
      )}
    </div>
  )
}
