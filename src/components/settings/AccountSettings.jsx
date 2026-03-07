/**
 * Account Settings Page
 * 
 * Manage account details, domains, team members, and billing
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { getBrandUrl } from '../../lib/domainResolver'
import {
    Settings, Users, Globe, CreditCard, ArrowLeft,
    Save, Loader2, Copy, Check, Plus, Trash2, Mail,
    ExternalLink, AlertCircle
} from 'lucide-react'

export default function AccountSettings() {
    const { tab = 'general' } = useParams()
    const navigate = useNavigate()
    const { currentAccount, isOwner, refreshAccounts } = useAuth()

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
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
                        {tab === 'domains' && <DomainSettings account={currentAccount} onUpdate={refreshAccounts} />}
                        {tab === 'team' && <TeamSettings account={currentAccount} />}
                        {tab === 'billing' && <BillingSettings account={currentAccount} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

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
                        full_name,
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
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                                    {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {member.user?.full_name || 'Unknown'}
                                        {member.user?.id === user?.id && (
                                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate">{member.user?.email}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${member.role === 'owner'
                                    ? 'bg-purple-100 text-purple-700'
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
