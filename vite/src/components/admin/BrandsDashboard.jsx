import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { supabase, uploadFile } from '../../lib/supabase'
import { createDefaultSections } from '../../data/defaultSections'
import { useAuth } from '../../contexts/AuthContext'
import { getBrandUrl } from '../../lib/domainResolver'
import TiltCard from '../ui/TiltCard'
import AnimatedModal from '../ui/AnimatedModal'
import AnimatedDropdown from '../ui/AnimatedDropdown'
import AnimatedTabs from '../ui/AnimatedTabs'

import {
    Plus, Settings, Trash2, Loader2, ExternalLink,
    Compass, Briefcase, LayoutGrid, Upload, Type, ChevronDown, LogOut, User, ArrowRightLeft, MoreHorizontal, Pencil
} from 'lucide-react'

const GOOGLE_FONTS = [
    { label: 'Geist', value: 'Geist', category: 'Sans Serif' },
    { label: 'Inter', value: 'Inter', category: 'Sans Serif' },
    { label: 'Roboto', value: 'Roboto', category: 'Sans Serif' },
    { label: 'Poppins', value: 'Poppins', category: 'Sans Serif' },
    { label: 'Merriweather', value: 'Merriweather', category: 'Serif' },
    { label: 'Playfair Display', value: 'Playfair Display', category: 'Serif' },
    { label: 'JetBrains Mono', value: 'JetBrains Mono', category: 'Monospace' }
]

const COLOR_PRESETS = [
    '#0066FF', '#000000', '#FF3366', '#00CC66', '#7C3AED', '#F59E0B'
]

export default function BrandsDashboard() {
    const navigate = useNavigate()
    const location = useLocation()
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState('')
    const [showNewModal, setShowNewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingBrandId, setEditingBrandId] = useState(null)
    const [filter, setFilter] = useState('all')
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, brandId: null, brandName: '' })
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
    const [createWorkspaceName, setCreateWorkspaceName] = useState('')
    const [creatingWorkspace, setCreatingWorkspace] = useState(false)
    const [showTransferModal, setShowTransferModal] = useState(false)
    const [transferBrandId, setTransferBrandId] = useState(null)
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
    const [openMenuId, setOpenMenuId] = useState(null)

    const isLegacyAdminRoute = location.pathname.startsWith('/admin')
    const getEditorPath = (brandId, pageSlug = 'introduction') => (
        isLegacyAdminRoute
            ? `/admin/brand/${brandId}/${pageSlug}`
            : `/brand/${brandId}/${pageSlug}`
    )

    const withTimeout = (promise, ms, message) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms)
        promise
            .then((value) => {
                clearTimeout(timer)
                resolve(value)
            })
            .catch((err) => {
                clearTimeout(timer)
                reject(err)
            })
    })

    const filteredBrands = brands.filter(brand => {
        if (filter === 'all') return true
        if (filter === 'published') return brand.published !== null
        if (filter === 'draft') return brand.published === null
        return true
    })

    // Form State (shared logic/structure for New and Edit)
    const [newBrand, setNewBrand] = useState({
        name: '',
        color: '#0066FF',
        font: 'Geist',
        bannerUrl: null,
        customFontUrl: null,
        customFontName: null
    })

    const [editBrand, setEditBrand] = useState({
        name: '',
        color: '#0066FF',
        font: 'Geist',
        bannerUrl: null,
        customFontUrl: null,
        customFontName: null
    })

    const [creating, setCreating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploadingFont, setUploadingFont] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const fileInputRef = useRef(null)
    const fontInputRef = useRef(null)
    const editFileInputRef = useRef(null)
    const editBannerInputRef = useRef(null)

    const {
        user, currentAccount, accounts, switchAccount, signOut, refreshAccounts,
        loading: authLoading, initialized, accountsLoaded
    } = useAuth()

    const loadBrands = useCallback(async () => {
        if (!currentAccount) {
            setLoading(false)
            return
        }

        try {
            setLoadError('')
            const { data, error } = await withTimeout(
                supabase
                    .from('brands')
                    .select('id, name, logo_url, banner_url, primary_color, font_family, created_at, published, slug, account_id')
                    .eq('account_id', currentAccount.id)
                    .order('created_at', { ascending: false }),
                8000,
                'Timed out loading brands'
            )

            if (error) throw error
            setBrands(data || [])
        } catch (err) {
            console.error('Failed to load brands:', err)
            setLoadError(err.message || 'Failed to load brands')
            setBrands([])
        } finally {
            setLoading(false)
        }
    }, [currentAccount])

    useEffect(() => {
        loadBrands()
    }, [loadBrands, currentAccount?.id])

    const handleFontUpload = async (e, type = 'new') => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingFont(true)
        try {
            const url = await uploadFile(file, 'media')
            const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '')
            if (type === 'new') {
                setNewBrand({
                    ...newBrand,
                    font: fontName,
                    customFontUrl: url,
                    customFontName: fontName
                })
            } else {
                setEditBrand({
                    ...editBrand,
                    font: fontName,
                    customFontUrl: url,
                    customFontName: fontName
                })
            }
        } catch (err) {
            alert('Failed to upload font: ' + err.message)
        } finally {
            setUploadingFont(false)
        }
    }

    const handleBannerUpload = async (e, type = 'new') => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingBanner(true)
        try {
            const url = await uploadFile(file, 'media')
            if (type === 'new') {
                setNewBrand({ ...newBrand, bannerUrl: url })
            } else {
                setEditBrand({ ...editBrand, bannerUrl: url })
            }
        } catch (err) {
            alert('Failed to upload banner: ' + err.message)
        } finally {
            setUploadingBanner(false)
        }
    }

    const createBrand = async () => {
        if (!newBrand.name.trim()) return
        setCreating(true)

        try {
            const sections = createDefaultSections()
            const introSection = sections.find(s => s.slug === 'introduction')
            if (introSection && introSection.blocks[0]) {
                introSection.blocks[0].content.text = `Welcome to ${newBrand.name}`
            }

            const defaultDraft = {
                tokens: {
                    primaryColor: newBrand.color,
                    fontFamily: newBrand.font,
                    customFontUrl: newBrand.customFontUrl
                },
                sections: sections
            }

            const { data, error } = await supabase
                .from('brands')
                .insert({
                    name: newBrand.name.trim(),
                    primary_color: newBrand.color,
                    font_family: newBrand.font,
                    banner_url: newBrand.bannerUrl,
                    draft: defaultDraft,
                    published: null,
                    account_id: currentAccount?.id
                })
                .select()
                .single()

            if (error) throw error

            setShowNewModal(false)
            resetForm()
            navigate(getEditorPath(data.id))
        } catch (err) {
            alert('Failed to create brand: ' + err.message)
        } finally {
            setCreating(false)
        }
    }

    const handleEditClick = (brand) => {
        setEditingBrandId(brand.id)
        setEditBrand({
            name: brand.name,
            color: brand.primary_color || '#0066FF',
            font: brand.font_family || 'Geist',
            bannerUrl: brand.banner_url || null,
            customFontUrl: brand.draft?.tokens?.customFontUrl || null,
            customFontName: null
        })
        setShowEditModal(true)
    }

    const updateBrandSettings = async () => {
        if (!editBrand.name.trim()) return
        setSaving(true)

        try {
            // Find the full brand object to get the current draft
            const brandObj = brands.find(b => b.id === editingBrandId)
            const currentDraft = brandObj?.draft || { tokens: {}, sections: [] }

            const updatedDraft = {
                ...currentDraft,
                tokens: {
                    ...(currentDraft.tokens || {}),
                    primaryColor: editBrand.color,
                    fontFamily: editBrand.font,
                    customFontUrl: editBrand.customFontUrl
                }
            }

            const { error } = await supabase
                .from('brands')
                .update({
                    name: editBrand.name.trim(),
                    primary_color: editBrand.color,
                    font_family: editBrand.font,
                    banner_url: editBrand.bannerUrl,
                    draft: updatedDraft
                })
                .eq('id', editingBrandId)

            if (error) throw error

            setShowEditModal(false)
            loadBrands() // Refresh the list
        } catch (err) {
            alert('Failed to update brand: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const resetForm = () => {
        setNewBrand({ name: '', color: '#0066FF', font: 'Geist', bannerUrl: null, customFontUrl: null, customFontName: null })
    }

    const handleDeleteClick = (brandId, brandName) => {
        setDeleteConfirm({ show: true, brandId, brandName })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.brandId) return

        try {
            await supabase.from('brands').delete().eq('id', deleteConfirm.brandId)
            setBrands(brands.filter(b => b.id !== deleteConfirm.brandId))
            setDeleteConfirm({ show: false, brandId: null, brandName: '' })
        } catch (err) {
            alert('Failed to delete: ' + err.message)
        }
    }

    const handleCreateWorkspace = async () => {
        if (!createWorkspaceName.trim()) return
        setCreatingWorkspace(true)
        try {
            const baseSlug = createWorkspaceName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
            let slug = baseSlug
            let account, accountError
            for (let attempt = 0; attempt < 5; attempt++) {
                const result = await supabase
                    .from('accounts')
                    .insert({ name: createWorkspaceName.trim(), slug })
                    .select()
                    .single()
                account = result.data
                accountError = result.error
                // 23505 = unique_violation - slug already taken, retry with a random suffix
                if (accountError?.code === '23505') {
                    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
                    continue
                }
                break
            }
            if (accountError) throw accountError

            const { error: memberError } = await supabase
                .from('account_members')
                .insert({ account_id: account.id, user_id: user.id, role: 'owner' })
            if (memberError) throw memberError

            // Refresh accounts and switch to new one
            await refreshAccounts()
            switchAccount(account.id)
            setShowCreateWorkspace(false)
            setCreateWorkspaceName('')
        } catch (err) {
            alert('Failed to create workspace: ' + err.message)
        } finally {
            setCreatingWorkspace(false)
        }
    }

    const handleTransferBrand = async (brandId, targetAccountId) => {
        try {
            const { error } = await supabase
                .from('brands')
                .update({ account_id: targetAccountId })
                .eq('id', brandId)
            if (error) throw error
            setShowTransferModal(false)
            setTransferBrandId(null)
            loadBrands()
        } catch (err) {
            alert('Failed to transfer brand: ' + err.message)
        }
    }

    if (loading || !initialized || authLoading || !accountsLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!currentAccount) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center bg-white border border-gray-200 rounded-2xl p-10 shadow-sm max-w-md w-full">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-5">
                        <Briefcase size={24} className="text-gray-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your first workspace</h2>
                    <p className="text-sm text-gray-500 mb-7">
                        A workspace holds your brand guidelines. Give it your company or team name.
                    </p>
                    <button
                        onClick={() => setShowCreateWorkspace(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <Plus size={18} />
                        Create workspace
                    </button>
                </div>

                {/* Create Workspace Modal */}
                {showCreateWorkspace && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Workspace</h3>
                                <input
                                    type="text"
                                    placeholder="Workspace name"
                                    value={createWorkspaceName}
                                    onChange={(e) => setCreateWorkspaceName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 mb-4"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                                />
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => { setShowCreateWorkspace(false); setCreateWorkspaceName('') }}
                                        className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateWorkspace}
                                        disabled={creatingWorkspace || !createWorkspaceName.trim()}
                                        className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
                                    >
                                        {creatingWorkspace ? 'Creating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-md">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Could not load dashboard</h2>
                    <p className="text-sm text-gray-600 mb-6">{loadError}</p>
                    <button
                        onClick={() => { setLoading(true); loadBrands() }}
                        className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-[#FAFAFA] font-sans selection:bg-black selection:text-white">
            {/* Sidebar - Clean detached design */}
            <aside className="hidden md:flex w-64 flex-col fixed top-0 bottom-0 left-0 z-30 p-6">
                <div className="flex items-center gap-2 font-bold text-xl mb-12">
                    <img src="/guidr-logo.png" alt="Guidr" className="h-7" />
                </div>

                <div className="space-y-1">
                    <SidebarItem icon={Briefcase} label="Brand Guidelines" active />
                    <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-black/5 hover:text-gray-900 transition-colors text-sm font-medium">
                        <Settings size={20} />
                        Settings
                    </Link>
                </div>

                <div className="mt-auto pt-4 space-y-4">
                    {/* Account Switcher */}
                    <div className="relative group">
                        <button
                            onClick={() => setShowWorkspaceMenu(v => !v)}
                            className="flex items-center gap-3 w-full p-3 hover:bg-black/5 rounded-xl transition-colors text-sm font-medium text-gray-700"
                        >
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                {currentAccount?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="flex-1 text-left truncate">{currentAccount?.name}</span>
                            <ChevronDown size={16} className={`transition-transform duration-200 text-gray-400 group-hover:text-gray-600 ${showWorkspaceMenu ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatedDropdown isOpen={showWorkspaceMenu} onClose={() => setShowWorkspaceMenu(false)} origin="bottom-left" className="bottom-full left-0 right-0 mb-2 w-full">
                            <div className="bg-white/80 backdrop-blur-xl border border-black/5 rounded-2xl shadow-float p-2 text-sm overflow-hidden">
                                {accounts.filter(a => a.id !== currentAccount?.id).map(account => (
                                    <button
                                        key={account.id}
                                        onClick={() => { switchAccount(account.id); setShowWorkspaceMenu(false) }}
                                        className="flex items-center gap-3 w-full p-2 hover:bg-black/5 rounded-lg text-left transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold border border-black/5">
                                            {account.name?.charAt(0) || 'A'}
                                        </div>
                                        <span className="truncate font-medium text-gray-700">{account.name}</span>
                                    </button>
                                ))}
                                {accounts.length === 0 && (
                                    <p className="p-3 text-xs text-gray-400 text-center font-medium">No other workspaces</p>
                                )}
                                <div className="h-px bg-black/5 my-2" />
                                <button
                                    onClick={() => { setShowCreateWorkspace(true); setShowWorkspaceMenu(false) }}
                                    className="flex items-center justify-center gap-2 w-full p-2 hover:bg-black text-black hover:text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Plus size={16} />
                                    New Workspace
                                </button>
                            </div>
                        </AnimatedDropdown>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-3 bg-white border border-black/5 rounded-2xl shadow-sm">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold border border-white">
                            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.email}</p>
                            <p className="text-xs text-gray-500 font-medium truncate">{currentAccount?.role || 'Member'}</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 md:pl-0 max-w-[1400px] w-full">
                <div className="bg-white rounded-[32px] min-h-[calc(100vh-4rem)] md:min-h-full border border-black/5 shadow-sm p-6 md:p-12">
                    
                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">Brand Guidelines</h1>
                            <p className="text-gray-500 text-sm font-medium">Manage and organize your brand assets.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <AnimatedTabs 
                                tabs={[
                                    { id: 'all', label: 'All' },
                                    { id: 'published', label: 'Published' },
                                    { id: 'draft', label: 'Drafts' }
                                ]}
                                activeTab={filter}
                                onChange={setFilter}
                            />
                            
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="flex items-center justify-center gap-2 px-6 py-2 h-[36px] bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all shadow-float hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Plus size={16} />
                                <span className="hidden sm:inline">Create Brand</span>
                            </button>
                        </div>
                    </div>

                    {/* Brands Grid */}
                    {filteredBrands.length === 0 ? (
                        <div className="text-center py-32 rounded-[32px] border border-dashed border-black/10 bg-gray-50/50">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-black/5 flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {filter === 'all' ? 'No brands yet' : `No ${filter} brands`}
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                {filter === 'all' ? 'Start by creating your first brand project to build out its guidelines.' : `You don't have any ${filter} brands matching this filter.`}
                            </p>
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="inline-flex items-center gap-2 text-black font-semibold hover:bg-black/5 px-6 py-3 rounded-full transition-colors"
                            >
                                <Plus size={18} />
                                Create your first brand
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {filteredBrands.map((brand) => (
                                <TiltCard key={brand.id} onClick={() => navigate(getEditorPath(brand.id))}>
                                    {/* Card Cover */}
                                    <div
                                        className="h-48 w-full relative flex flex-col justify-between p-4"
                                        style={{
                                            backgroundColor: brand.primary_color || '#f3f4f6',
                                            backgroundImage: brand.primary_color ? `linear-gradient(135deg, ${brand.primary_color}20 0%, ${brand.primary_color}80 100%)` : 'none'
                                        }}
                                    >
                                        <div className="flex justify-between items-start z-10 relative">
                                            {brand.published ? (
                                                <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-white/90 text-black backdrop-blur-sm shadow-sm border border-black/5">
                                                    Published
                                                </span>
                                            ) : <div></div>}
                                            
                                            {/* ⋯ Menu */}
                                            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
                                                <button
                                                    className="p-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white hover:scale-105 text-gray-700 transition-all shadow-sm border border-black/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenMenuId(openMenuId === brand.id ? null : brand.id)
                                                    }}
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>
                                                <AnimatedDropdown isOpen={openMenuId === brand.id} onClose={() => setOpenMenuId(null)} origin="top-right" className="right-0 top-12 w-48">
                                                    <div className="bg-white/90 backdrop-blur-2xl border border-black/5 rounded-2xl shadow-float p-2 text-sm overflow-hidden flex flex-col gap-1">
                                                        <button
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-black/5 hover:text-black rounded-xl transition-colors font-medium"
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleEditClick(brand) }}
                                                        >
                                                            <Pencil size={16} /> Edit settings
                                                        </button>
                                                        {brand.published && (
                                                            <a
                                                                href={getBrandUrl(brand.slug || brand.id)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-black/5 hover:text-black rounded-xl transition-colors font-medium"
                                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                                                            >
                                                                <ExternalLink size={16} /> View live
                                                            </a>
                                                        )}
                                                        {accounts.length > 1 && (
                                                            <button
                                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-black/5 hover:text-black rounded-xl transition-colors font-medium"
                                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setTransferBrandId(brand.id); setShowTransferModal(true) }}
                                                            >
                                                                <ArrowRightLeft size={16} /> Transfer
                                                            </button>
                                                        )}
                                                        <div className="h-px bg-black/5 my-1" />
                                                        <button
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                                                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleDeleteClick(brand.id, brand.name) }}
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </AnimatedDropdown>
                                            </div>
                                        </div>

                                        {brand.banner_url && (
                                            <img
                                                src={brand.banner_url}
                                                alt={brand.name}
                                                className="absolute inset-0 w-full h-full object-cover rounded-t-2xl opacity-90 mix-blend-overlay"
                                            />
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-5 flex-1 w-full bg-white relative z-10 rounded-b-2xl flex flex-col justify-center">
                                        <h3 className="text-lg font-bold text-gray-900 truncate mb-1" title={brand.name}>
                                            {brand.name}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium">
                                            Last updated {new Date(brand.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </TiltCard>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Creation Modal */}
            <AnimatedModal isOpen={showNewModal} onClose={() => { setShowNewModal(false); resetForm(); }}>
                <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] w-full shadow-float border border-white/50 overflow-hidden">
                    <div className="px-8 py-6 flex justify-between items-center border-b border-black/5">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create Brand</h2>
                        <button onClick={() => { setShowNewModal(false); resetForm(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 transition-colors">✕</button>
                    </div>

                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* 1. Banner & Name */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Cover Banner</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-black/20 hover:bg-gray-50/50 transition-colors overflow-hidden relative group"
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={handleBannerUpload}
                                    />
                                    {uploadingBanner ? (
                                        <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
                                    ) : newBrand.bannerUrl ? (
                                        <>
                                            <img src={newBrand.bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur text-black text-sm font-medium px-4 py-2 rounded-full transition-opacity shadow-sm">Change Cover</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center transition-transform duration-300 group-hover:scale-105">
                                            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                                                <Upload size={20} />
                                            </div>
                                            <span className="text-sm text-gray-900 font-semibold block">Upload Banner</span>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">Recommended: 1920×1080px</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Name</label>
                                <input
                                    type="text"
                                    value={newBrand.name}
                                    onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 2. Color Theme */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Color</label>
                            <div className="flex gap-3 flex-wrap">
                                {COLOR_PRESETS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewBrand({ ...newBrand, color })}
                                        className={`w-12 h-12 rounded-full transition-all duration-300 ${newBrand.color === color ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-black' : 'hover:scale-105 border border-black/5'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div className="relative transition-transform duration-300 hover:scale-105">
                                    <input
                                        type="color"
                                        value={newBrand.color}
                                        onChange={(e) => setNewBrand({ ...newBrand, color: e.target.value })}
                                        className="w-12 h-12 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                    />
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 pointer-events-none">
                                        <Plus size={20} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Typography Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Typography</label>
                            
                            {/* Custom Font Upload */}
                            <div className="mb-4">
                                <div
                                    onClick={() => fontInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-2xl p-5 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${newBrand.customFontUrl ? 'border-black bg-black text-white shadow-float' : 'border-gray-200 hover:border-black/20 hover:bg-gray-50/50 text-gray-600'}`}
                                >
                                    <input
                                        type="file"
                                        ref={fontInputRef}
                                        className="hidden"
                                        accept=".ttf,.otf,.woff,.woff2"
                                        onChange={handleFontUpload}
                                    />
                                    {uploadingFont ? (
                                        <Loader2 className="animate-spin" />
                                    ) : newBrand.customFontUrl ? (
                                        <>
                                            <Type className="w-5 h-5" />
                                            <span className="font-semibold">Custom Font: {newBrand.customFontName || 'Uploaded'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="font-medium">Upload Font Family (.ttf, .otf)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Google Fonts List */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 pl-1">Or choose a preset</p>
                                {GOOGLE_FONTS.map(font => (
                                    <button
                                        key={font.value}
                                        onClick={() => setNewBrand({ ...newBrand, font: font.value, customFontUrl: null })}
                                        className={`w-full px-5 py-4 text-left rounded-2xl border transition-all duration-300 flex items-center justify-between group ${newBrand.font === font.value && !newBrand.customFontUrl ? 'border-black bg-gray-900 text-white shadow-md' : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-sm'}`}
                                    >
                                        <div>
                                            <span className={`text-base font-semibold block ${newBrand.font === font.value && !newBrand.customFontUrl ? 'text-white' : 'text-gray-900 group-hover:text-black'}`}>{font.label}</span>
                                            <span className={`text-xs mt-0.5 ${newBrand.font === font.value && !newBrand.customFontUrl ? 'text-gray-300' : 'text-gray-500'}`}>{font.category}</span>
                                        </div>
                                        <span style={{ fontFamily: font.value }} className={`text-2xl ${newBrand.font === font.value && !newBrand.customFontUrl ? 'text-white' : 'text-gray-900'}`}>Ag</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-gray-50/50">
                        <button
                            onClick={() => { setShowNewModal(false); resetForm(); }}
                            className="px-6 py-3 text-gray-600 font-semibold hover:text-black transition-colors rounded-xl hover:bg-black/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={createBrand}
                            disabled={!newBrand.name.trim() || creating || uploadingFont}
                            className="px-8 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-float hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {creating ? 'Creating...' : 'Create Brand'}
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Edit Modal */}
            <AnimatedModal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                <div className="bg-white/95 backdrop-blur-2xl rounded-[32px] w-full shadow-float border border-white/50 overflow-hidden">
                    <div className="px-8 py-6 flex justify-between items-center border-b border-black/5">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Brand Settings</h2>
                        <button onClick={() => setShowEditModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-gray-500 transition-colors">✕</button>
                    </div>

                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        {/* 1. Banner & Name */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Cover Banner</label>
                                <div
                                    onClick={() => editBannerInputRef.current?.click()}
                                    className="w-full aspect-[21/9] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-black/20 hover:bg-gray-50/50 transition-colors overflow-hidden relative group"
                                >
                                    <input
                                        type="file"
                                        ref={editBannerInputRef}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => handleBannerUpload(e, 'edit')}
                                    />
                                    {uploadingBanner ? (
                                        <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
                                    ) : editBrand.bannerUrl ? (
                                        <>
                                            <img src={editBrand.bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur text-black text-sm font-medium px-4 py-2 rounded-full transition-opacity shadow-sm">Change Cover</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center transition-transform duration-300 group-hover:scale-105">
                                            <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-3 text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                                                <Upload size={20} />
                                            </div>
                                            <span className="text-sm text-gray-900 font-semibold block">Upload Banner</span>
                                            <p className="text-xs text-gray-500 mt-1 font-medium">Recommended: 1920×1080px</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Name</label>
                                <input
                                    type="text"
                                    value={editBrand.name}
                                    onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                                    placeholder="e.g. Acme Corp"
                                    className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 2. Color Theme */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Brand Color</label>
                            <div className="flex gap-3 flex-wrap">
                                {COLOR_PRESETS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setEditBrand({ ...editBrand, color })}
                                        className={`w-12 h-12 rounded-full transition-all duration-300 ${editBrand.color === color ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-black' : 'hover:scale-105 border border-black/5'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                                <div className="relative transition-transform duration-300 hover:scale-105">
                                    <input
                                        type="color"
                                        value={editBrand.color}
                                        onChange={(e) => setEditBrand({ ...editBrand, color: e.target.value })}
                                        className="w-12 h-12 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                    />
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 pointer-events-none">
                                        <Plus size={20} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Typography Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-3">Typography</label>

                            {/* Custom Font Upload */}
                            <div className="mb-4">
                                <div
                                    onClick={() => editFileInputRef.current?.click()}
                                    className={`w-full border-2 border-dashed rounded-2xl p-5 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 ${editBrand.customFontUrl ? 'border-black bg-black text-white shadow-float' : 'border-gray-200 hover:border-black/20 hover:bg-gray-50/50 text-gray-600'}`}
                                >
                                    <input
                                        type="file"
                                        ref={editFileInputRef}
                                        className="hidden"
                                        accept=".ttf,.otf,.woff,.woff2"
                                        onChange={(e) => handleFontUpload(e, 'edit')}
                                    />
                                    {uploadingFont ? (
                                        <Loader2 className="animate-spin" />
                                    ) : editBrand.customFontUrl ? (
                                        <>
                                            <Type className="w-5 h-5" />
                                            <span className="font-semibold">Custom Font: {editBrand.customFontName || 'Uploaded'}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 text-gray-400" />
                                            <span className="font-medium">Upload Font Family (.ttf, .otf)</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Google Fonts List */}
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3 pl-1">Or choose a preset</p>
                                {GOOGLE_FONTS.map(font => (
                                    <button
                                        key={font.value}
                                        onClick={() => setEditBrand({ ...editBrand, font: font.value, customFontUrl: null })}
                                        className={`w-full px-5 py-4 text-left rounded-2xl border transition-all duration-300 flex items-center justify-between group ${editBrand.font === font.value && !editBrand.customFontUrl ? 'border-black bg-gray-900 text-white shadow-md' : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-sm'}`}
                                    >
                                        <div>
                                            <span className={`text-base font-semibold block ${editBrand.font === font.value && !editBrand.customFontUrl ? 'text-white' : 'text-gray-900 group-hover:text-black'}`}>{font.label}</span>
                                            <span className={`text-xs mt-0.5 ${editBrand.font === font.value && !editBrand.customFontUrl ? 'text-gray-300' : 'text-gray-500'}`}>{font.category}</span>
                                        </div>
                                        <span style={{ fontFamily: font.value }} className={`text-2xl ${editBrand.font === font.value && !editBrand.customFontUrl ? 'text-white' : 'text-gray-900'}`}>Ag</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-black/5 flex justify-end gap-3 bg-gray-50/50">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="px-6 py-3 text-gray-600 font-semibold hover:text-black transition-colors rounded-xl hover:bg-black/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={updateBrandSettings}
                            disabled={!editBrand.name.trim() || saving || uploadingFont}
                            className="px-8 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-float hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Delete Confirmation Modal */}
            <AnimatedModal isOpen={deleteConfirm.show} onClose={() => setDeleteConfirm({ show: false, brandId: null, brandName: '' })} maxWidth="max-w-md">
                <div className="bg-white rounded-[32px] p-8 text-center shadow-float border border-black/5">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Delete Brand</h3>
                    <p className="text-gray-500 mb-8 font-medium">
                        Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteConfirm.brandName}"</span>?<br/>
                        This action cannot be undone.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => setDeleteConfirm({ show: false, brandId: null, brandName: '' })}
                            className="flex-1 px-6 py-3.5 text-gray-700 font-semibold hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="flex-1 px-6 py-3.5 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Create Workspace Modal */}
            <AnimatedModal isOpen={showCreateWorkspace} onClose={() => { setShowCreateWorkspace(false); setCreateWorkspaceName('') }} maxWidth="max-w-md">
                <div className="bg-white rounded-[32px] p-8 shadow-float border border-black/5">
                    <div className="w-12 h-12 bg-black/5 text-black rounded-2xl flex items-center justify-center mb-6">
                        <Plus size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">New Workspace</h3>
                    <p className="text-gray-500 mb-6 font-medium text-sm">Create a separate environment for your brands.</p>
                    <input
                        type="text"
                        placeholder="Workspace name"
                        value={createWorkspaceName}
                        onChange={(e) => setCreateWorkspaceName(e.target.value)}
                        className="w-full px-5 py-4 bg-gray-50 border border-black/5 rounded-2xl focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-gray-900 placeholder:text-gray-400 font-medium mb-8"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                    />
                    <div className="flex gap-3 justify-end">
                        <button
                            onClick={() => { setShowCreateWorkspace(false); setCreateWorkspaceName('') }}
                            className="px-6 py-3 text-gray-600 font-semibold hover:text-black transition-colors rounded-xl hover:bg-black/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateWorkspace}
                            disabled={creatingWorkspace || !createWorkspaceName.trim()}
                            className="px-8 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                        >
                            {creatingWorkspace ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Transfer Brand Modal */}
            <AnimatedModal isOpen={showTransferModal && transferBrandId} onClose={() => { setShowTransferModal(false); setTransferBrandId(null) }} maxWidth="max-w-md">
                <div className="bg-white rounded-[32px] p-8 shadow-float border border-black/5">
                    <div className="w-16 h-16 bg-gray-100 text-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ArrowRightLeft size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center tracking-tight">Transfer Brand</h3>
                    <p className="text-gray-500 font-medium text-center mb-8">
                        Select a workspace to move this brand to.
                    </p>
                    <div className="space-y-3">
                        {accounts.filter(a => a.id !== currentAccount?.id).map(account => (
                            <button
                                key={account.id}
                                onClick={() => handleTransferBrand(transferBrandId, account.id)}
                                className="flex items-center gap-4 w-full p-4 hover:bg-gray-50 rounded-2xl text-left border border-gray-200 transition-all hover:border-black hover:shadow-sm group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white text-sm font-bold shadow-sm transition-transform group-hover:scale-105">
                                    {account.name?.charAt(0) || 'A'}
                                </div>
                                <span className="font-semibold text-gray-900 text-lg">{account.name}</span>
                            </button>
                        ))}
                        {accounts.filter(a => a.id !== currentAccount?.id).length === 0 && (
                            <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium">No other workspaces available.</p>
                                <p className="text-gray-400 text-sm mt-1">Create one first using the sidebar menu.</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => { setShowTransferModal(false); setTransferBrandId(null) }}
                            className="px-8 py-3.5 text-gray-600 font-semibold hover:text-black hover:bg-black/5 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </AnimatedModal>
        </div>
    )
}

// eslint-disable-next-line no-unused-vars -- Icon is used as a JSX tag below; core no-unused-vars doesn't track that for params
function SidebarItem({ icon: Icon, label, active = false }) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <Icon size={20} className={`flex-shrink-0 ${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className="whitespace-nowrap">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />}
        </button>
    )
}
