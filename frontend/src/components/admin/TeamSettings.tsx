'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Users, Mail, Shield, Eye, Edit3, Trash2, Plus, X, Check, ChevronDown } from 'lucide-react'

interface WorkspaceMember {
    id: string
    user_id: string
    role: 'owner' | 'editor' | 'viewer'
    can_invite: boolean
    brand_access_type: 'all' | 'specific'
    user: {
        email: string
        full_name?: string
    }
}

interface PendingInvitation {
    id: string
    email: string
    role: 'editor' | 'viewer'
    can_invite: boolean
    created_at: string
    expires_at: string
}

interface Brand {
    id: string
    name: string
}

export default function TeamSettings() {
    const { currentWorkspace, user } = useAuth()
    const [members, setMembers] = useState<WorkspaceMember[]>([])
    const [invitations, setInvitations] = useState<PendingInvitation[]>([])
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [showInviteModal, setShowInviteModal] = useState(false)
    const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null)

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer')
    const [inviteCanInvite, setInviteCanInvite] = useState(false)
    const [inviteBrandAccess, setInviteBrandAccess] = useState<'all' | 'specific'>('all')
    const [selectedBrands, setSelectedBrands] = useState<string[]>([])
    const [inviting, setInviting] = useState(false)

    const isOwner = currentWorkspace?.role === 'owner'
    const canInvite = isOwner || currentWorkspace?.can_invite

    useEffect(() => {
        if (currentWorkspace) {
            loadTeamData()
        }
    }, [currentWorkspace])

    const loadTeamData = async () => {
        if (!currentWorkspace) return
        setLoading(true)

        try {
            // Load members
            const { data: memberData } = await supabase
                .from('workspace_members')
                .select(`
                    id,
                    user_id,
                    role,
                    can_invite,
                    brand_access_type,
                    user:users (
                        email,
                        full_name
                    )
                `)
                .eq('workspace_id', currentWorkspace.id)

            // Load pending invitations
            const { data: inviteData } = await supabase
                .from('workspace_invitations')
                .select('*')
                .eq('workspace_id', currentWorkspace.id)
                .is('accepted_at', null)

            // Load brands for permission assignment
            const { data: brandData } = await supabase
                .from('brands')
                .select('id, name')
                .or(`workspace_id.eq.${currentWorkspace.id},account_id.eq.${currentWorkspace.id}`)

            // Cast to unknown first to avoid TypeScript strict conversion errors
            setMembers((memberData as unknown as WorkspaceMember[]) || [])
            setInvitations((inviteData as unknown as PendingInvitation[]) || [])
            setBrands(brandData || [])
        } catch (err) {
            console.error('Failed to load team data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!currentWorkspace || !inviteEmail.trim()) return
        setInviting(true)

        try {
            const { error } = await supabase
                .from('workspace_invitations')
                .insert({
                    workspace_id: currentWorkspace.id,
                    email: inviteEmail.toLowerCase().trim(),
                    role: inviteRole,
                    can_invite: inviteRole === 'editor' ? inviteCanInvite : false,
                    brand_access_type: inviteBrandAccess,
                    brand_ids: inviteBrandAccess === 'specific' ? selectedBrands : [],
                    invited_by: user?.id
                })

            if (error) throw error

            // TODO: Send invitation email via edge function or API route

            setShowInviteModal(false)
            setInviteEmail('')
            setInviteRole('viewer')
            setInviteCanInvite(false)
            setInviteBrandAccess('all')
            setSelectedBrands([])
            loadTeamData()
        } catch (err: any) {
            console.error('Failed to invite:', err)
            alert('Failed to send invitation: ' + err.message)
        } finally {
            setInviting(false)
        }
    }

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return

        try {
            const { error } = await supabase
                .from('workspace_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error
            loadTeamData()
        } catch (err: any) {
            console.error('Failed to remove member:', err)
            alert('Failed to remove member: ' + err.message)
        }
    }

    const handleCancelInvitation = async (invitationId: string) => {
        try {
            const { error } = await supabase
                .from('workspace_invitations')
                .delete()
                .eq('id', invitationId)

            if (error) throw error
            loadTeamData()
        } catch (err: any) {
            console.error('Failed to cancel invitation:', err)
        }
    }

    const handleUpdateMemberRole = async (memberId: string, newRole: 'editor' | 'viewer') => {
        try {
            const { error } = await supabase
                .from('workspace_members')
                .update({ role: newRole })
                .eq('id', memberId)

            if (error) throw error
            loadTeamData()
            setEditingMember(null)
        } catch (err: any) {
            console.error('Failed to update role:', err)
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-800'
            case 'editor': return 'bg-blue-100 text-blue-800'
            case 'viewer': return 'bg-gray-100 text-gray-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner': return <Shield className="w-4 h-4" />
            case 'editor': return <Edit3 className="w-4 h-4" />
            case 'viewer': return <Eye className="w-4 h-4" />
            default: return null
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black rounded-full" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
                    <p className="text-gray-500 mt-1">Manage workspace members and permissions</p>
                </div>
                {canInvite && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Invite member
                    </button>
                )}
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="font-medium text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Members ({members.length})
                    </h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {members.map(member => (
                        <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                    {(member.user?.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {member.user?.full_name || member.user?.email}
                                    </p>
                                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getRoleBadgeColor(member.role)}`}>
                                    {getRoleIcon(member.role)}
                                    {member.role}
                                </span>
                                {member.can_invite && member.role !== 'owner' && (
                                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                        Can invite
                                    </span>
                                )}
                                {isOwner && member.role !== 'owner' && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setEditingMember(member)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div className="mt-8 bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-medium text-gray-900 flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Pending Invitations ({invitations.length})
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {invitations.map(invite => (
                            <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{invite.email}</p>
                                    <p className="text-sm text-gray-500">
                                        Invited as {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => handleCancelInvitation(invite.id)}
                                        className="text-sm text-red-600 hover:text-red-700"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Invite team member</h2>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                                />
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setInviteRole('editor')}
                                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${inviteRole === 'editor'
                                            ? 'border-black bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Edit3 className="w-4 h-4" />
                                            <span>Editor</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Can edit assigned brands</p>
                                    </button>
                                    <button
                                        onClick={() => setInviteRole('viewer')}
                                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${inviteRole === 'viewer'
                                            ? 'border-black bg-gray-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            <span>Viewer</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Read-only access</p>
                                    </button>
                                </div>
                            </div>

                            {/* Brand Access */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Brand access
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="brandAccess"
                                            checked={inviteBrandAccess === 'all'}
                                            onChange={() => setInviteBrandAccess('all')}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-medium">All brands</p>
                                            <p className="text-xs text-gray-500">Access to all current and future brands</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="brandAccess"
                                            checked={inviteBrandAccess === 'specific'}
                                            onChange={() => setInviteBrandAccess('specific')}
                                            className="w-4 h-4"
                                        />
                                        <div>
                                            <p className="font-medium">Specific brands</p>
                                            <p className="text-xs text-gray-500">Choose which brands they can access</p>
                                        </div>
                                    </label>
                                </div>

                                {inviteBrandAccess === 'specific' && brands.length > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                                        {brands.map(brand => (
                                            <label key={brand.id} className="flex items-center gap-2 py-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBrands.includes(brand.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedBrands([...selectedBrands, brand.id])
                                                        } else {
                                                            setSelectedBrands(selectedBrands.filter(id => id !== brand.id))
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded"
                                                />
                                                <span>{brand.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Can Invite Toggle (for editors only) */}
                            {inviteRole === 'editor' && (
                                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium">Can invite team members</p>
                                        <p className="text-xs text-gray-500">Allow this editor to invite others</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={inviteCanInvite}
                                        onChange={(e) => setInviteCanInvite(e.target.checked)}
                                        className="w-5 h-5 rounded"
                                    />
                                </label>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 py-2 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={!inviteEmail.trim() || inviting}
                                className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {inviting ? 'Sending...' : 'Send invitation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {editingMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">Edit member</h2>
                            <button
                                onClick={() => setEditingMember(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">{editingMember.user?.email}</p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Change role
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleUpdateMemberRole(editingMember.id, 'editor')}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${editingMember.role === 'editor'
                                        ? 'border-black bg-gray-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Edit3 className="w-5 h-5 mx-auto mb-1" />
                                    Editor
                                </button>
                                <button
                                    onClick={() => handleUpdateMemberRole(editingMember.id, 'viewer')}
                                    className={`flex-1 py-3 px-4 rounded-lg border transition-colors ${editingMember.role === 'viewer'
                                        ? 'border-black bg-gray-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <Eye className="w-5 h-5 mx-auto mb-1" />
                                    Viewer
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (confirm('Remove this member from the workspace?')) {
                                    handleRemoveMember(editingMember.id)
                                    setEditingMember(null)
                                }
                            }}
                            className="w-full mt-6 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            Remove from workspace
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
