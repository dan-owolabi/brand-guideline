import { useState, useRef, useEffect } from 'react'

/**
 * HeadingBlock - Editable heading component (h1, h2, h3)
 */
export default function HeadingBlock({
    content,
    level = 1,
    isAdmin = false,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [localContent, setLocalContent] = useState(content?.text || '')
    const inputRef = useRef(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // Place cursor at end
            const range = document.createRange()
            const sel = window.getSelection()
            range.selectNodeContents(inputRef.current)
            range.collapse(false)
            sel.removeAllRanges()
            sel.addRange(range)
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (localContent !== content?.text) {
            onUpdate?.({ ...content, text: localContent })
        }
    }

    const startEditing = () => {
        setLocalContent(content?.text || '')
        setIsEditing(true)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleBlur()
        }
        if (e.key === 'Escape') {
            setLocalContent(content?.text || '')
            setIsEditing(false)
        }
    }

    const sizeClasses = {
        1: 'text-4xl font-bold',
        2: 'text-2xl font-semibold',
        3: 'text-xl font-medium'
    }

    const Tag = `h${level}`
    const baseClass = `${sizeClasses[level] || sizeClasses[1]} text-gray-900 leading-tight`

    if (!isAdmin) {
        return <Tag className={baseClass}>{content?.text || ''}</Tag>
    }

    return (
        <Tag
            ref={inputRef}
            className={`${baseClass} outline-none ${isEditing ? 'ring-2 ring-indigo-500 ring-offset-2 rounded px-1' : 'cursor-text'}`}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onClick={startEditing}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onInput={(e) => setLocalContent(e.currentTarget.textContent)}
        >
            {isEditing ? localContent : (content?.text || <span className="text-gray-300">Click to add heading...</span>)}
        </Tag>
    )
}
