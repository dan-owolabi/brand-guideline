'use client'

import { useState } from 'react'
import { Video } from 'lucide-react'

export default function VideoBlock({ content, isAdmin, onUpdate }) {
    const [url, setUrl] = useState(content?.url || '')
    const [isEditing, setIsEditing] = useState(!content?.url && isAdmin)

    const handleSave = () => {
        onUpdate({ ...content, url })
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Video size={16} />
                    <span className="text-sm font-medium">Add Video</span>
                </div>
                <input
                    type="url"
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                    className="w-full p-2 border border-gray-300 rounded mb-2 text-sm focus:outline-none focus:border-black"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    autoFocus
                />
                <button
                    onClick={handleSave}
                    className="px-3 py-1 bg-black text-white text-xs rounded hover:bg-gray-800"
                >
                    Embed Video
                </button>
            </div>
        )
    }

    if (!url) return null

    // Simple embed logic (naive)
    const getEmbedUrl = (inputUrl) => {
        if (inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be')) {
            const videoId = inputUrl.split('v=')[1]?.split('&')[0] || inputUrl.split('/').pop()
            return `https://www.youtube.com/embed/${videoId}`
        }
        return inputUrl
    }

    return (
        <div className="relative group my-6">
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                <iframe
                    src={getEmbedUrl(url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
            </div>
            {isAdmin && (
                <button
                    className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    onClick={() => setIsEditing(true)}
                >
                    Edit Video
                </button>
            )}

            {(content?.caption || isAdmin) && (
                <input
                    type="text"
                    placeholder="Add a caption..."
                    value={content.caption || ''}
                    onChange={(e) => onUpdate?.({ ...content, caption: e.target.value })}
                    className={`w-full text-center prose-small bg-transparent border-none outline-none mt-2 italic ${!isAdmin && !content.caption ? 'hidden' : ''}`}
                    readOnly={!isAdmin}
                />
            )}
        </div>
    )
}