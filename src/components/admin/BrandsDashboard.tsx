'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, uploadFile } from '@/lib/supabase'
import { createDefaultSections } from '@/data/defaultSections'
import { useAuth } from '@/contexts/AuthContext'
import {
    Plus, Settings, Trash2, Loader2, ExternalLink,
    Compass, Briefcase, LayoutGrid, Upload, Type, ChevronDown, LogOut, User
} from 'lucide-react'

// Types for TypeScript
interface Brand {
    id: string
    name: string
    logo_url: string | null
    banner_url: string | null
    primary_color: string | null
    font_family: string | null
    created_at: string
    published: any | null
    slug: string
    account_id: string
    workspace_id?: string // New field
    draft?: any
}

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
    const router = useRouter()
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewModal, setShowNewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingBrandId, setEditingBrandId] = useState<string | null>(null)
    const [filter, setFilter] = useState('all')
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, brandId: string | null, brandName: string }>({ show: false, brandId: null, brandName: '' })

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
        bannerUrl: null as string | null,
        customFontUrl: null as string | null,
        customFontName: null as string | null
    })

    const [editBrand, setEditBrand] = useState({
        name: '',
        slug: '',
        color: '#0066FF',
        font: 'Geist',
        bannerUrl: null as string | null,
        customFontUrl: null as string | null,
        customFontName: null as string | null
    })



    const [creating, setCreating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploadingFont, setUploadingFont] = useState(false)
    const [uploadingBanner, setUploadingBanner] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const bannerInputRef = useRef<HTMLInputElement>(null)
    const editFileInputRef = useRef<HTMLInputElement>(null)
    const editBannerInputRef = useRef<HTMLInputElement>(null)

    // Simplified auth usage - assuming extended AuthContext isn't fully ready with "accounts" yet based on previous file reads
    // Adapting to what we saw in AuthContext.tsx earlier (user, session, etc.)
    // If 'accounts'/multitenancy was in the original but not migrated yet, we might need to simplify to just 'user'
    // For now, I will comment out multi-tenancy bits if they break, preserving the UI structure.
    // Simplify auth usage
    // Simplify auth usage
    const { user, currentAccount, accounts, createAccount, signOut } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
    const [newAccountName, setNewAccountName] = useState('')
    const [isCreatingAccount, setIsCreatingAccount] = useState(false)

    // Load brands when user or account changes
    useEffect(() => {
        loadBrands()
    }, [user, currentAccount])

    // Auto-create default account if none exist (Seamless onboarding)
    // DISABLED: Logic was masking real issue (workspaces exist but weren't selected)
    /*
    const hasAttemptedCreate = useRef(false)
    useEffect(() => {
        const autoCreateAccount = async () => {
            // ... (disabled)
        }
        autoCreateAccount()
    }, [user, accounts, currentAccount, loading, isCreatingAccount, createAccount])
    */

    // Manual creation handler (still used if we keep the "Create" button elsewhere, but modal is removed from auto-flow)
    const handleCreateAccount = async () => {
        if (!newAccountName.trim()) return
        setIsCreatingAccount(true)
        try {
            const slug = newAccountName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            const { error } = await createAccount(newAccountName, slug)
            if (error) throw error
            setShowCreateAccountModal(false)
        } catch (err: any) {
            alert('Failed to create account: ' + err.message)
        } finally {
            setIsCreatingAccount(false)
        }
    }

    const loadBrands = async () => {
        if (!user) {
            setLoading(false)
            return
        }

        // If we have a user but no workspace/account yet, wait
        if (!currentAccount) {
            console.log("Waiting for workspace assignment...")
            // Don't set loading false yet if we think we should have one
            if (accounts.length > 0) return
            setLoading(false)
            return
        }

        console.log("Loading brands for workspace:", currentAccount.id)

        try {
            // STRICT QUERY: Only fetch for the active workspace
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .eq('workspace_id', currentAccount.id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Supabase select error:", error)
                throw error
            }

            console.log("Loaded brands:", data?.length || 0)
            setBrands(data || [])
            setError(null)

        } catch (err: any) {
            console.error('Failed to load brands:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>, type = 'new') => {
        // ... existing implementation ...
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingFont(true)
        try {
            // Using the uploadFile helper from lib/supabase if it exists, otherwise inline
            // We saw uploadFile imported in original. We need to check if it exists in new lib/supabase
            // For safety, implementing standard upload here if needed or relying on the import.
            // The original used: import { supabase, uploadFile } from '../../lib/supabase'
            // We'll try to use it, but if it fails we might need to fix lib/supabase.

            // Re-implementing simplified upload to be safe since we didn't inspect lib/supabase deeply for 'uploadFile' export
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `fonts/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(filePath)

            const url = publicUrl
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
        } catch (err: any) {
            alert('Failed to upload font: ' + err.message)
        } finally {
            setUploadingFont(false)
        }
    }

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, type = 'new') => {
        // ... existing implementation ...
        const file = e.target.files?.[0]
        if (!file) return

        setUploadingBanner(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `banners/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('brand-assets')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(filePath)

            const url = publicUrl

            if (type === 'new') {
                setNewBrand({ ...newBrand, bannerUrl: url })
            } else {
                setEditBrand({ ...editBrand, bannerUrl: url })
            }
        } catch (err: any) {
            alert('Failed to upload banner: ' + err.message)
        } finally {
            setUploadingBanner(false)
        }
    }


    const createBrand = async () => {
        if (!newBrand.name.trim()) return

        if (!currentAccount?.id) {
            alert('No active account. Please refresh or select an account.')
            return
        }

        setCreating(true)

        try {
            const sections = createDefaultSections()
            const introSection = sections.find(s => s.slug === 'introduction')
            if (introSection && introSection.blocks[0]) {
                // @ts-ignore
                if (!introSection.blocks[0].data) introSection.blocks[0].data = {}
                // @ts-ignore
                introSection.blocks[0].data.text = `Welcome to ${newBrand.name}`
            }

            const slug = newBrand.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

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
                    slug: slug,
                    primary_color: newBrand.color,
                    font_family: newBrand.font,
                    banner_url: newBrand.bannerUrl,

                    draft: defaultDraft,
                    published: null,
                    workspace_id: currentAccount.id,
                    account_id: currentAccount.id // Keep for legacy until column is dropped
                })
                .select()
                .single()

            if (error) throw error

            setShowNewModal(false)
            resetForm()
            router.push(`/admin/brand/${data.id}/introduction`)
        } catch (err: any) {
            alert('Failed to create brand: ' + err.message)
        } finally {
            setCreating(false)
        }
    }

    const handleEditClick = (brand: Brand) => {
        setEditingBrandId(brand.id)
        setEditBrand({
            name: brand.name,
            slug: brand.slug || '', // Add slug to edit state
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
                    slug: editBrand.slug, // Update slug
                    primary_color: editBrand.color,
                    font_family: editBrand.font,
                    banner_url: editBrand.bannerUrl,
                    draft: updatedDraft
                })
                .eq('id', editingBrandId)

            if (error) throw error

            setShowEditModal(false)
            loadBrands() // Refresh the list
        } catch (err: any) {
            alert('Failed to update brand: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const resetForm = () => {
        setNewBrand({ name: '', color: '#0066FF', font: 'Geist', bannerUrl: null, customFontUrl: null, customFontName: null })
    }

    const handleDeleteClick = (brandId: string, brandName: string) => {
        setDeleteConfirm({ show: true, brandId, brandName })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.brandId) return

        try {
            await supabase.from('brands').delete().eq('id', deleteConfirm.brandId)
            setBrands(brands.filter(b => b.id !== deleteConfirm.brandId))
            setDeleteConfirm({ show: false, brandId: null, brandName: '' })
        } catch (err: any) {
            alert('Failed to delete: ' + err.message)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            {/* Sidebar - hidden on mobile */}
            <aside className="hidden md:flex w-64 bg-white border-r border-gray-100 flex-shrink-0 flex-col fixed top-0 bottom-0 left-0 z-30">
                <div className="p-6">
                    <div className="flex items-center gap-2 font-bold text-xl mb-8">
                        {/* Ensure safe path for image */}
                        <img src="/guidr-logo.png" alt="Guidr" className="h-8" />
                    </div>

                    <div className="space-y-1">
                        <SidebarItem icon={Briefcase} label="Brand Guidelines" active />
                        <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                            <Settings size={18} />
                            Settings
                        </Link>
                    </div>
                </div>

                <div className="mt-auto p-4 border-t border-gray-100 space-y-2">
                    {/* Account Switcher - Simplified for UI preservation */}
                    {accounts.length > 0 && (
                        <div className="relative group">
                            <button className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium text-gray-600">
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {currentAccount?.name?.charAt(0) || 'A'}
                                </div>
                                <span className="flex-1 text-left truncate">{currentAccount?.name}</span>
                                <ChevronDown size={14} />
                            </button>
                        </div>
                    )}

                    {/* User Profile */}
                    <div className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                            {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                            <p className="text-xs text-gray-400 truncate">{currentAccount?.role || 'Member'}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Sign out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8">
                {/* Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        {['all', 'published', 'draft'].map(filterOption => (
                            <button
                                key={filterOption}
                                onClick={() => setFilter(filterOption)}
                                className={`px-4 py-2 capitalize font-medium rounded-lg text-sm transition-all ${filter === filterOption
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {filterOption === 'draft' ? 'Drafts' : filterOption === 'all' ? 'All' : 'Published'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowNewModal(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white font-medium rounded-full hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus size={18} />
                        Create
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <div className="text-red-500 mt-0.5">⚠️</div>
                        <div>
                            <h3 className="text-sm font-semibold text-red-900">Failed to load brands</h3>
                            <p className="text-sm text-red-700">{error}</p>
                            <p className="text-xs text-red-600 mt-1">Please check the console for more details.</p>
                        </div>
                    </div>
                )}

                {/* Brands Grid */}
                {filteredBrands.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {filter === 'all' ? 'No brand guidelines yet' : `No ${filter} projects`}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filter === 'all' ? 'Create your first brand project to get started.' : `You don't have any ${filter} projects yet.`}
                        </p>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="text-indigo-600 font-medium hover:underline"
                        >
                            Create now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBrands.map((brand) => (
                            <div
                                key={brand.id}
                                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => router.push(`/admin/brand/${brand.id}/introduction`)}
                            >
                                {/* Card Cover */}
                                <div
                                    className="h-48 w-full relative flex items-center justify-center"
                                    style={{
                                        backgroundColor: brand.primary_color || '#f3f4f6',
                                        backgroundImage: `linear-gradient(135deg, ${brand.primary_color}20 0%, ${brand.primary_color}80 100%)`
                                    }}
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-gray-600 transition-colors shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(brand) }}
                                        >
                                            <Settings size={16} />
                                        </button>
                                        <button
                                            className="p-2 bg-white/90 backdrop-blur rounded-full hover:bg-white text-red-500 transition-colors shadow-sm"
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(brand.id, brand.name) }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Banner as Full Background */}
                                    {brand.banner_url && (
                                        <img
                                            src={brand.banner_url}
                                            alt={brand.name}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="p-4 bg-white relative">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            {brand.published && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 border border-green-200">
                                                    Published
                                                </span>
                                            )}
                                            <h3 className="text-sm font-semibold text-gray-900 truncate max-w-[150px]" title={brand.name}>
                                                {brand.name}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-500">
                                            Last updated {new Date(brand.created_at).toLocaleDateString()}
                                        </p>

                                        {/* {(brand.draft?.sections?.length || 0)} sections */}
                                    </div>

                                    {/* Hover "Enter" Action */}
                                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 py-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="font-medium text-gray-900">Edit Project</span>
                                        <ExternalLink size={16} className="text-gray-900" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Creation Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Create Brand Guideline</h2>
                            <button onClick={() => { setShowNewModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* 1. Banner & Name */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Banner</label>
                                    <div
                                        onClick={() => bannerInputRef.current?.click()}
                                        className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors overflow-hidden relative"
                                    >
                                        <input
                                            type="file"
                                            ref={bannerInputRef}
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => handleBannerUpload(e, 'new')}
                                        />
                                        {uploadingBanner ? (
                                            <Loader2 className="animate-spin text-gray-400" />
                                        ) : newBrand.bannerUrl ? (
                                            <img src={newBrand.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                                                <span className="text-sm text-gray-500 font-medium">Upload Banner Image</span>
                                                <p className="text-xs text-gray-400 mt-1">Recommended: 1920×1080px</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                                    <input
                                        type="text"
                                        value={newBrand.name}
                                        onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* 2. Color Theme */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {COLOR_PRESETS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setNewBrand({ ...newBrand, color })}
                                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${newBrand.color === color ? 'border-black ring-2 ring-gray-100' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={newBrand.color}
                                            onChange={(e) => setNewBrand({ ...newBrand, color: e.target.value })}
                                            className="w-10 h-10 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                        />
                                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white pointer-events-none">
                                            <Plus size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Typography Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Typography</label>

                                {/* Custom Font Upload */}
                                <div className="mb-4">
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors ${newBrand.customFontUrl ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".ttf,.otf,.woff,.woff2"
                                            onChange={(e) => handleFontUpload(e, 'new')}
                                        />
                                        {uploadingFont ? (
                                            <Loader2 className="animate-spin text-gray-400" />
                                        ) : newBrand.customFontUrl ? (
                                            <>
                                                <Type className="text-indigo-600" />
                                                <span className="text-indigo-900 font-medium">Custom Font: {newBrand.customFontName}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-gray-400" />
                                                <span className="text-gray-500">Upload Font Family (.ttf, .otf)</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Google Fonts List */}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Or choose from Google Fonts</p>
                                    {GOOGLE_FONTS.map(font => (
                                        <button
                                            key={font.value}
                                            onClick={() => setNewBrand({ ...newBrand, font: font.value, customFontUrl: null })}
                                            className={`w-full px-4 py-3 text-left rounded-xl border transition-all flex items-center justify-between ${newBrand.font === font.value && !newBrand.customFontUrl ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 block">{font.label}</span>
                                                <span className="text-xs text-gray-500">{font.category}</span>
                                            </div>
                                            <span style={{ fontFamily: font.value }} className="text-lg text-gray-800">Ag</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => { setShowNewModal(false); resetForm(); }}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createBrand}
                                disabled={!newBrand.name.trim() || creating || uploadingFont}
                                className="px-8 py-2.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
                            >
                                {creating ? 'Creating...' : 'Create Brand'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-900">Brand Settings</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* 1. Banner & Name */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Banner</label>
                                    <div
                                        onClick={() => editBannerInputRef.current?.click()}
                                        className="w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors overflow-hidden relative"
                                    >
                                        <input
                                            type="file"
                                            ref={editBannerInputRef}
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={(e) => handleBannerUpload(e, 'edit')}
                                        />
                                        {uploadingBanner ? (
                                            <Loader2 className="animate-spin text-gray-400" />
                                        ) : editBrand.bannerUrl ? (
                                            <img src={editBrand.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-center">
                                                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                                                <span className="text-sm text-gray-500 font-medium">Upload Banner Image</span>
                                                <p className="text-xs text-gray-400 mt-1">Recommended: 1920×1080px</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                                    <input
                                        type="text"
                                        value={editBrand.name}
                                        onChange={(e) => setEditBrand({ ...editBrand, name: e.target.value })}
                                        placeholder="e.g. Acme Corp"
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">URL Slug</label>
                                    <div className="flex items-center">
                                        <span className="text-gray-500 bg-gray-50 px-4 py-3 border border-r-0 border-gray-200 rounded-l-xl text-sm">/brand/</span>
                                        <input
                                            type="text"
                                            value={editBrand.slug}
                                            onChange={(e) => setEditBrand({ ...editBrand, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            placeholder="brand-slug"
                                            className="w-full px-4 py-3 bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl focus:ring-2 focus:ring-black outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Unique identifier for your brand's public link.</p>
                                </div>
                            </div>

                            {/* 2. Color Theme */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Color</label>
                                <div className="flex gap-3 flex-wrap">
                                    {COLOR_PRESETS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditBrand({ ...editBrand, color })}
                                            className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${editBrand.color === color ? 'border-black ring-2 ring-gray-100' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={editBrand.color}
                                            onChange={(e) => setEditBrand({ ...editBrand, color: e.target.value })}
                                            className="w-10 h-10 rounded-full overflow-hidden opacity-0 absolute inset-0 cursor-pointer"
                                        />
                                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white pointer-events-none">
                                            <Plus size={16} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Typography Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Typography</label>

                                {/* Custom Font Upload */}
                                <div className="mb-4">
                                    <div
                                        onClick={() => editFileInputRef.current?.click()}
                                        className={`w-full border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors ${editBrand.customFontUrl ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        <input
                                            type="file"
                                            ref={editFileInputRef}
                                            className="hidden"
                                            accept=".ttf,.otf,.woff,.woff2"
                                            onChange={(e) => handleFontUpload(e, 'edit')}
                                        />
                                        {uploadingFont ? (
                                            <Loader2 className="animate-spin text-gray-400" />
                                        ) : editBrand.customFontUrl ? (
                                            <>
                                                <Type className="text-indigo-600" />
                                                <span className="text-indigo-900 font-medium">Custom Font: {editBrand.customFontName || 'Uploaded'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-gray-400" />
                                                <span className="text-gray-500">Upload Font Family (.ttf, .otf)</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Google Fonts List */}
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Or choose from Google Fonts</p>
                                    {GOOGLE_FONTS.map(font => (
                                        <button
                                            key={font.value}
                                            onClick={() => setEditBrand({ ...editBrand, font: font.value, customFontUrl: null })}
                                            className={`w-full px-4 py-3 text-left rounded-xl border transition-all flex items-center justify-between ${editBrand.font === font.value && !editBrand.customFontUrl ? 'border-black bg-gray-50' : 'border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <div>
                                                <span className="text-sm font-medium text-gray-900 block">{font.label}</span>
                                                <span className="text-xs text-gray-500">{font.category}</span>
                                            </div>
                                            <span style={{ fontFamily: font.value }} className="text-lg text-gray-800">Ag</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={updateBrandSettings}
                                disabled={!editBrand.name.trim() || saving || uploadingFont}
                                className="px-8 py-2.5 bg-black text-white font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 transition-all shadow-sm hover:shadow"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Project?</h3>
                            <p className="text-gray-500 mb-6">
                                Are you sure you want to delete <span className="font-semibold text-gray-900">"{deleteConfirm.brandName}"</span>?
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setDeleteConfirm({ show: false, brandId: null, brandName: '' })}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-all shadow-sm hover:shadow"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Create Account Modal */}
            {showCreateAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8 text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Briefcase className="w-8 h-8 text-blue-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Workspace</h2>
                        <p className="text-gray-500 mb-8">
                            To start creating brand guidelines, you need to set up a workspace for your team.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                                    Workspace Name
                                </label>
                                <input
                                    type="text"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    placeholder="e.g. Acme Design"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={handleCreateAccount}
                                disabled={!newAccountName.trim() || isCreatingAccount}
                                className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isCreatingAccount ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Workspace'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function SidebarItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <Icon size={20} className={`flex-shrink-0 ${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span className="whitespace-nowrap">{label}</span>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />}
        </button>
    )
}
