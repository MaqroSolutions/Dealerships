"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Shield, Database, Mail, Phone, SettingsIcon, Eye, EyeOff } from "lucide-react"
import { ReplyTimingSettings } from "@/components/reply-timing-settings"
import { useUserRole } from "@/hooks/use-user-role"
import { getMyProfile, updateMyProfile} from "@/lib/user-profile-api"
import { changePassword } from "@/lib/auth-api"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export default function Settings() {
  const { role: userRole, dealership_id: userDealershipId } = useUserRole()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    desktop: true,
  })

  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    role: "",
    timezone: "America/New_York",
    dealershipId: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
  })

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await getMyProfile()
        setProfile({
          name: profileData.full_name,
          phone: profileData.phone ?? "",
          role: profileData.role,
          timezone: profileData.timezone,
          dealershipId: profileData.dealership_id ?? "",
        })
      } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Failed to load profile data. Please check your database setup.')
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  // Handle profile save
  const handleSaveProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }))
    
    try {
      await updateMyProfile({
        full_name: profile.name,
        phone: profile.phone,
        role: profile.role,
        timezone: profile.timezone,
      })
      
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  // Handle password change
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(prev => ({ ...prev, password: true }))
    
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      
      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      
      toast.success('Password changed successfully')
    } catch (error: any) {
      console.error('Error changing password:', error)
      toast.error(error.message || 'Failed to change password')
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  return (
    <div className="w-full max-w-none space-y-8 bg-white">
      <div>
        <h2 className="text-4xl font-bold text-black">Settings</h2>
        <p className="text-gray-700 mt-2 text-lg">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <User className="w-6 h-6 text-gray-500" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black focus:border-amber-400 focus:ring-amber-200 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black focus:border-amber-400 focus:ring-amber-200 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-700 font-medium">
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black focus:border-amber-400 focus:ring-amber-200 rounded-xl h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-gray-700 font-medium">
                  Timezone
                </Label>
                <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                  <SelectTrigger className="bg-white/90 border-gray-300 text-black focus:border-amber-400 focus:ring-amber-200 rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-amber-200 rounded-xl">
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
                onClick={handleSaveProfile}
                disabled={loading.profile}
              >
                {loading.profile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Bell className="w-6 h-6 text-gray-500" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                  />
                </div>
                <Separator className="bg-amber-200" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                  />
                </div>
                <Separator className="bg-amber-200" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium">SMS Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                  />
                </div>
                <Separator className="bg-amber-200" />
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-gray-700 font-medium">Desktop Notifications</Label>
                    <p className="text-sm text-gray-600">Show desktop notifications</p>
                  </div>
                  <Switch
                    checked={notifications.desktop}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, desktop: checked })}
                  />
                </div>
              </div>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3">Save Notification Settings</Button>
            </CardContent>
          </Card>

          {/* Integration Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Database className="w-5 h-5 text-gray-500" />
                Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border border-amber-200 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-black">Email Provider</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Gmail integration for email automation</p>
                  <Button variant="outline" size="sm" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                    Configure
                  </Button>
                </div>

                <div className="p-4 border border-amber-200 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-black">SMS Provider</span>
                    </div>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">Not Connected</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Twilio integration for SMS notifications</p>
                  <Button variant="outline" size="sm" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                    Connect
                  </Button>
                </div>

                <div className="p-4 border border-amber-200 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-gray-500" />
                      <span className="font-medium text-black">CRM Integration</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Salesforce integration for lead management</p>
                  <Button variant="outline" size="sm" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                    Configure
                  </Button>
                </div>

                <div className="p-4 border border-amber-200 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-xs text-white font-bold">f</span>
                      </div>
                      <span className="font-medium text-black">Facebook Ads</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">Connected</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Lead generation from Facebook ads</p>
                  <Button variant="outline" size="sm" className="border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reply Timing Settings (Dealership-level) - render component directly to avoid duplicate title */}
          {((userRole === "owner" || userRole === "manager") && (userDealershipId || profile.dealershipId)) && (
            <ReplyTimingSettings dealershipId={(userDealershipId || profile.dealershipId) as string} />
          )}
        </div>

        {/* Security & Account */}
        <div className="space-y-8">
          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-black text-xl">
                <Shield className="w-5 h-5 text-gray-500" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">Change Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black pr-10 rounded-xl focus:border-amber-400 focus:ring-amber-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="New password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black pr-10 rounded-xl focus:border-amber-400 focus:ring-amber-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="bg-white/90 border-gray-300 text-black pr-10 rounded-xl focus:border-amber-400 focus:ring-amber-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                  onClick={handleChangePassword}
                  disabled={loading.password}
                >
                  {loading.password ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
              <Separator className="bg-amber-200" />
              <div className="space-y-3">
                <Label className="text-gray-700 font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                <Button variant="outline" className="w-full border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-gray-700">Export Data</Label>
                <p className="text-sm text-gray-600">Download all your data in JSON format</p>
                <Button variant="outline" className="w-full border-amber-200 text-gray-700 bg-white hover:bg-amber-50 rounded-xl">
                  Export Data
                </Button>
              </div>
              <Separator className="bg-amber-200" />
              <div className="space-y-3">
                <Label className="text-red-400">Delete Account</Label>
                <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
