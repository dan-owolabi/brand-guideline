import React, { useState } from 'react'
import { Folder, MoreVertical, Trash2, Edit2, Download, Copy, FolderOpen } from 'lucide-react'

import { FolderPlaceholder } from './FolderPlaceholder'

export default function FolderAssetCard({
    asset,
    isAdmin,
    onDelete,
    onRename,
    onEnter,
    onMove,
    onDownload
}) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [name, setName] = useState(asset.name)
    const [showMenu, setShowMenu] = useState(false)

    const handleRename = () => {
        if (name.trim() !== asset.name) {
            onRename(asset.id, name)
        }
        setIsRenaming(false)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleRename()
        if (e.key === 'Escape') {
            setName(asset.name)
            setIsRenaming(false)
        }
    }

    return (
        <div
            className="group relative bg-white border border-gray-100 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer"
            onDoubleClick={() => onEnter(asset.id)}
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

            {/* Actions Menu */}
            {isAdmin && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowMenu(!showMenu)
                        }}
                        className="p-1 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
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
    )
}
