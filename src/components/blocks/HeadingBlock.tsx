'use client'

import { useState, useRef, useEffect } from 'react'

interface HeadingBlockContent {
    text?: string
}

interface HeadingBlockProps {
    content: HeadingBlockContent
    level?: 1 | 2 | 3
    isAdmin?: boolean
    onUpdate?: (content: HeadingBlockContent) => void
}

/**
 * HeadingBlock - Editable heading component (h1, h2, h3)
 */
export default function HeadingBlock({
    content,
    level = 1,
    isAdmin = false,
    onUpdate
}: HeadingBlockProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localContent, setLocalContent] = useState(content?.text || '')
    const inputRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        if (!isEditing) setLocalContent(content?.text || '')
    }, [content?.text, isEditing])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            const range = document.createRange()
            const sel = window.getSelection()
            if (sel) {
                range.selectNodeContents(inputRef.current)
                range.collapse(false)
                sel.removeAllRanges()
                sel.addRange(range)
            }
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (localContent !== content?.text) {
            onUpdate?.({ ...content, text: localContent })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleBlur()
        }
        if (e.key === 'Escape') {
            setLocalContent(content?.text || '')
            setIsEditing(false)
        }
    }

    const sizeClasses: Record<number, string> = {
        1: 'text-4xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium'
    }

    const baseClass = `${sizeClasses[level] || sizeClasses[1]} text-gray-900 leading-tight`

    const commonProps = {
        ref: inputRef,
        className: isAdmin
            ? `${baseClass} outline-none ${isEditing ? 'ring-2 ring-indigo-500 ring-offset-2 rounded px-1' : 'cursor-text'}`
            : baseClass,
        contentEditable: isAdmin ? isEditing : undefined,
        suppressContentEditableWarning: true,
        onClick: isAdmin ? () => setIsEditing(true) : undefined,
        onBlur: isAdmin ? handleBlur : undefined,
        onKeyDown: isAdmin ? handleKeyDown : undefined,
        onInput: isAdmin ? (e: React.FormEvent) => setLocalContent((e.target as HTMLElement).textContent || '') : undefined,
    }

    const displayContent = isAdmin
        ? (localContent || <span className="text-gray-300">Click to add heading...</span>)
        : (content?.text || '')

    if (level === 1) return <h1 {...commonProps}>{displayContent}</h1>
    if (level === 2) return <h2 {...commonProps}>{displayContent}</h2>
    return <h3 {...commonProps}>{displayContent}</h3>
}

