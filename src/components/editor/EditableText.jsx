import { useState, useRef, useEffect } from 'react'

/**
 * EditableText - Inline editable text component for WYSIWYG editing.
 * 
 * Props:
 *   - value: string - The text content
 *   - onChange: (newValue) => void - Called when text changes
 *   - as: 'h1' | 'h2' | 'h3' | 'p' | 'span' - The HTML element to render
 *   - className: string - Additional CSS classes
 *   - editable: boolean - Whether editing is enabled (default: true)
 *   - placeholder: string - Placeholder text when empty
 */
export default function EditableText({
    value,
    onChange,
    as: Component = 'p',
    className = '',
    editable = true,
    placeholder = 'Click to edit...'
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef(null)

    // Sync local value with prop
    useEffect(() => {
        if (!isEditing) {
            setLocalValue(value)
        }
    }, [value, isEditing])

    // Focus input when editing starts
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            // Select all text
            if (inputRef.current.select) {
                inputRef.current.select()
            }
        }
    }, [isEditing])

    const handleBlur = () => {
        setIsEditing(false)
        if (localValue !== value) {
            onChange?.(localValue)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && Component !== 'p') {
            e.preventDefault()
            handleBlur()
        }
        if (e.key === 'Escape') {
            setLocalValue(value)
            setIsEditing(false)
        }
    }

    if (!editable) {
        return (
            <Component className={className}>
                {value || placeholder}
            </Component>
        )
    }

    if (isEditing) {
        // For multi-line (p), use textarea. For headings, use input.
        if (Component === 'p') {
            return (
                <textarea
                    ref={inputRef}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`${className} w-full resize-none bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded`}
                    rows={Math.max(2, (localValue?.split('\n').length || 1))}
                    placeholder={placeholder}
                />
            )
        }

        return (
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`${className} w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded`}
                placeholder={placeholder}
            />
        )
    }

    return (
        <Component
            className={`${className} cursor-text hover:bg-indigo-50/50 transition-colors rounded px-1 -mx-1`}
            onClick={() => setIsEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(true)}
        >
            {value || <span className="text-gray-400">{placeholder}</span>}
        </Component>
    )
}
