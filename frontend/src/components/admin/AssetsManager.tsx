'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Upload, Trash2, Download, Check, X, Loader2, FileText, FileImage,
    FileArchive, Palette, Type as FontIcon, Paperclip,
    Plus, MoreVertical, LayoutGrid, List, Copy, Folder, ChevronRight, ArrowLeft, Home, Edit2
} from 'lucide-react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useBrandEditor } from '@/hooks/useBrandEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { cn } from '@/lib/utils'
import FolderAssetCard, { Asset } from './FolderAssetCard'

// Types
interface Section {
    id: string
    brand_id: string
    name: string
    order: number
}

// File type detection
const FILE_CATEGORIES: Record<string, { extensions: string[], icon: any, color: string, bg: string }> = {
    image: { extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'], icon: FileImage, color: 'text-blue-500', bg: 'bg-blue-50' },
    document: { extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'], icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    archive: { extensions: ['zip', 'rar', '7z', 'tar', 'gz'], icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' },
    design: { extensions: ['ai', 'psd', 'fig', 'sketch', 'xd', 'eps'], icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
    font: { extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'], icon: FontIcon, color: 'text-green-500', bg: 'bg-green-50' },
}

function getFileCategory(filename: string | undefined) {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
        if (config.extensions.includes(ext)) {
            return { category, ...config }
        }
    }
    return { category: 'other', icon: Paperclip, color: 'text-gray-500', bg: 'bg-gray-50' }
}

function formatFileSize(bytes: number | undefined) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Sortable Section Item
function SortableSectionItem({
    section,
    onEdit,
    onDelete,
    children
}: {
    section: Section,
    onEdit: (id: string, name: string) => void,
    onDelete: (id: string) => void,
    children: React.ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: section.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(section.name)

    const handleSave = () => {
        if (name.trim() && name !== section.name) {
            onEdit(section.id, name)
        }
        setIsEditing(false)
    }

    return (
        <div ref={setNodeRef} style={style} className="mb-8 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1">
                    <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-600 p-1 rounded">
                        <MoreVertical size={16} />
                    </div>
                    {isEditing ? (
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={e => e.key === 'Enter' && handleSave()}
                            autoFocus
                            className="h-8 max-w-sm"
                        />
                    ) : (
                        <h3 className="text-lg font-bold text-gray-900">{section.name}</h3>
                    )}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                        <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(section.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    )
}

export default function AssetsManager({ isAdmin = true, brandIdParam }: { isAdmin?: boolean, brandIdParam?: string }) {
    const params = useParams()
    const router = useRouter()
    // Resolving identifier: explicit param -> route param
    const identifier = brandIdParam || params.id as string || params.slug as string

    const [brand, setBrand] = useState<any>(null)
    const [assets, setAssets] = useState<Asset[]>([])
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)

    // Section management
    const [newSectionName, setNewSectionName] = useState('')
    const [isAddingSection, setIsAddingSection] = useState(false)

    // Folder nav
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        if (identifier) fetchData()
    }, [identifier])

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch brand
            const { data: brandData, error: brandError } = await supabase
                .from('brands')
                .select('id, name, logo_url, primary_color, banner_url')
                .or(`id.eq.${identifier},slug.eq.${identifier}`) // Try both
                .single()

            if (brandError) throw brandError
            setBrand(brandData)

            // Fetch assets and sections
            const [sectionsRes, assetsRes] = await Promise.all([
                supabase.from('collections').select('*').eq('brand_id', brandData.id).order('order', { ascending: true }),
                supabase.from('assets').select('*').eq('brand_id', brandData.id).order('created_at', { ascending: false })
            ])

            setSections(sectionsRes.data || [])
            setAssets(assetsRes.data || [])
        } catch (err) {
            console.error('Error fetching assets:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSection = async () => {
        if (!newSectionName.trim() || !brand) return
        try {
            const newSection = {
                brand_id: brand.id,
                name: newSectionName.trim(),
                order: sections.length
            }
            const { data, error } = await supabase.from('collections').insert(newSection).select().single()
            if (error) throw error
            setSections([...sections, data])
            setNewSectionName('')
            setIsAddingSection(false)
        } catch (err) {
            console.error('Failed to create section:', err)
        }
    }

    const handleDeleteSection = async (id: string) => {
        if (!confirm('Delete section? Files will be moved to Uncategorized.')) return
        try {
            await supabase.from('assets').update({ collection_id: null }).eq('collection_id', id)
            await supabase.from('collections').delete().eq('id', id)
            setSections(sections.filter(s => s.id !== id))
            setAssets(assets.map(a => a.collection_id === id ? { ...a, collection_id: null } : a)) // Optimistic move
        } catch (err) {
            console.error('Failed to delete section:', err)
        }
    }

    const handleUpdateSection = async (id: string, name: string) => {
        try {
            await supabase.from('collections').update({ name }).eq('id', id)
            setSections(sections.map(s => s.id === id ? { ...s, name } : s))
        } catch (err) {
            console.error('Failed to update section:', err)
        }
    }

    const handleSectionDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = sections.findIndex(s => s.id === active.id)
            const newIndex = sections.findIndex(s => s.id === over.id)
            const newSections = arrayMove(sections, oldIndex, newIndex)
            setSections(newSections)

            // Update order in DB
            for (let i = 0; i < newSections.length; i++) {
                await supabase.from('collections').update({ order: i }).eq('id', newSections[i].id)
            }
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string | null = null) => {
        const files = e.target.files
        if (!files || files.length === 0 || !brand) return
        setUploading(true)

        const effectiveSectionId = sectionId || (currentFolderId ? assets.find(a => a.id === currentFolderId)?.collection_id : null)

        try {
            for (const file of Array.from(files)) {
                const url = await uploadFile(file, 'media')
                const isImage = file.type.startsWith('image/')
                const { category } = getFileCategory(file.name)

                const { data: newAsset, error } = await supabase.from('assets').insert({
                    brand_id: brand.id,
                    name: file.name,
                    file_url: url,
                    thumbnail_url: isImage ? url : null,
                    file_type: file.type,
                    file_size: file.size,
                    category,
                    collection_id: effectiveSectionId,
                    parent_id: currentFolderId
                }).select().single()

                if (error) throw error
                if (newAsset) setAssets(prev => [newAsset, ...prev])
            }
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Upload failed')
        } finally {
            setUploading(false)
        }
    }

    const handleCreateFolder = async (sectionId: string | null = null) => {
        const name = prompt('Folder name:', 'New Folder')
        if (!name || !brand) return

        const effectiveSectionId = sectionId || (currentFolderId ? assets.find(a => a.id === currentFolderId)?.collection_id : null)

        try {
            const { data, error } = await supabase.from('assets').insert({
                brand_id: brand.id,
                name,
                is_folder: true,
                collection_id: effectiveSectionId,
                parent_id: currentFolderId
            }).select().single()
            if (error) throw error
            if (data) setAssets(prev => [data, ...prev])
        } catch (err) {
            console.error('Failed to create folder:', err)
        }
    }

    const handleDeleteAsset = async (id: string) => {
        if (!confirm('Delete this item?')) return
        try {
            // If file, delete from storage (omitted for brevity, assume Supabase triggers or standard deleteFile usage)
            const asset = assets.find(a => a.id === id)
            if (asset?.file_url) await deleteFile(asset.file_url, 'media').catch(console.error)

            await supabase.from('assets').delete().eq('id', id)
            setAssets(prev => prev.filter(a => a.id !== id))
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleDownload = (asset: Asset) => {
        if (asset.file_url) {
            saveAs(asset.file_url, asset.name)
        }
    }

    // Filter helper
    const getAssets = (sectionId: string | null) => {
        return assets.filter(a =>
            a.collection_id === sectionId &&
            a.parent_id === currentFolderId // Show only current folder contents
        )
    }

    const breadcrumbs = () => {
        if (!currentFolderId) return []
        const path = []
        let current = assets.find(a => a.id === currentFolderId)
        while (current) {
            path.unshift(current)
            current = assets.find(a => a.id === current?.parent_id)
        }
        return path
    }

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-300" /></div>
    if (!brand) return <div className="p-10 text-center">Brand not found</div>

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header / Breadcrumbs */}
            <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <button onClick={() => setCurrentFolderId(null)} className="hover:text-gray-900 flex items-center gap-1">
                        <Home size={14} /> Home
                    </button>
                    {breadcrumbs().map(folder => (
                        <div key={folder.id} className="flex items-center gap-2">
                            <ChevronRight size={14} className="text-gray-300" />
                            <button onClick={() => setCurrentFolderId(folder.id)} className="hover:text-gray-900">
                                {folder.name}
                            </button>
                        </div>
                    ))}
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button onClick={() => setIsAddingSection(true)} variant="outline" size="sm" className="gap-2">
                            <LayoutGrid size={14} /> New Section
                        </Button>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-8 py-8 space-y-8">
                {/* Add Section Form */}
                {isAddingSection && (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <h3 className="font-bold mb-4">Add New Section</h3>
                        <div className="flex gap-2">
                            <Input
                                value={newSectionName}
                                onChange={e => setNewSectionName(e.target.value)}
                                placeholder="Section Name (e.g. Logos, Fonts)"
                                autoFocus
                            />
                            <Button onClick={handleCreateSection} className="bg-indigo-600">Create</Button>
                            <Button variant="ghost" onClick={() => setIsAddingSection(false)}>Cancel</Button>
                        </div>
                    </div>
                )}

                {/* Folder Content (if inside a folder, ignore sections view, just show files) */}
                {currentFolderId ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{assets.find(a => a.id === currentFolderId)?.name}</h2>
                            {isAdmin && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleCreateFolder(null)} className="gap-2">
                                        <Folder size={14} /> New Folder
                                    </Button>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            multiple
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleUpload(e)}
                                        />
                                        <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {getAssets(null).length === 0 && <p className="text-gray-400 text-sm col-span-full py-10 text-center">Empty folder</p>}
                            {getAssets(null).map(asset => (
                                <AssetItem
                                    key={asset.id}
                                    asset={asset}
                                    isAdmin={isAdmin}
                                    onDelete={handleDeleteAsset}
                                    onEnter={setCurrentFolderId}
                                    onDownload={() => handleDownload(asset)}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Sections View */
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSectionDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            {sections.length === 0 && !loading && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-500 mb-4">No sections yet.</p>
                                    <Button onClick={() => setIsAddingSection(true)}>Create First Section</Button>
                                </div>
                            )}

                            {/* Uncategorized Assets (if any) */}
                            {getAssets(null).length > 0 && (
                                <div className="mb-8 bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                                        <h3 className="text-lg font-bold text-gray-900">Uncategorized</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                            {getAssets(null).map(asset => (
                                                <AssetItem
                                                    key={asset.id}
                                                    asset={asset}
                                                    isAdmin={isAdmin}
                                                    onDelete={handleDeleteAsset}
                                                    onEnter={setCurrentFolderId}
                                                    onDownload={() => handleDownload(asset)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {sections.map(section => (
                                <SortableSectionItem
                                    key={section.id}
                                    section={section}
                                    onEdit={handleUpdateSection}
                                    onDelete={handleDeleteSection}
                                >
                                    {/* Section Header Controls */}
                                    {isAdmin && (
                                        <div className="flex gap-2 mb-4">
                                            <Button variant="outline" size="sm" onClick={() => handleCreateFolder(section.id)} className="gap-2 h-8 text-xs">
                                                <Folder size={12} /> New Folder
                                            </Button>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={(e) => handleUpload(e, section.id)}
                                                />
                                                <Button size="sm" className="gap-2 h-8 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                                    {uploading ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                                                    Upload
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Assets Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {getAssets(section.id).length === 0 && <p className="text-gray-400 text-sm col-span-full italic">No assets</p>}
                                        {getAssets(section.id).map(asset => (
                                            <AssetItem
                                                key={asset.id}
                                                asset={asset}
                                                isAdmin={isAdmin}
                                                onDelete={handleDeleteAsset}
                                                onEnter={setCurrentFolderId}
                                                onDownload={() => handleDownload(asset)}
                                            />
                                        ))}
                                    </div>
                                </SortableSectionItem>
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    )
}

function AssetItem({ asset, isAdmin, onDelete, onEnter, onDownload }: { asset: Asset, isAdmin: boolean, onDelete: (id: string) => void, onEnter: (id: string) => void, onDownload: () => void }) {
    if (asset.is_folder) {
        return (
            <FolderAssetCard
                asset={asset}
                isAdmin={isAdmin}
                onDelete={onDelete}
                onRename={() => { }} // TODO implement rename
                onEnter={onEnter}
                onDownload={() => { }}
            />
        )
    }

    const { icon: FileIcon, color, bg } = getFileCategory(asset.name)
    const isImage = asset.file_type?.startsWith('image/')

    return (
        <div className="group relative bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all">
            <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative group-hover:bg-gray-100 transition-colors">
                {isImage && asset.thumbnail_url ? (
                    <img src={asset.thumbnail_url} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                        <FileIcon className={`w-6 h-6 ${color}`} />
                    </div>
                )}

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={onDownload} className="p-2 bg-white rounded-lg hover:bg-gray-100 text-gray-900 transition-colors" title="Download">
                        <Download size={16} />
                    </button>
                    {isAdmin && (
                        <button onClick={() => onDelete(asset.id)} className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Delete">
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-1">
                <h4 className="text-sm font-medium text-gray-900 truncate" title={asset.name}>{asset.name}</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(asset.file_size)}</p>
            </div>
        </div>
    )
}
