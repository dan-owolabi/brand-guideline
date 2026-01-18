'use client'

import { useState, useRef, useEffect } from 'react'

interface ParagraphBlockContent {
    text?: string
}

interface ParagraphBlockProps {
    content: ParagraphBlockContent
    isAdmin?: boolean
    onUpdate?: (content: ParagraphBlockContent) => void
}

/**
 * ParagraphBlock - Editable paragraph with multi-line support
 */
export default function ParagraphBlock({
    content,
    isAdmin = false,
    onUpdate
}: ParagraphBlockProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localContent, setLocalContent] = useState(content?.text || '')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!isEditing) setLocalContent(content?.text || '')
    }, [content?.text, isEditing])

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
            textareaRef.current.selectionStart = textareaRef.current.value.length
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (localContent !== content?.text) {
            onUpdate?.({ ...content, text: localContent })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setLocalContent(content?.text || '')
            setIsEditing(false)
        }
    }

    if (!isAdmin) {
        return (
            <p className="text-gray-600 leading-relaxed text-base">
                {content?.text || ''}
            </p>
        )
    }

    if (isEditing) {
        return (
            <textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full text-gray-600 leading-relaxed text-base bg-transparent border-none outline-none resize-none ring-2 ring-indigo-500 ring-offset-2 rounded p-1"
                rows={Math.max(3, localContent.split('\n').length + 1)}
                placeholder="Start typing..."
            />
        )
    }

    return (
        <p
            className="text-gray-600 leading-relaxed text-base cursor-text hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
            onClick={() => setIsEditing(true)}
        >
            {localContent || <span className="text-gray-300">Click to add text...</span>}
        </p>
    )
}
