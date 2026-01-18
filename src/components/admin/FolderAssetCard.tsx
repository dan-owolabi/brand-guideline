'use client'

import React, { useState } from 'react'
import { Folder, MoreVertical, Trash2, Edit2, Download, Copy, FolderOpen } from 'lucide-react'
import { FolderPlaceholder } from './FolderPlaceholder'

export interface Asset {
    id: string
    name: string
    is_folder?: boolean
    collection_id?: string | null
    parent_id?: string | null
    file_url?: string
    thumbnail_url?: string | null
    file_type?: string
    file_size?: number
    category?: string
    isUploading?: boolean
    created_at?: string
    brand_id?: string
}

interface FolderAssetCardProps {
    asset: Asset
    isAdmin: boolean
    onDelete: (id: string) => void
    onRename: (id: string, newName: string) => void
    onEnter: (id: string) => void
    onMove?: (id: string, targetId: string) => void
    onDownload: (id: string) => void
}

export default function FolderAssetCard({
    asset,
    isAdmin,
    onDelete,
    onRename,
    onEnter,
    onMove,
    onDownload
}: FolderAssetCardProps) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [name, setName] = useState(asset.name)
    const [showMenu, setShowMenu] = useState(false)

    const handleRename = () => {
        if (name.trim() !== asset.name) {
            onRename(asset.id, name)
        }
        setIsRenaming(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRename()
        if (e.key === 'Escape') {
            setName(asset.name)
            setIsRenaming(false)
        }
    }

    return (
        <div
            className="group relative bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onEnter(asset.id)}
        >
            <div className="aspect-square bg-gray-50/50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-gray-100 transition-colors">
                <FolderPlaceholder className="w-32 h-32" />
            </div>

            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    {isRenaming ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-full text-sm font-medium text-gray-900 bg-white border border-blue-500 rounded px-1 outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <h4 className="text-sm font-medium text-gray-900 truncate" title={asset.name}>
                            {asset.name}
                        </h4>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">Folder</p>
                </div>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDownload(asset.id)
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-600"
                >
                    <Download size={14} />
                </button>
                {isAdmin && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowMenu(!showMenu)
                            }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-10 animate-in fade-in zoom-in duration-150">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onEnter(asset.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <FolderOpen size={14} />
                                    Open
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setIsRenaming(true)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} />
                                    Rename
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDownload(asset.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Download size={14} />
                                    Download
                                </button>
                                <hr className="my-1 border-gray-50" />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDelete(asset.id)
                                        setShowMenu(false)
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <Trash2 size={14} />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
