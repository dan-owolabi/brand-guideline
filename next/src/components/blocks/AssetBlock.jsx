'use client'

import { useState, useRef } from 'react'
import {
    Download, Grid, List, Search, Filter,
    FileText, FileImage, FileArchive, Palette, Type as FontIcon,
    Paperclip, ArrowUpDown, Plus, X, Upload, Loader2, Trash2, GripVertical
} from 'lucide-react'
import { uploadFile } from '../../lib/supabase'
import { saveAs } from 'file-saver'

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        saveAs(blob, filename)
    } catch (error) {
        console.error('Download failed', error)
        window.open(url, '_blank')
    }
}

// File type detection and icons
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

// Asset Card Component
function AssetCard({ asset, brand, viewMode, isAdmin, onRemove, dragHandleProps }) {
    const { icon: Icon, color, bg } = getFileCategory(asset.name || asset.downloadUrl)
    const isImage = getFileCategory(asset.name || asset.downloadUrl).category === 'image'

    if (viewMode === 'list') {
        return (
            <div className="group flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all">
                {isAdmin && dragHandleProps && (
                    <div {...dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500">
                        <GripVertical size={16} />
                    </div>
                )}

                {/* Thumbnail/Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${bg}`}>
                    {isImage && asset.thumbnailUrl ? (
                        <img src={asset.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Icon size={20} className={color} />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{asset.name || 'Untitled'}</h4>
                    {asset.description && (
                        <p className="text-sm text-gray-500 truncate">{asset.description}</p>
                    )}
                </div>

                {/* Size */}
                <span className="text-xs text-gray-400 flex-shrink-0">
                    {formatFileSize(asset.fileSize)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isAdmin && (
                        <button
                            onClick={() => onRemove?.()}
                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button
                        onClick={() => downloadFile(asset.downloadUrl, asset.name)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: brand?.primaryColor || '#0066FF' }}
                    >
                        <Download size={16} />
                        Download
                    </button>
                </div>
            </div>
        )
    }

    // Grid view (default)
    return (
        <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all">
            {/* Thumbnail */}
            <div className={`h-36 overflow-hidden relative ${isImage ? '' : `${bg} flex items-center justify-center`}`}>
                {isImage && asset.thumbnailUrl ? (
                    <img
                        src={asset.thumbnailUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <Icon size={40} className={color} />
                )}

                {isAdmin && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        {dragHandleProps && (
                            <div {...dragHandleProps} className="p-1.5 bg-white shadow-sm border border-gray-200 rounded-lg cursor-grab">
                                <GripVertical size={14} className="text-gray-500" />
                            </div>
                        )}
                        <button
                            onClick={() => onRemove?.()}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">{asset.name || 'Untitled'}</h4>
                {asset.description && (
                    <p className="text-gray-500 text-xs mb-3 line-clamp-2">{asset.description}</p>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded flex items-center justify-center ${bg}`}>
                            <Icon size={12} className={color} />
                        </span>
                        <span className="text-xs text-gray-400">{formatFileSize(asset.fileSize)}</span>
                    </div>
                    <button
                        onClick={() => downloadFile(asset.downloadUrl, asset.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition-colors hover:opacity-90"
                        style={{ backgroundColor: brand?.primaryColor || '#0066FF' }}
                    >
                        <Download size={14} />
                        Download
                    </button>
                </div>
            </div>
        </div>
    )
}

// Upload Zone Component
function UploadZone({ onUpload, isUploading }) {
    const [isDragging, setIsDragging] = useState(false)
    const fileInputRef = useRef(null)

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragIn = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragOut = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            onUpload(files)
        }
    }

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            onUpload(files)
        }
        e.target.value = ''
    }

    return (
        <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
                border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />
            {isUploading ? (
                <>
                    <Loader2 size={32} className="text-gray-400 animate-spin mb-2" />
                    <span className="text-sm font-medium text-gray-600">Uploading...</span>
                </>
            ) : (
                <>
                    <Upload size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm font-medium text-gray-600">Drop files here or click to upload</span>
                    <span className="text-xs text-gray-400 mt-1">Any file type up to 50MB</span>
                </>
            )}
        </div>
    )
}

export default function AssetBlock({ content, isAdmin = false, onUpdate, brand }) {
    const [viewMode, setViewMode] = useState('grid')
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [sortBy, setSortBy] = useState('name')
    const [isUploading, setIsUploading] = useState(false)

    const assets = content?.assets || []

    // Filter and sort assets
    const filteredAssets = assets
        .filter(asset => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                const name = (asset.name || '').toLowerCase()
                const desc = (asset.description || '').toLowerCase()
                if (!name.includes(query) && !desc.includes(query)) return false
            }
            // Type filter
            if (filterType !== 'all') {
                const { category } = getFileCategory(asset.name || asset.downloadUrl)
                if (category !== filterType) return false
            }
            return true
        })
        .sort((a, b) => {
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
            if (sortBy === 'size') return (b.fileSize || 0) - (a.fileSize || 0)
            if (sortBy === 'date') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            return 0
        })

    const handleUpload = async (files) => {
        setIsUploading(true)
        try {
            const newAssets = []
            for (const file of files) {
                const url = await uploadFile(file, 'assets')
                const isImage = file.type.startsWith('image/')

                newAssets.push({
                    id: crypto.randomUUID(),
                    name: file.name,
                    description: '',
                    downloadUrl: url,
                    thumbnailUrl: isImage ? url : null,
                    fileSize: file.size,
                    fileType: file.type,
                    createdAt: new Date().toISOString()
                })
            }
            onUpdate?.({ ...content, assets: [...assets, ...newAssets] })
        } catch (err) {
            console.error('Upload failed:', err)
            alert('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleRemoveAsset = (index) => {
        const newAssets = assets.filter((_, i) => i !== index)
        onUpdate?.({ ...content, assets: newAssets })
    }

    const handleUpdateAsset = (index, updates) => {
        const newAssets = [...assets]
        newAssets[index] = { ...newAssets[index], ...updates }
        onUpdate?.({ ...content, assets: newAssets })
    }

    // Empty state for public view
    if (!isAdmin && assets.length === 0) {
        return null
    }

    return (
        <div className="my-6 space-y-4">
            {/* Toolbar */}
            {(isAdmin || assets.length > 3) && (
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="image">Images</option>
                            <option value="document">Documents</option>
                            <option value="archive">Archives</option>
                            <option value="design">Design Files</option>
                            <option value="font">Fonts</option>
                        </select>
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="name">Name</option>
                            <option value="size">Size</option>
                            <option value="date">Date</option>
                        </select>
                        <ArrowUpDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* View Toggle */}
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Assets Grid/List */}
            {filteredAssets.length > 0 ? (
                <div className={
                    viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4'
                        : 'space-y-3'
                }>
                    {filteredAssets.map((asset, index) => (
                        <AssetCard
                            key={asset.id || index}
                            asset={asset}
                            brand={brand}
                            viewMode={viewMode}
                            isAdmin={isAdmin}
                            onRemove={() => handleRemoveAsset(assets.indexOf(asset))}
                            onUpdate={(updates) => handleUpdateAsset(assets.indexOf(asset), updates)}
                        />
                    ))}
                </div>
            ) : (
                !isAdmin && <p className="text-gray-500 text-center py-8">No assets found</p>
            )}

            {/* Upload Zone (Admin only) */}
            {isAdmin && (
                <UploadZone onUpload={handleUpload} isUploading={isUploading} />
            )}
        </div>
    )
}