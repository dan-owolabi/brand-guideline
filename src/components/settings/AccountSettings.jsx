/**
 * Account Settings Page
 *
 * Manage account details, domains, team members, billing, and all workspaces
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase, sendInviteEmail } from '../../lib/supabase'
import { getBrandUrl } from '../../lib/domainResolver'
import {
    Settings, Users, Globe, CreditCard, ArrowLeft,
    Save, Loader2, Copy, Check, Plus, Trash2, Mail,
    ExternalLink, AlertCircle, Layers, Pencil, X, ChevronDown, ChevronUp
} from 'lucide-react'

export default function AccountSettings() {
    const { tab = 'general' } = useParams()
    const navigate = useNavigate()
    const { currentAccount, isOwner, refreshAccounts } = useAuth()

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'workspaces', label: 'Workspaces', icon: Layers },
        { id: 'domains', label: 'Domains', icon: Globe },
        { id: 'team', label: 'Team', icon: Users },
        { id: 'billing', label: 'Billing', icon: CreditCard }
    ]

    if (!currentAccount) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/dashboard"
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                Account Settings
                            </h1>
                            <p className="text-sm text-gray-500">{currentAccount.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <nav className="w-48 shrink-0">
                        <ul className="space-y-1">
                            {tabs.map(t => (
                                <li key={t.id}>
                                    <button
                                        onClick={() => navigate(`/settings/${t.id}`)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id
                                            ? 'bg-gray-900 text-white'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <t.icon size={18} />
                                        {t.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {tab === 'general' && <GeneralSettings account={currentAccount} onUpdate={refreshAccounts} />}
                        {tab === 'workspaces' && <WorkspacesSettings />}
                        {tab === 'domains' && <DomainSettings account={currentAccount} onUpdate={refreshAccounts} />}
                        {tab === 'team' && <TeamSettings account={currentAccount} />}
                        {tab === 'billing' && <BillingSettings account={currentAccount} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   General Settings
───────────────────────────────────────────────────────────────────────────── */
function GeneralSettings({ account, onUpdate }) {
    const [name, setName] = useState(account.name)
    const [slug, setSlug] = useState(account.slug)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const { isOwner } = useAuth()

    const handleSave = async () => {
        setSaving(true)
        try {
            const { error } = await supabase
                .from('accounts')
                .update({ name, slug })
                .eq('id', account.id)

            if (error) throw error
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
            onUpdate?.()
        } catch (err) {
            console.error('Failed to save:', err)
            alert('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    const brandUrl = getBrandUrl(slug)

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={!isOwner()}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug
                        </label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">
                                    https://
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    disabled={!isOwner()}
                                    className="flex-1 px-3 py-2 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                                />
                                <span className="px-3 py-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200">
                                    .guidr.space
                                </span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Your public brand guidelines will be available at {brandUrl}
                        </p>
                    </div>
                </div>
            </div>

            {isOwner() && (
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : saved ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {saved ? 'Saved' : 'Save Changes'}
                    </button>
                </div>
            )}
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Workspaces Settings — full CRUD + per-workspace team management
───────────────────────────────────────────────────────────────────────────── */
function WorkspacesSettings() {
    const { accounts, currentAccount, createAccount, updateAccount, deleteAccount, switchAccount, user, refreshAccounts } = useAuth()

    // Ensure accounts are fresh when this tab is opened
    useEffect(() => {
        refreshAccounts?.()
    }, [])

    // Create modal
    const [showCreate, setShowCreate] = useState(false)
    const [createName, setCreateName] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    // Edit modal
    const [editingId, setEditingId] = useState(null)
    const [editName, setEditName] = useState('')
    const [editSlug, setEditSlug] = useState('')
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState('')

    // Delete confirmation
    const [deletingId, setDeletingId] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Expanded team panel per workspace
    const [expandedTeam, setExpandedTeam] = useState(null)

    const handleCreate = async (e) => {
        e.preventDefault()
        if (!createName.trim()) return
        setCreating(true)
        setCreateError('')
        const slug = createName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30)
            + '-' + Date.now().toString(36)
        const { error } = await createAccount(createName.trim(), slug)
        if (error) {
            setCreateError(error.message || 'Failed to create workspace')
            setCreating(false)
            return
        }
        setShowCreate(false)
        setCreateName('')
        setCreating(false)
    }

    const openEdit = (ws) => {
        setEditingId(ws.id)
        setEditName(ws.name)
        setEditSlug(ws.slug)
        setSaveError('')
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault()
        if (!editName.trim()) return
        setSaving(true)
        setSaveError('')
        const { error } = await updateAccount(editingId, { name: editName.trim(), slug: editSlug })
        if (error) {
            setSaveError(error.message || 'Failed to save')
            setSaving(false)
            return
        }
        setEditingId(null)
        setSaving(false)
    }

    const handleDelete = async (id) => {
        setDeleteLoading(true)
        const { error } = await deleteAccount(id)
        if (error) {
            alert('Failed to delete workspace: ' + error.message)
        }
        setDeletingId(null)
        setDeleteLoading(false)
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {accounts.length} workspace{accounts.length !== 1 ? 's' : ''} you belong to
                    </p>
                </div>
                <button
                    onClick={() => { setShowCreate(true); setCreateError('') }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Plus size={16} />
                    New Workspace
                </button>
            </div>

            {/* Workspace list */}
            {accounts.map(ws => (
                <div key={ws.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    {/* Workspace row */}
                    <div className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {ws.name?.charAt(0)?.toUpperCase() || 'W'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 truncate">{ws.name}</p>
                                {ws.id === currentAccount?.id && (
                                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                                        Active
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{ws.slug}.guidr.space · {ws.role}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                            {ws.id !== currentAccount?.id && (
                                <button
                                    onClick={() => switchAccount(ws.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Switch
                                </button>
                            )}
                            {ws.role === 'owner' && (
                                <>
                                    <button
                                        onClick={() => openEdit(ws)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Edit workspace"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    {accounts.length > 1 && (
                                        <button
                                            onClick={() => setDeletingId(ws.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete workspace"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </>
                            )}
                            <button
                                onClick={() => setExpandedTeam(expandedTeam === ws.id ? null : ws.id)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Team members"
                            >
                                {expandedTeam === ws.id ? <ChevronUp size={15} /> : <Users size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Inline Edit Form */}
                    {editingId === ws.id && (
                        <form onSubmit={handleSaveEdit} className="border-t border-gray-100 p-4 bg-gray-50">
                            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">Edit Workspace</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
                                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                        <span className="px-3 py-2 bg-gray-50 text-gray-400 text-xs border-r border-gray-200 shrink-0">guidr.space/</span>
                                        <input
                                            type="text"
                                            value={editSlug}
                                            onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                                        />
                                    </div>
                                </div>
                                {saveError && (
                                    <p className="text-xs text-red-600 flex items-center gap-1">
                                        <AlertCircle size={12} /> {saveError}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={saving || !editName.trim()}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                    >
                                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {/* Expanded Team Panel */}
                    {expandedTeam === ws.id && (
                        <div className="border-t border-gray-100">
                            <WorkspaceTeamPanel workspace={ws} currentUserId={user?.id} />
                        </div>
                    )}
                </div>
            ))}

            {/* Create Workspace Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">New Workspace</h3>
                            <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
                                <input
                                    type="text"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="Acme Inc."
                                    autoFocus
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Typically your company or team name</p>
                            </div>
                            {createError && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle size={12} /> {createError}
                                </p>
                            )}
                            <div className="flex gap-2 justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={() => { setShowCreate(false); setCreateName('') }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !createName.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                                >
                                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={22} className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Workspace</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            This will permanently delete the workspace <strong>{accounts.find(a => a.id === deletingId)?.name}</strong> and all its brands. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingId(null)}
                                className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deletingId)}
                                disabled={deleteLoading}
                                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                            >
                                {deleteLoading ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
            const { data, error } = await supabase
                .from('account_members')
                .select(`id, role, created_at, user:users(id, email, avatar_url)`)
                .eq('account_id', workspace.id)
            if (!error) setMembers(data || [])
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

/* ─────────────────────────────────────────────────────────────────────────────
   Team Settings (current workspace)
───────────────────────────────────────────────────────────────────────────── */
function TeamSettings({ account }) {
    const [members, setMembers] = useState([])
    const [pendingInvites, setPendingInvites] = useState([])
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('editor')
    const [showInviteForm, setShowInviteForm] = useState(false)
    const [inviting, setInviting] = useState(false)
    const [inviteError, setInviteError] = useState(null)
    const [copiedToken, setCopiedToken] = useState(null)
    const { isOwner, user } = useAuth()

    useEffect(() => {
        loadMembers()
        loadPendingInvites()
    }, [account.id])

    const loadMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('account_members')
                .select(`
                    id,
                    role,
                    created_at,
                    user:users (
                        id,
                        email,
                        avatar_url
                    )
                `)
                .eq('account_id', account.id)

            if (error) throw error
            setMembers(data || [])
        } catch (err) {
            console.error('Failed to load members:', err)
        } finally {
            setLoading(false)
        }
    }

    const loadPendingInvites = async () => {
        try {
            const { data, error } = await supabase
                .from('account_invites')
                .select('*')
                .eq('account_id', account.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) throw error
            setPendingInvites(data || [])
        } catch (err) {
            console.error('Failed to load invites:', err)
        }
    }

    const handleInvite = async (e) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return

        setInviting(true)
        setInviteError(null)

        try {
            const { data, error } = await supabase
                .from('account_invites')
                .insert({
                    account_id: account.id,
                    email: inviteEmail.trim().toLowerCase(),
                    role: inviteRole,
                    invited_by: user.id
                })
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    setInviteError('This email has already been invited.')
                } else {
                    throw error
                }
                return
            }

            // Send invite email via Supabase Auth REST API
            if (data?.token) {
                await sendInviteEmail(
                    inviteEmail.trim().toLowerCase(),
                    `${window.location.origin}/invite/${data.token}`
                )
            }

            setInviteEmail('')
            setShowInviteForm(false)
            loadPendingInvites()
        } catch (err) {
            console.error('Failed to send invite:', err)
            setInviteError(err.message || 'Failed to send invite')
        } finally {
            setInviting(false)
        }
    }

    const handleRevokeInvite = async (inviteId) => {
        try {
            await supabase.from('account_invites').delete().eq('id', inviteId)
            loadPendingInvites()
        } catch (err) {
            console.error('Failed to revoke invite:', err)
        }
    }

    const copyInviteLink = (token) => {
        const link = `${window.location.origin}/invite/${token}`
        navigator.clipboard.writeText(link)
        setCopiedToken(token)
        setTimeout(() => setCopiedToken(null), 2000)
    }

    const handleRemoveMember = async (memberId) => {
        if (!confirm('Remove this team member?')) return

        try {
            const { error } = await supabase
                .from('account_members')
                .delete()
                .eq('id', memberId)

            if (error) throw error
            loadMembers()
        } catch (err) {
            console.error('Failed to remove member:', err)
        }
    }

    return (
        <div className="space-y-6">
            {/* Invite Form */}
            {isOwner() && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
                    </div>

                    {!showInviteForm ? (
                        <button
                            onClick={() => setShowInviteForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Mail size={16} />
                            Send Invite
                        </button>
                    ) : (
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        type="email"
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 bg-white"
                                >
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                </select>
                            </div>

                            {inviteError && (
                                <div className="flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle size={14} />
                                    {inviteError}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {inviting ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                    {inviting ? 'Sending...' : 'Send Invite'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowInviteForm(false); setInviteError(null) }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Pending Invites */}
            {isOwner() && pendingInvites.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Invites</h2>
                    <div className="space-y-3">
                        {pendingInvites.map(invite => (
                            <div
                                key={invite.id}
                                className="flex items-center gap-4 p-3 rounded-lg bg-amber-50/50 border border-amber-100"
                            >
                                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <Mail size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{invite.email}</p>
                                    <p className="text-xs text-gray-500">
                                        Invited {new Date(invite.created_at).toLocaleDateString()} · Expires {new Date(invite.expires_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${invite.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {invite.role}
                                </span>
                                <button
                                    onClick={() => copyInviteLink(invite.token)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Copy invite link"
                                >
                                    {copiedToken === invite.token ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                </button>
                                <button
                                    onClick={() => handleRevokeInvite(invite.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Revoke invite"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Current Members */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Members</h2>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {members.map(member => (
                            <div
                                key={member.id}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-medium">
                                    {member.user?.email?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {member.user?.email?.split('@')[0] || 'Unknown'}
                                        {member.user?.id === user?.id && (
                                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{member.user?.email}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.role === 'owner'
                                    ? 'bg-pink-100 text-pink-700'
                                    : member.role === 'editor'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}>
                                    {member.role}
                                </span>
                                {isOwner() && member.user?.id !== user?.id && (
                                    <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Billing Settings
───────────────────────────────────────────────────────────────────────────── */
function BillingSettings({ account }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing</h2>

            <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Free Plan</h3>
                <p className="text-gray-500 mb-6">You're currently on the free plan.</p>
                <button className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
                    Upgrade to Pro
                </button>
            </div>
        </div>
    )
}
