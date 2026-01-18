'use client'

import { useState, useRef, useEffect, ElementType, KeyboardEvent } from 'react'

interface EditableTextProps {
    value: string
    onChange?: (newValue: string) => void
    as?: ElementType
    className?: string
    editable?: boolean
    placeholder?: string
}

export default function EditableText({
    value,
    onChange,
    as: Component = 'p',
    className = '',
    editable = true,
    placeholder = 'Click to edit...'
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [localValue, setLocalValue] = useState(value)
    const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

    useEffect(() => {
        if (!isEditing) {
            setLocalValue(value)
        }
    }, [value, isEditing])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
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

    const handleKeyDown = (e: KeyboardEvent) => {
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
        if (Component === 'p') {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
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
                ref={inputRef as React.RefObject<HTMLInputElement>}
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
            onKeyDown={(e: KeyboardEvent) => e.key === 'Enter' && setIsEditing(true)}
        >
            {value || <span className="text-gray-400">{placeholder}</span>}
        </Component>
    )
}
