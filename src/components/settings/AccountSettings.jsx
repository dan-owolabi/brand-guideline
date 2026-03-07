/**
 * Account Settings Page
 *
 * Manage account details, domains, team members, billing, and all workspaces
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, sendInviteEmail } from '../../lib/supabase'
import { getBrandUrl } from '../../lib/domainResolver'
import {
    Settings, Users, Globe, ArrowLeft,
    Save, Loader2, Copy, Check, Plus, Mail,
    ExternalLink, AlertCircle, X
} from 'lucide-react'

export default function AccountSettings() {
    const { user, accounts, currentAccount, createAccount, deleteAccount, switchAccount, refreshAccounts, accountsLoaded } = useAuth()

    // view: 'profile' | 'workspace'
    const [view, setView] = useState('profile')
    const [selectedWsId, setSelectedWsId] = useState(null)
    const [wsSubTab, setWsSubTab] = useState('general')
    const [showCreateWs, setShowCreateWs] = useState(false)
    const [newWsName, setNewWsName] = useState('')
    const [creating, setCreating] = useState(false)

    // Must be declared before useEffects that reference it
    const selectedWs = accounts.find(a => a.id === selectedWsId) || null

    // Ensure accounts are fresh when settings page loads (only if not already loaded)
    useEffect(() => {
        if (!accountsLoaded || accounts.length === 0) {
            refreshAccounts?.()
        }
    }, [])

    // If selected workspace disappears (e.g. after refresh), fall back to profile
    useEffect(() => {
        if (view === 'workspace' && selectedWsId && !selectedWs && accountsLoaded) {
            setView('profile')
            setSelectedWsId(null)
        }
    }, [accounts, selectedWsId, selectedWs, view, accountsLoaded])

    const handleSelectWorkspace = (ws) => {
        setSelectedWsId(ws.id)
        setWsSubTab('general')
        setView('workspace')
    }

    const handleCreateWorkspace = async (e) => {
        e.preventDefault()
        if (!newWsName.trim()) return
        setCreating(true)
        try {
            await createAccount(newWsName.trim())
            await refreshAccounts?.()
            setNewWsName('')
            setShowCreateWs(false)
        } catch (err) {
            alert('Failed to create workspace: ' + err.message)
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <nav className="w-56 shrink-0">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Account</p>

                        {/* Profile */}
                        <button
                            onClick={() => setView('profile')}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'profile' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Settings size={16} /> Profile
                        </button>

                        {/* Workspaces — nested under Account */}
                        <div className="mt-3 ml-3 pl-3 border-l border-gray-200">
                            <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Workspaces</p>
                                <button
                                    onClick={() => setShowCreateWs(v => !v)}
                                    className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                    title="New workspace"
                                >
                                    <Plus size={13} />
                                </button>
                            </div>

                            {showCreateWs && (
                                <form onSubmit={handleCreateWorkspace} className="mb-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newWsName}
                                        onChange={e => setNewWsName(e.target.value)}
                                        placeholder="Workspace name"
                                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 mb-1"
                                    />
                                    <div className="flex gap-1">
                                        <button type="submit" disabled={creating || !newWsName.trim()} className="flex-1 py-1 text-xs bg-gray-900 text-white rounded-lg disabled:opacity-50">
                                            {creating ? 'Creating…' : 'Create'}
                                        </button>
                                        <button type="button" onClick={() => { setShowCreateWs(false); setNewWsName('') }} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {!accountsLoaded ? (
                                <div className="py-2"><Loader2 size={13} className="animate-spin text-gray-400" /></div>
                            ) : (
                                <ul className="space-y-0.5">
                                    {accounts.map(ws => (
                                        <li key={ws.id}>
                                            <button
                                                onClick={() => handleSelectWorkspace(ws)}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors text-left ${view === 'workspace' && selectedWsId === ws.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${view === 'workspace' && selectedWsId === ws.id ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'}`}>
                                                    {ws.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="truncate flex-1">{ws.name}</span>
                                                {ws.id === currentAccount?.id && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${view === 'workspace' && selectedWsId === ws.id ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-700'}`}>active</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {view === 'profile' && <GeneralSettings />}
                        {view === 'workspace' && selectedWs && (
                            <WorkspaceSettingsPanel
                                workspace={selectedWs}
                                subTab={wsSubTab}
                                setSubTab={setWsSubTab}
                                onUpdate={refreshAccounts}
                                onDelete={async () => {
                                    await deleteAccount(selectedWs.id)
                                    setView('profile')
                                    setSelectedWsId(null)
                                }}
                                onSwitch={() => { switchAccount(selectedWs.id); }}
                            />
                        )}
                        {view === 'workspace' && !selectedWs && (
                            <div className="text-center py-12 text-gray-400">Select a workspace from the sidebar.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Workspace Settings Panel — General / Team / Domains sub-tabs
───────────────────────────────────────────────────────────────────────────── */
function WorkspaceSettingsPanel({ workspace, subTab, setSubTab, onUpdate, onDelete, onSwitch }) {
    const { currentAccount, user } = useAuth()
    const isActive = workspace.id === currentAccount?.id
    const subTabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'domains', label: 'Domains', icon: Globe },
    ]

    return (
        <div className="space-y-4">
            {/* Workspace header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                        {workspace.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900">{workspace.name}</h2>
                        <p className="text-xs text-gray-500">{workspace.role}</p>
                    </div>
                </div>
                {!isActive && (
                    <button onClick={onSwitch} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                        Switch to this workspace
                    </button>
                )}
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {subTabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSubTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${subTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Sub-tab content */}
            {subTab === 'general' && <WorkspaceGeneralTab workspace={workspace} onUpdate={onUpdate} onDelete={onDelete} />}
            {subTab === 'team' && <WorkspaceTeamPanel workspace={workspace} currentUserId={user?.id} />}
            {subTab === 'domains' && <DomainSettings account={workspace} onUpdate={onUpdate} />}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Workspace General Tab — name, slug, danger zone
───────────────────────────────────────────────────────────────────────────── */
function WorkspaceGeneralTab({ workspace, onUpdate, onDelete }) {
    const [name, setName] = useState(workspace.name)
    const [slug, setSlug] = useState(workspace.slug)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const { updateAccount, accounts } = useAuth()
    const canEdit = workspace.role === 'owner'

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateAccount(workspace.id, { name, slug })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            onUpdate?.()
        } catch (err) {
            alert('Failed to save: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Workspace Settings</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={!canEdit}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">https://</span>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} disabled={!canEdit}
                            className="flex-1 px-3 py-2 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500 text-sm" />
                        <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200">.guidr.space</span>
                    </div>
                </div>
                {canEdit && (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                        <button onClick={handleSave} disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                            {saved ? 'Saved' : 'Save Changes'}
                        </button>
                    </div>
                )}
            </div>

            {/* Danger zone */}
            {canEdit && accounts.length > 1 && (
                <div className="bg-white rounded-xl border border-red-100 p-6">
                    <h3 className="font-semibold text-red-700 mb-1">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4">Permanently delete this workspace and all its brands.</p>
                    {confirmDelete ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Are you sure?</span>
                            <button onClick={onDelete} className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700">Yes, delete</button>
                            <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmDelete(true)} className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50">
                            Delete Workspace
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   General Settings
───────────────────────────────────────────────────────────────────────────── */
function GeneralSettings() {
    const { user } = useAuth()
    const [displayName, setDisplayName] = useState(user?.email?.split('@')[0] || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [pwSent, setPwSent] = useState(false)
    const [pwError, setPwError] = useState('')

    const handleSaveName = async () => {
        setSaving(true)
        try {
            const { error } = await supabase.auth.updateUser({ data: { full_name: displayName } })
            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            alert('Failed to save: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const handlePasswordReset = async () => {
        setChangingPassword(true)
        setPwError('')
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user?.email, {
                redirectTo: `${window.location.origin}/reset-password`
            })
            if (error) throw error
            setPwSent(true)
        } catch (err) {
            setPwError(err.message)
        } finally {
            setChangingPassword(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Profile */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                    <button
                        onClick={handleSaveName}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                        {saved ? 'Saved' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Password */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Password</h2>
                <p className="text-sm text-gray-500 mb-4">We'll send a password reset link to your email.</p>
                {pwSent ? (
                    <p className="text-sm text-green-600 flex items-center gap-2"><Check size={14} /> Reset link sent to {user?.email}</p>
                ) : (
                    <>
                        <button
                            onClick={handlePasswordReset}
                            disabled={changingPassword}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            {changingPassword ? <Loader2 size={14} className="animate-spin" /> : null}
                            Send Reset Link
                        </button>
                        {pwError && <p className="text-xs text-red-600 mt-2">{pwError}</p>}
                    </>
                )}
            </div>
        </div>
    )
}


/* ─────────────────────────────────────────────────────────────────────────────
   Per-workspace Team Panel (members + invite, scoped to workspace.id)
───────────────────────────────────────────────────────────────────────────── */
function WorkspaceTeamPanel({ workspace, currentUserId }) {
    const [members, setMembers] = useState([])
    const [pendingInvites, setPendingInvites] = useState([])
    const [loadingMembers, setLoadingMembers] = useState(true)
    const [showInviteForm, setShowInviteForm] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('editor')
    const [inviting, setInviting] = useState(false)
    const [inviteError, setInviteError] = useState('')
    const [copiedToken, setCopiedToken] = useState(null)
    const { user } = useAuth()
    const isOwner = workspace.role === 'owner'

    useEffect(() => {
        loadMembers()
        loadInvites()
    }, [workspace.id])

    const loadMembers = async () => {
        setLoadingMembers(true)
        try {
            const { data: membersRaw, error } = await supabase
                .from('account_members')
                .select('id, role, created_at, user_id')
                .eq('account_id', workspace.id)
            if (!error && membersRaw?.length) {
                const { data: usersData } = await supabase
                    .from('users').select('id, email, avatar_url')
                    .in('id', membersRaw.map(m => m.user_id))
                setMembers(membersRaw.map(m => ({
                    ...m,
                    user: usersData?.find(u => u.id === m.user_id) || { id: m.user_id, email: null }
                })))
            } else if (!error) {
                setMembers([])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingMembers(false)
        }
    }

    const loadInvites = async () => {
        try {
            const { data } = await supabase
                .from('account_invites')
                .select('*')
                .eq('account_id', workspace.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
            setPendingInvites(data || [])
        } catch (e) {
            console.error(e)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return
        setInviting(true)
        setInviteError('')
        try {
            const { data: inviteRow, error } = await supabase
                .from('account_invites')
                .insert({
                    account_id: workspace.id,
                    email: inviteEmail.trim().toLowerCase(),
                    role: inviteRole,
                    invited_by: user.id
                })
                .select()
                .single()
            if (error) {
                setInviteError(error.code === '23505' ? 'Already invited.' : error.message)
                return
            }
            // Send invite email via Supabase Auth REST API
            if (inviteRow?.token) {
                await sendInviteEmail(
                    inviteEmail.trim().toLowerCase(),
                    `${window.location.origin}/invite/${inviteRow.token}`
                )
            }
            setInviteEmail('')
            setShowInviteForm(false)
            loadInvites()
        } catch (err) {
            setInviteError(err.message)
        } finally {
            setInviting(false)
        }
    }

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Remove this team member?')) return
        await supabase.from('account_members').delete().eq('id', memberId)
        loadMembers()
    }

    const handleRevokeInvite = async (inviteId) => {
        await supabase.from('account_invites').delete().eq('id', inviteId)
        loadInvites()
    }

    const copyInviteLink = (token) => {
        navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`)
        setCopiedToken(token)
        setTimeout(() => setCopiedToken(null), 2000)
    }

    return (
        <div className="p-4 bg-gray-50 space-y-4">
            {/* Members */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>
                    {isOwner && !showInviteForm && (
                        <button
                            onClick={() => setShowInviteForm(true)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-pink-600 hover:text-pink-800 transition-colors"
                        >
                            <Plus size={12} /> Invite
                        </button>
                    )}
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                    <form onSubmit={handleInvite} className="mb-3 p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="colleague@company.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                                autoFocus
                                required
                            />
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value)}
                                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none"
                            >
                                <option value="editor">Editor</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        {inviteError && (
                            <p className="text-xs text-red-600 flex items-center gap-1">
                                <AlertCircle size={11} /> {inviteError}
                            </p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={inviting}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
                            >
                                {inviting ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}
                                Send invite
                            </button>
                            <button
                                type="button"
                                onClick={() => { setShowInviteForm(false); setInviteError('') }}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {loadingMembers ? (
                    <div className="flex justify-center py-4">
                        <Loader2 size={18} className="animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                                    {member.user?.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {member.user?.email?.split('@')[0] || 'Unknown'}
                                        {member.user?.id === currentUserId && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">{member.user?.email}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    member.role === 'owner' ? 'bg-pink-100 text-pink-700'
                                    : member.role === 'editor' ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>{member.role}</span>
                                {isOwner && member.user?.id !== currentUserId && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Invites */}
            {isOwner && pendingInvites.length > 0 && (
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pending Invites</p>
                    <div className="space-y-1">
                        {pendingInvites.map(invite => (
                            <div key={invite.id} className="flex items-center gap-3 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <Mail size={14} className="text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-800 truncate">{invite.email}</p>
                                    <p className="text-xs text-gray-400">
                                        Expires {new Date(invite.expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{invite.role}</span>
                                <button
                                    onClick={() => copyInviteLink(invite.token)}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                    title="Copy invite link"
                                >
                                    {copiedToken === invite.token ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                </button>
                                <button
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Revoke"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Domain Settings
───────────────────────────────────────────────────────────────────────────── */
function DomainSettings({ account, onUpdate }) {
    const [customDomain, setCustomDomain] = useState(account.custom_domain || '')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const { isOwner } = useAuth()

    const defaultUrl = getBrandUrl(account.slug)

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('accounts')
                .update({ custom_domain: customDomain || null })
                .eq('id', account.id)

            if (error) throw error
            onUpdate?.()
        } catch (err) {
            console.error('Failed to save:', err)
            alert('Failed to save domain settings')
        } finally {
            setSaving(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-6">
            {/* Default Domain */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Default Domain</h2>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Globe size={18} className="text-gray-400" />
                    <span className="flex-1 font-mono text-sm">{defaultUrl}</span>
                    <button
                        onClick={() => copyToClipboard(defaultUrl)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                    </button>
                    <a
                        href={defaultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ExternalLink size={16} />
                    </a>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    This is your default public URL. It's always available.
                </p>
            </div>

            {/* Custom Domain */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Domain</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Domain Name
                        </label>
                        <input
                            type="text"
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value.toLowerCase())}
                            disabled={!isOwner()}
                            placeholder="brand.yourcompany.com"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50"
                        />
                    </div>

                    {customDomain && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 mb-2">DNS Configuration Required</p>
                                    <p className="text-amber-700 mb-2">
                                        Add this CNAME record to your domain's DNS settings:
                                    </p>
                                    <code className="block bg-white px-3 py-2 rounded border border-amber-200 font-mono text-xs">
                                        CNAME → cname.vercel-dns.com
                                    </code>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isOwner() && (
                    <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Domain
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

