import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter } from './Dialog'
import { Button } from './Button'
import { Input } from './Input'
import {
    Search, Filter, Grid, List, Upload, Trash2, X, Check,
    FileText, FileImage, FileArchive, Palette, Type as FontIcon,
    Paperclip, Loader2, Download, Eye
} from 'lucide-react'
import { supabase, uploadFile, deleteFile } from '../../lib/supabase'

// File type detection (same as AssetBlock)
const FILE_CATEGORIES = {
    image: { extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'], icon: FileImage, color: 'text-blue-500', bg: 'bg-blue-50' },
    document: { extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'], icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    archive: { extensions: ['zip', 'rar', '7z', 'tar', 'gz'], icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' },
    design: { extensions: ['ai', 'psd', 'fig', 'sketch', 'xd', 'eps'], icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
    font: { extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'], icon: FontIcon, color: 'text-green-500', bg: 'bg-green-50' },
}

function getFileCategory(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
        if (config.extensions.includes(ext)) {
            return { category, ...config }
        }
    }
    return { category: 'other', icon: Paperclip, color: 'text-gray-500', bg: 'bg-gray-50' }
}

function formatFileSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AssetManagerDialog({ open, onOpenChange, brandId, onSelect, selectionMode = false }) {
    const [assets, setAssets] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [viewMode, setViewMode] = useState('grid')
    const [selectedAssets, setSelectedAssets] = useState([])
    const [isUploading, setIsUploading] = useState(false)
    const [previewAsset, setPreviewAsset] = useState(null)
    const fileInputRef = useRef(null)

    // Fetch assets from Supabase
    useEffect(() => {
        if (open && brandId) {
            fetchAssets()
        }
    }, [open, brandId])

    const fetchAssets = async () => {
        setLoading(true)
        try {
            // Try to fetch from assets table, fallback to empty if table doesn't exist
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .eq('brand_id', brandId)
                .order('created_at', { ascending: false })

            if (error) {
                // If table doesn't exist, just use empty array
                console.log('Assets table not found or error:', error.message)
                setAssets([])
            } else {
                setAssets(data || [])
            }
        } catch (err) {
            console.error('Failed to fetch assets:', err)
            setAssets([])
        } finally {
            setLoading(false)
        }
    }

    const handleUpload = async (files) => {
        setIsUploading(true)
        try {
            for (const file of files) {
                const url = await uploadFile(file, 'assets')
                const isImage = file.type.startsWith('image/')

                const newAsset = {
                    brand_id: brandId,
                    name: file.name,
                    file_url: url,
                    thumbnail_url: isImage ? url : null,
                    file_type: file.type,
                    file_size: file.size,
                    category: getFileCategory(file.name).category
                }

                // Try to insert into database
                const { error } = await supabase
                    .from('assets')
                    .insert(newAsset)

                if (error) {
                    console.log('Could not save to database, asset uploaded to storage only')
                }
            }
            await fetchAssets()
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (assetIds) => {
        if (!confirm(`Delete ${assetIds.length} asset(s)?`)) return

        try {
            for (const id of assetIds) {
                const asset = assets.find(a => a.id === id)
                if (asset?.file_url) {
                    try {
                        await deleteFile(asset.file_url, 'assets')
                    } catch (e) {
                        console.log('Could not delete file from storage')
                    }
                }
                await supabase.from('assets').delete().eq('id', id)
            }
            setSelectedAssets([])
            await fetchAssets()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            handleUpload(files)
        }
        e.target.value = ''
    }

    const toggleAssetSelection = (assetId) => {
        setSelectedAssets(prev =>
            prev.includes(assetId)
                ? prev.filter(id => id !== assetId)
                : [...prev, assetId]
        )
    }

    const handleInsert = () => {
        const selected = assets.filter(a => selectedAssets.includes(a.id))
        onSelect?.(selected.map(a => ({
            id: crypto.randomUUID(),
            name: a.name,
            description: a.description || '',
            downloadUrl: a.file_url,
            thumbnailUrl: a.thumbnail_url,
            fileSize: a.file_size,
            fileType: a.file_type
        })))
        setSelectedAssets([])
        onOpenChange(false)
    }

    // Filter assets
    const filteredAssets = assets.filter(asset => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            const name = (asset.name || '').toLowerCase()
            const desc = (asset.description || '').toLowerCase()
            if (!name.includes(query) && !desc.includes(query)) return false
        }
        if (filterType !== 'all') {
            const { category } = getFileCategory(asset.name || asset.file_url)
            if (category !== filterType) return false
        }
        return true
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div className="w-full max-w-4xl max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Asset Library</h2>
                        <p className="text-sm text-gray-500">Browse and manage your brand assets</p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 bg-gray-50">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images</option>
                        <option value="document">Documents</option>
                        <option value="archive">Archives</option>
                        <option value="design">Design Files</option>
                        <option value="font">Fonts</option>
                    </select>

                    {/* View Toggle */}
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Upload Button */}
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        Upload
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 size={32} className="text-gray-400 animate-spin" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <Paperclip size={40} className="mb-2" />
                            <p className="text-sm">No assets found</p>
                            <p className="text-xs">Upload files to get started</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredAssets.map(asset => {
                                const { icon: Icon, color, bg } = getFileCategory(asset.name || asset.file_url)
                                const isImage = getFileCategory(asset.name).category === 'image'
                                const isSelected = selectedAssets.includes(asset.id)

                                return (
                                    <div
                                        key={asset.id}
                                        onClick={() => selectionMode ? toggleAssetSelection(asset.id) : setPreviewAsset(asset)}
                                        className={`
                                            group relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all
                                            ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
                                        `}
                                    >
                                        {/* Thumbnail */}
                                        <div className={`h-28 ${isImage ? '' : `${bg} flex items-center justify-center`}`}>
                                            {isImage && asset.thumbnail_url ? (
                                                <img src={asset.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Icon size={32} className={color} />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(asset.file_size)}</p>
                                        </div>

                                        {/* Selection indicator */}
                                        {selectionMode && (
                                            <div className={`
                                                absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center
                                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white/80 border-gray-300'}
                                            `}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                        )}

                                        {/* Hover actions */}
                                        {!selectionMode && (
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setPreviewAsset(asset) }}
                                                    className="p-1.5 bg-white shadow-sm border rounded-lg hover:bg-gray-50"
                                                >
                                                    <Eye size={14} className="text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete([asset.id]) }}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredAssets.map(asset => {
                                const { icon: Icon, color, bg } = getFileCategory(asset.name || asset.file_url)
                                const isImage = getFileCategory(asset.name).category === 'image'
                                const isSelected = selectedAssets.includes(asset.id)

                                return (
                                    <div
                                        key={asset.id}
                                        onClick={() => selectionMode ? toggleAssetSelection(asset.id) : null}
                                        className={`
                                            group flex items-center gap-4 p-3 rounded-xl border-2 transition-all cursor-pointer
                                            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                                        `}
                                    >
                                        {selectionMode && (
                                            <div className={`
                                                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                                            `}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                        )}

                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                                            {isImage && asset.thumbnail_url ? (
                                                <img src={asset.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <Icon size={18} className={color} />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{asset.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(asset.file_size)}</p>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={asset.file_url}
                                                download
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                            >
                                                <Download size={16} className="text-gray-600" />
                                            </a>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete([asset.id]) }}
                                                className="p-2 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={16} className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {(selectedAssets.length > 0 || selectionMode) && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
                        <div className="text-sm text-gray-600">
                            {selectedAssets.length} asset(s) selected
                        </div>
                        <div className="flex gap-2">
                            {selectedAssets.length > 0 && !selectionMode && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleDelete(selectedAssets)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Selected
                                </Button>
                            )}
                            {selectionMode && (
                                <>
                                    <Button variant="outline" onClick={() => { setSelectedAssets([]); onOpenChange(false) }}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleInsert} disabled={selectedAssets.length === 0}>
                                        Insert {selectedAssets.length > 0 ? `(${selectedAssets.length})` : ''}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewAsset && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/60"
                    onClick={() => setPreviewAsset(null)}
                >
                    <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                        {getFileCategory(previewAsset.name).category === 'image' ? (
                            <img
                                src={previewAsset.file_url}
                                alt={previewAsset.name}
                                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="bg-white rounded-xl p-8 text-center">
                                {(() => {
                                    const { icon: Icon, color } = getFileCategory(previewAsset.name)
                                    return <Icon size={64} className={color} />
                                })()}
                                <p className="mt-4 font-medium text-gray-900">{previewAsset.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(previewAsset.file_size)}</p>
                                <a
                                    href={previewAsset.file_url}
                                    download
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Download size={16} />
                                    Download
                                </a>
                            </div>
                        )}
                        <button
                            onClick={() => setPreviewAsset(null)}
                            className="absolute -top-2 -right-2 p-2 bg-white shadow-lg rounded-full hover:bg-gray-100"
                        >
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </Dialog>
    )
}
