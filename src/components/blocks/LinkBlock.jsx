import { useState, useRef, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'

/**
 * LinkBlock - Styled link with editable URL and label
 */
export default function LinkBlock({
    content,
    isAdmin = false,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [localLabel, setLocalLabel] = useState(content?.label || '')
    const [localUrl, setLocalUrl] = useState(content?.url || '')

    useEffect(() => {
        if (!isEditing) {
            setLocalLabel(content?.label || '')
            setLocalUrl(content?.url || '')
        }
    }, [content, isEditing])

    const handleSave = () => {
        setIsEditing(false)
        if (localLabel !== content?.label || localUrl !== content?.url) {
            onUpdate?.({ ...content, label: localLabel, url: localUrl })
        }
    }

    if (!isAdmin) {
        if (!content?.url) return null
        return (
            <div className="my-3">
                <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-black hover:underline"
                    style={{ fontSize: '16px', lineHeight: '26px' }}
                >
                    {content.label || content.url}
                    <ExternalLink size={14} className="opacity-50" />
                </a>
            </div>
        )
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 my-3">
                <input
                    type="text"
                    value={localLabel}
                    onChange={(e) => setLocalLabel(e.target.value)}
                    placeholder="Link text"
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                    autoFocus
                />
                <input
                    type="url"
                    value={localUrl}
                    onChange={(e) => setLocalUrl(e.target.value)}
                    placeholder="https://..."
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5"
                />
                <div className="flex gap-2 justify-end mt-1">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800"
                    >
                        Save Link
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="my-3">
            <div
                className="inline-flex items-center gap-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors group/link"
                style={{ fontSize: '16px', lineHeight: '26px' }}
                onClick={() => setIsEditing(true)}
            >
                {content?.label || content?.url || <span className="text-gray-300">Add link...</span>}
                <ExternalLink size={14} className="text-gray-400 group-hover/link:text-gray-600" />
            </div>
        </div>
    )
}
