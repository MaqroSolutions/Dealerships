/**
 * Refactored team management component
 * Handles team member management and invite system
 */

"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  Mail, 
  Copy,
  Trash2,
  UserPlus,
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { RoleBasedAuthAPI, InviteData, UserRole } from "@/lib/auth/role-based-auth"
import { getDealershipProfile } from "@/lib/user-profile-api"
import type { UserProfile } from "@/lib/supabase"
import { getAuthenticatedApi } from "@/lib/api-client"

interface TeamMember extends UserProfile {
  role: string
}

interface TeamManagementState {
  teamMembers: TeamMember[]
  invites: InviteData[]
  loading: boolean
  inviteDialogOpen: boolean
  inviteForm: {
    email: string
    role_name: UserRole
  }
}

export function TeamManagement() {
  const [state, setState] = useState<TeamManagementState>({
    teamMembers: [],
    invites: [],
    loading: true,
    inviteDialogOpen: false,
    inviteForm: {
      email: '',
      role_name: 'salesperson'
    }
  })

  // Debug initial state
  console.log('🔍 TeamManagement initial state:', state)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      console.log('Loading team data...')
      const [members, invitesData] = await Promise.all([
        getDealershipProfile(),
        RoleBasedAuthAPI.getDealershipInvites()
      ])
      
      console.log('Team members loaded:', members)
      console.log('Invites loaded:', invitesData)
      
      setState(prev => ({
        ...prev,
        teamMembers: members || [],
        invites: invitesData || [],
        loading: false
      }))
    } catch (error) {
      console.error('Error loading team data:', error)
      toast.error(`Failed to load team data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 handleCreateInvite called!')
    console.log('📧 Current state:', state)
    console.log('📧 Form data:', state.inviteForm)
    console.log('📧 Email value:', state.inviteForm?.email)
    console.log('👤 Role value:', state.inviteForm?.role_name)
    
    // Robust validation with better error messages
    if (!state.inviteForm?.email?.trim()) {
      console.error('❌ Email validation failed:', state.inviteForm?.email)
      toast.error('Please enter an email address')
      return
    }
    
    if (!state.inviteForm?.role_name) {
      console.error('❌ Role validation failed:', state.inviteForm?.role_name)
      toast.error('Please select a role')
      return
    }
    
    console.log('✅ Form validation passed, proceeding with invite creation')
    
    try {
      console.log('Creating invite with data:', state.inviteForm)
      const result = await RoleBasedAuthAPI.createInvite(state.inviteForm)
      console.log('Invite creation result:', result)
      
      if (result.success && result.invite) {
        // Try to send email via frontend
        try {
          await sendInviteEmail(result.invite.email, result.invite.token)
          toast.success('Invite sent successfully via email!')
        } catch (emailError) {
          console.warn('Email sending failed, but invite was created:', emailError)
          toast.warning('Invite created successfully! Email sending failed - use the copy link button to share the invite.')
        }
        
        setState(prev => ({
          ...prev,
          inviteDialogOpen: false,
          inviteForm: { email: '', role_name: 'salesperson' }
        }))
        loadTeamData() // Refresh the data
      } else {
        console.error('Invite creation failed:', result.error)
        toast.error(result.error || 'Failed to create invite')
      }
    } catch (error: any) {
      console.error('Invite creation error:', error)
      toast.error(error.message || 'Failed to create invite')
    }
  }

  const handleCancelInvite = async (inviteId: string) => {
    try {
      setState(prev => ({
        ...prev,
        invites: prev.invites.map(invite => 
          invite.id === inviteId 
            ? { ...invite, status: 'cancelled' as const }
            : invite
        )
      }))
      
      const result = await RoleBasedAuthAPI.cancelInvite(inviteId)
      
      if (result.success) {
        toast.success('Invite cancelled')
      } else {
        loadTeamData()
        toast.error(result.error || 'Failed to cancel invite')
      }
    } catch (error: any) {
      // Revert optimistic update on error
      loadTeamData()
      toast.error(error.message || 'Failed to cancel invite')
    }
  }

  const sendInviteEmail = async (email: string, token: string) => {
    try {
      // Send invite email via backend API
      const api = await getAuthenticatedApi()
      const result = await api.post<{
        success: boolean
        message?: string
        error?: string
        invite_link?: string
      }>('/send-invite-email', { email, token })
      
      if (result.success) {
        return { success: true }
      } else {
        throw new Error(result.error || 'Failed to send email')
      }
    } catch (error: any) {
      console.error('Failed to send invite email:', error)
      throw error
    }
  }

  const copyInviteLink = (token: string) => {
    const inviteUrl = `${window.location.origin}/signup?token=${token}`
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied to clipboard!')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'salesperson':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'accepted':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'expired':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const pendingInvites = state.invites.filter(invite => invite.status === 'pending')
  const recentInvites = state.invites.filter(invite => invite.status !== 'pending')

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading team data...</div>
      </div>
    )
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const result = await RoleBasedAuthAPI.removeUserFromDealership(userId)
      if (result.success) {
        toast.success('User removed from dealership')
        loadTeamData()
      } else {
        toast.error(result.error || 'Failed to remove user')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove user')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Team Management</h1>
          <p className="text-gray-400 mt-2">
            Manage your sales team and invite new members
          </p>
        </div>
        <Dialog open={state.inviteDialogOpen} onOpenChange={(open) => setState(prev => ({ ...prev, inviteDialogOpen: open }))}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-gray-100">Invite Team Member</DialogTitle>
              <DialogDescription className="text-gray-400">
                Send an invitation to join your dealership team
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={state.inviteForm.email}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    inviteForm: { ...prev.inviteForm, email: e.target.value }
                  }))}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-200">Role</Label>
                <Select
                  value={state.inviteForm.role_name}
                  onValueChange={(value: UserRole) => setState(prev => ({ 
                    ...prev, 
                    inviteForm: { ...prev.inviteForm, role_name: value }
                  }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="salesperson">Salesperson</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setState(prev => ({ ...prev, inviteDialogOpen: false }))}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Send Invite
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members */}
      <TeamMembersSection 
        teamMembers={state.teamMembers} 
        getRoleBadgeColor={getRoleBadgeColor} 
        onRemoveMember={handleRemoveMember}
      />

      {/* Pending Invites */}
      <PendingInvitesSection 
        invites={pendingInvites}
        getRoleBadgeColor={getRoleBadgeColor}
        onCopyLink={copyInviteLink}
        onCancelInvite={handleCancelInvite}
      />

      {/* Recent Invites */}
      {recentInvites.length > 0 && (
        <RecentInvitesSection 
          invites={recentInvites}
          getRoleBadgeColor={getRoleBadgeColor}
          getStatusBadgeColor={getStatusBadgeColor}
        />
      )}
    </div>
  )
}

// Sub-components for better separation of concerns
function TeamMembersSection({ 
  teamMembers, 
  getRoleBadgeColor,
  onRemoveMember
}: { 
  teamMembers: TeamMember[]
  getRoleBadgeColor: (role: string) => string
  onRemoveMember: (userId: string) => void
}) {
  return (
    <Card className="bg-gray-900/70 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-100">Team Members</CardTitle>
        <CardDescription className="text-gray-400">
          {teamMembers.length} active team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <TeamMemberCard 
              key={member.id} 
              member={member} 
              getRoleBadgeColor={getRoleBadgeColor}
              onRemoveMember={onRemoveMember}
            />
          ))}
          {teamMembers.length === 0 && <EmptyTeamState />}
        </div>
      </CardContent>
    </Card>
  )
}

function TeamMemberCard({ 
  member, 
  getRoleBadgeColor,
  onRemoveMember
}: { 
  member: TeamMember
  getRoleBadgeColor: (role: string) => string
  onRemoveMember: (userId: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold">
            {member.full_name ? member.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-200">{member.full_name}</p>
          <p className="text-xs text-gray-400">{member.phone || ''}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={getRoleBadgeColor(member.role)}>
          {member.role}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => onRemoveMember(member.user_id)}
          aria-label="Remove user"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyTeamState() {
  return (
    <div className="text-center py-8">
      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-400">No team members yet</p>
      <p className="text-gray-500 text-sm">Invite your first team member to get started</p>
    </div>
  )
}

function PendingInvitesSection({ 
  invites, 
  getRoleBadgeColor, 
  onCopyLink, 
  onCancelInvite 
}: { 
  invites: InviteData[]
  getRoleBadgeColor: (role: string) => string
  onCopyLink: (token: string) => void
  onCancelInvite: (inviteId: string) => void
}) {
  return (
    <Card className="bg-gray-900/70 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-100">Pending Invites</CardTitle>
        <CardDescription className="text-gray-400">
          {invites.length} pending invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invites.map((invite) => (
            <PendingInviteCard 
              key={invite.id} 
              invite={invite} 
              getRoleBadgeColor={getRoleBadgeColor}
              onCopyLink={onCopyLink}
              onCancelInvite={onCancelInvite}
            />
          ))}
          {invites.length === 0 && <EmptyInvitesState />}
        </div>
      </CardContent>
    </Card>
  )
}

function PendingInviteCard({ 
  invite, 
  getRoleBadgeColor, 
  onCopyLink, 
  onCancelInvite 
}: { 
  invite: InviteData
  getRoleBadgeColor: (role: string) => string
  onCopyLink: (token: string) => void
  onCancelInvite: (inviteId: string) => void
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
      <div className="flex items-center space-x-4">
        <Mail className="w-5 h-5 text-gray-400" />
        <div>
          <p className="text-sm font-medium text-gray-200">{invite.email}</p>
          <p className="text-xs text-gray-400">
            Expires {new Date(invite.expires_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={getRoleBadgeColor(invite.role_name)}>
          {invite.role_name}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCopyLink(invite.token)}
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onCancelInvite(invite.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyInvitesState() {
  return (
    <div className="text-center py-8">
      <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <p className="text-gray-400">No pending invites</p>
    </div>
  )
}

function RecentInvitesSection({ 
  invites, 
  getRoleBadgeColor, 
  getStatusBadgeColor 
}: { 
  invites: InviteData[]
  getRoleBadgeColor: (role: string) => string
  getStatusBadgeColor: (status: string) => string
}) {
  return (
    <Card className="bg-gray-900/70 border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-100">Recent Invites</CardTitle>
        <CardDescription className="text-gray-400">
          History of recent invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invites.slice(0, 5).map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">{invite.email}</p>
                  <p className="text-xs text-gray-400">
                    Expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getRoleBadgeColor(invite.role_name)}>
                  {invite.role_name}
                </Badge>
                <Badge className={getStatusBadgeColor(invite.status)}>
                  {invite.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
