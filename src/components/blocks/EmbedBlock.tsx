'use client'

import { useState } from 'react'
import { FileCode } from 'lucide-react'

interface EmbedBlockContent {
    url?: string
    caption?: string
}

interface EmbedBlockProps {
    content: EmbedBlockContent
    isAdmin?: boolean
    onUpdate?: (content: EmbedBlockContent) => void
}

export default function EmbedBlock({ content, isAdmin, onUpdate }: EmbedBlockProps) {
    const [url, setUrl] = useState(content?.url || '')
    const [isEditing, setIsEditing] = useState(!content?.url && isAdmin)

    const handleSave = () => {
        onUpdate?.({ ...content, url })
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 my-6">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-medium">
                    <FileCode size={16} />
                    <span className="text-sm">Embed Content</span>
                </div>
                <input
                    type="url"
                    placeholder="Enter URL to embed (Figma, Loom, etc.)"
                    className="w-full p-3 border border-gray-200 rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                />
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800"
                    >
                        Embed content
                    </button>
                </div>
            </div>
        )
    }

    if (!url) return null

    return (
        <div className="relative group my-6">
            <div className="w-full h-[450px] bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                <iframe
                    src={url}
                    className="w-full h-full"
                    title="Embed"
                    loading="lazy"
                />
            </div>
            {isAdmin && (
                <button
                    className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    onClick={() => setIsEditing(true)}
                >
                    Edit Embed
                </button>
            )}

            {(content?.caption || isAdmin) && (
                <input
                    type="text"
                    placeholder="Add a caption..."
                    value={content?.caption || ''}
                    onChange={(e) => onUpdate?.({ ...content, caption: e.target.value })}
                    className={`w-full text-center prose-small bg-transparent border-none outline-none mt-2 italic ${!isAdmin && !content?.caption ? 'hidden' : ''}`}
                    readOnly={!isAdmin}
                />
            )}
        </div>
    )
}
