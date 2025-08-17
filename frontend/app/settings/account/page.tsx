"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Clock, Globe, Layout } from "lucide-react"
import { getMultipleSettings, updateUserSetting } from "@/lib/settings-api"
import { toast } from "sonner"

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' }
]

export default function AccountSettings() {
  const [settings, setSettings] = useState({
    timezone: "America/New_York",
    business_hours: {} as Record<string, Array<[string, string]>>,
    dashboard_leads_per_page: 25,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Load settings from API
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settingsData = await getMultipleSettings([
          'timezone',
          'business_hours', 
          'dashboard_leads_per_page'
        ])
        
        setSettings({
          timezone: settingsData.timezone || "America/New_York",
          business_hours: settingsData.business_hours || {
            mon: [["09:00", "18:00"]],
            tue: [["09:00", "18:00"]],
            wed: [["09:00", "18:00"]],
            thu: [["09:00", "18:00"]],
            fri: [["09:00", "18:00"]],
            sat: [["09:00", "17:00"]],
            sun: []
          },
          dashboard_leads_per_page: settingsData.dashboard_leads_per_page || 25,
        })
      } catch (error) {
        console.error('Error loading settings:', error)
        toast.error('Failed to load account settings')
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
      toast.success(`${key.replace('_', ' ')} updated successfully`)
    } catch (error: any) {
      console.error(`Error updating ${key}:`, error)
      toast.error(error.message || `Failed to update ${key}`)
    } finally {
      setSaving(null)
    }
  }

  // Update business hours for a specific day
  const updateBusinessHours = (day: string, isOpen: boolean, openTime?: string, closeTime?: string) => {
    const newHours = { ...settings.business_hours }
    
    if (!isOpen) {
      newHours[day] = []
    } else {
      const currentHours = newHours[day] || [["09:00", "18:00"]]
      newHours[day] = [[
        openTime || currentHours[0]?.[0] || "09:00",
        closeTime || currentHours[0]?.[1] || "18:00"
      ]]
    }
    
    setSettings({ ...settings, business_hours: newHours })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-800 rounded-lg"></div>
          <div className="h-64 bg-gray-800 rounded-lg"></div>
          <div className="h-32 bg-gray-800 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Timezone Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Globe className="w-5 h-5" />
            Timezone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Select your timezone</Label>
            <Select 
              value={settings.timezone} 
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Phoenix">Arizona Time (MST)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time (AKST)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time (HST)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => saveSetting('timezone', settings.timezone)}
            disabled={saving === 'timezone'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'timezone' ? 'Saving...' : 'Save Timezone'}
          </Button>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Clock className="w-5 h-5" />
            Business Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {DAYS.map((day) => {
              const dayHours = settings.business_hours[day.key] || []
              const isOpen = dayHours.length > 0
              const openTime = isOpen ? dayHours[0]?.[0] || "09:00" : "09:00"
              const closeTime = isOpen ? dayHours[0]?.[1] || "18:00" : "18:00"

              return (
                <div key={day.key} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-20">
                      <Label className="text-gray-300">{day.label}</Label>
                    </div>
                    <Switch
                      checked={isOpen}
                      onCheckedChange={(checked) => updateBusinessHours(day.key, checked)}
                    />
                    {isOpen ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Open</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Closed</Badge>
                    )}
                  </div>
                  
                  {isOpen && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={openTime}
                        onChange={(e) => updateBusinessHours(day.key, true, e.target.value, closeTime)}
                        className="w-24 bg-gray-800 border-gray-700 text-gray-100"
                      />
                      <span className="text-gray-400">to</span>
                      <Input
                        type="time"
                        value={closeTime}
                        onChange={(e) => updateBusinessHours(day.key, true, openTime, e.target.value)}
                        className="w-24 bg-gray-800 border-gray-700 text-gray-100"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Button 
            onClick={() => saveSetting('business_hours', settings.business_hours)}
            disabled={saving === 'business_hours'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'business_hours' ? 'Saving...' : 'Save Business Hours'}
          </Button>
        </CardContent>
      </Card>

      {/* Dashboard Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Layout className="w-5 h-5" />
            Dashboard Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Leads per page</Label>
            <p className="text-sm text-gray-400">Number of leads to display per page in the dashboard</p>
            <Select 
              value={settings.dashboard_leads_per_page.toString()} 
              onValueChange={(value) => setSettings({ ...settings, dashboard_leads_per_page: parseInt(value) })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="10">10 leads</SelectItem>
                <SelectItem value="25">25 leads</SelectItem>
                <SelectItem value="50">50 leads</SelectItem>
                <SelectItem value="100">100 leads</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={() => saveSetting('dashboard_leads_per_page', settings.dashboard_leads_per_page)}
            disabled={saving === 'dashboard_leads_per_page'}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving === 'dashboard_leads_per_page' ? 'Saving...' : 'Save Dashboard Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}