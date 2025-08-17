"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Eye, EyeOff } from "lucide-react"
import { getMyProfile, updateMyProfile} from "@/lib/user-profile-api"
import { changePassword } from "@/lib/auth-api"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export default function ProfileSettings() {
  const { user } = useAuth()
  
  const [profile, setProfile] = useState({
    name: "",
    phone: "",
    role: "",
    timezone: "America/New_York",
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
    <div className="space-y-8">
      {/* Profile Information */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <User className="w-5 h-5" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Full Name
              </Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300">
                Phone
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">
                Role
              </Label>
              <Input
                id="role"
                value={profile.role}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-100 opacity-60"
              />
              <p className="text-xs text-gray-500">Role is managed by your dealership administrator</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-300">
                Timezone
              </Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
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
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSaveProfile}
            disabled={loading.profile}
          >
            {loading.profile ? 'Saving...' : 'Save Profile Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-100">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-gray-300">Change Password</Label>
            <div className="relative">
              <Input
                type={showPasswords.current ? "text" : "password"}
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showPasswords.new ? "text" : "password"}
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleChangePassword}
              disabled={loading.password}
            >
              {loading.password ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
          <Separator className="bg-gray-800" />
          <div className="space-y-3">
            <Label className="text-gray-300">Two-Factor Authentication</Label>
            <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
            <Button variant="outline" className="w-full border-gray-600 text-gray-300 bg-transparent">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}