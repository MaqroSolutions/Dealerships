"use client"

import { useState, useEffect, use, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Bot, User } from "lucide-react"
import Link from "next/link"
import { getMyLeadById } from "@/lib/leads-api"
import { getConversations, addMessage } from "@/lib/conversations-api"
import type { Lead, Conversation } from "@/lib/supabase"
import { PremiumSpinner } from "@/components/ui/premium-spinner"

const statusColors = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  warm: "bg-orange-100 text-orange-700 border-orange-200",
  hot: "bg-red-100 text-red-700 border-red-200",
  "follow-up": "bg-yellow-100 text-yellow-700 border-yellow-200",
  cold: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function ConversationDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [leadData, setLeadData] = useState<Lead | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [messageList, setMessageList] = useState<Conversation[]>([])
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchData() {
      const lead = await getMyLeadById(resolvedParams.id)
      setLeadData(lead)
      const conversations = await getConversations(resolvedParams.id)
      setMessageList(conversations)
    }
    fetchData()
  }, [resolvedParams.id])

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const conversations = await getConversations(resolvedParams.id)
      setMessageList(conversations)
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [resolvedParams.id])

  // Scroll to bottom on initial load and new messages  
  useEffect(() => {
    if (messagesContainerRef.current && messageList.length > 0) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messageList])

  const handleSendMessage = async () => {
    if (!customMessage.trim() || !leadData) return
    setSending(true)
    setSendError(null)
    setSendSuccess(false)
    
    const messageToSend = customMessage.trim()
    
    try {
      const newMessage = await addMessage(leadData.id, messageToSend)
      setSendSuccess(true)
      setMessageList((prev) => [...prev, newMessage])
      setCustomMessage("")
    } catch (err) {
      setSendError("Failed to send message")
    } finally {
      setSending(false)
    }
  }


  if (!leadData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <PremiumSpinner size="lg" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-700">Please wait while we load the conversation</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/conversations">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 hover:bg-amber-50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{leadData.name}</h2>
            <Badge className={`${statusColors[leadData.status as keyof typeof statusColors]} border`}>
              {leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-gray-600 text-sm">
            <span>{leadData.car_interest}</span>
            <span>•</span>
            <span>{leadData.phone}</span>
            <span>•</span>
            <span>{leadData.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md h-[600px] flex flex-col">
            <CardHeader className="border-b border-amber-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-900">Conversation</h3>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <div className="h-full flex flex-col">
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
                  {messageList.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "customer" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          message.sender === "customer"
                            ? "bg-gray-100 text-gray-900 border border-gray-200"
                            : "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                        } rounded-xl p-4 shadow-sm`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {message.sender === "customer" ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {message.sender === "customer"
                              ? leadData.name
                              : "Agent"}
                          </span>
                          <span className="text-xs opacity-70">{new Date(message.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-sm">{message.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-amber-200 p-4 flex-shrink-0">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="flex-1 bg-white/90 border-amber-200 text-gray-900 placeholder-gray-500 resize-none rounded-xl focus:border-orange-400 focus:ring-orange-200"
                      rows={2}
                      disabled={sending}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={sending || !customMessage.trim()}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white self-end rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      {sending ? <PremiumSpinner size="sm" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                  {sendSuccess && (
                    <p className="text-green-600 text-sm mt-2">Message sent successfully!</p>
                  )}
                  {sendError && (
                    <p className="text-red-600 text-sm mt-2">{sendError}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 rounded-2xl shadow-md">
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Lead Information</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Status</label>
                <Badge className={`${statusColors[leadData.status as keyof typeof statusColors]} border`}>
                  {leadData.status.charAt(0).toUpperCase() + leadData.status.slice(1)}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-600">Vehicle Interest</label>
                <p className="text-gray-900 font-medium">{leadData.car_interest}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <p className="text-gray-900">{leadData.phone}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <p className="text-gray-900">{leadData.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
