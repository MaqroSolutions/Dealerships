"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Brain, MessageSquare, Zap, Clock } from "lucide-react"
import { getMultipleSettings, updateUserSetting } from "@/lib/settings-api"
import { toast } from "sonner"

export default function AISettings() {
  const [settings, setSettings] = useState({
    ai_persona: "professional",
    ai_dealership_name: "our dealership",
    auto_respond_enabled: true,
    auto_respond_frequency: "medium",
    follow_up_enabled: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await getMultipleSettings([
          'ai_persona',
          'ai_dealership_name',
          'auto_respond_enabled',
          'auto_respond_frequency',
          'follow_up_enabled'
        ])
        
        setSettings({
          ai_persona: settingsData.ai_persona || "professional",
          ai_dealership_name: settingsData.ai_dealership_name || "our dealership",
          auto_respond_enabled: settingsData.auto_respond_enabled ?? true,
          auto_respond_frequency: settingsData.auto_respond_frequency || "medium",
          follow_up_enabled: settingsData.follow_up_enabled ?? false,
        })
      } catch (error) {
        console.error('Error loading AI settings:', error)
        toast.error('Failed to load AI settings')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Save individual setting
  const saveSetting = async (key: string, value: any) => {
    setSaving(key)
    try {
      await updateUserSetting(key, value)
      toast.success(`${key.replace('_', ' ').replace('ai ', 'AI ')} updated successfully`)
    } catch (error: any) {
      console.error(`Error updating ${key}:`, error)
      toast.error(error.message || `Failed to update ${key}`)
    } finally {
      setSaving(null)
    }
  }

  const getPersonaDescription = (persona: string) => {
    switch (persona) {
      case 'friendly':
        return 'Enthusiastic and warm, uses casual language and emojis'
      case 'professional':
        return 'Knowledgeable and courteous, maintains professional tone'
      case 'casual':
        return 'Relaxed and approachable, uses conversational language'
      default:
        return ''
    }
  }

  const getFrequencyDescription = (frequency: string) => {
    switch (frequency) {
      case 'low':
        return 'Responds only to direct questions and high-priority inquiries'
      case 'medium':
        return 'Responds to most relevant customer messages'
      case 'high':
        return 'Responds to almost all customer interactions'
      case 'send_all':
        return 'Responds to every customer message immediately'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-800 rounded-lg"></div>
          <div className="h-32 bg-gray-800 rounded-lg"></div>
          <div className="h-48 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* AI Personality Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Brain className="w-5 h-5" />
            AI Personality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300">AI Persona</Label>
            <Select 
              value={settings.ai_persona} 
              onValueChange={(value) => setSettings({ ...settings, ai_persona: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-400">{getPersonaDescription(settings.ai_persona)}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Dealership Name</Label>
            <Input
              value={settings.ai_dealership_name || ""}
              onChange={(e) => setSettings({ ...settings, ai_dealership_name: e.target.value })}
              placeholder="How AI should refer to your dealership"
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
            <p className="text-sm text-gray-400">How the AI refers to your dealership in conversations</p>
          </div>


          <Button 
            onClick={async () => {
              setSaving('ai_personality')
              try {
                await Promise.all([
                  saveSetting('ai_persona', settings.ai_persona),
                  saveSetting('ai_dealership_name', settings.ai_dealership_name)
                ])
                toast.success('AI personality settings saved successfully')
              } catch (error) {
                // Individual errors are already handled by saveSetting
              } finally {
                setSaving(null)
              }
            }}
            disabled={saving === 'ai_personality'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'ai_personality' ? 'Saving...' : 'Save AI Personality'}
          </Button>
        </CardContent>
      </Card>

      {/* Auto Response Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <MessageSquare className="w-5 h-5" />
            Auto Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-gray-300">Enable Auto Response</Label>
              <p className="text-sm text-gray-400">Automatically respond to customer messages</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.auto_respond_enabled ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Disabled</Badge>
              )}
              <Switch
                checked={settings.auto_respond_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_respond_enabled: checked })}
              />
            </div>
          </div>

          {settings.auto_respond_enabled && (
            <div className="space-y-2">
              <Label className="text-gray-300">Response Frequency</Label>
              <Select 
                value={settings.auto_respond_frequency} 
                onValueChange={(value) => setSettings({ ...settings, auto_respond_frequency: value })}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="send_all">Send All</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-400">{getFrequencyDescription(settings.auto_respond_frequency)}</p>
            </div>
          )}

          <Button 
            onClick={async () => {
              setSaving('auto_response')
              try {
                const settingsToSave = [
                  saveSetting('auto_respond_enabled', settings.auto_respond_enabled)
                ]
                
                // Only save frequency if auto response is enabled
                if (settings.auto_respond_enabled) {
                  settingsToSave.push(saveSetting('auto_respond_frequency', settings.auto_respond_frequency))
                }
                
                await Promise.all(settingsToSave)
                toast.success('Auto response settings saved successfully')
              } catch (error) {
                // Individual errors are already handled by saveSetting
              } finally {
                setSaving(null)
              }
            }}
            disabled={saving === 'auto_response'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'auto_response' ? 'Saving...' : 'Save Auto Response Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Follow-up Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Clock className="w-5 h-5" />
            Follow-up Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-gray-300">Enable Follow-ups</Label>
              <p className="text-sm text-gray-400">Automatically send follow-up messages to leads</p>
            </div>
            <div className="flex items-center gap-3">
              {settings.follow_up_enabled ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Enabled</Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Disabled</Badge>
              )}
              <Switch
                checked={settings.follow_up_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, follow_up_enabled: checked })}
              />
            </div>
          </div>

          {settings.follow_up_enabled && (
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">
                📅 Advanced follow-up timing and frequency controls will be available in a future update. 
                For now, enabling this will use default follow-up intervals.
              </p>
            </div>
          )}

          <Button 
            onClick={() => saveSetting('follow_up_enabled', settings.follow_up_enabled)}
            disabled={saving === 'follow_up_enabled'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'follow_up_enabled' ? 'Saving...' : 'Save Follow-up Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}