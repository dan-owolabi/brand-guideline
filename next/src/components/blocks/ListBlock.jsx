'use client'

import { useState, useRef, useCallback, useMemo } from 'react'

/**
 * ListBlock - A dedicated block for handling bulleted and numbered lists
 * with proper multi-item support.
 */
export default function ListBlock({
    content,
    isAdmin = false,
    onUpdate,
    onAddNext
}) {
    const listType = content?.listType || 'bullet' // 'bullet' or 'numbered'
    const items = useMemo(() => content?.items || [''], [content?.items])

    const itemRefs = useRef([])
    const [focusedIndex, setFocusedIndex] = useState(null)
    const debounceTimerRef = useRef(null)

    // Update an item at index
    const updateItem = useCallback((index, value) => {
        const newItems = [...items]
        newItems[index] = value

        // Debounce save
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            onUpdate?.({ ...content, items: newItems })
        }, 300)
    }, [items, content, onUpdate])

    // Add a new item after the given index
    const addItem = useCallback((afterIndex) => {
        const newItems = [...items]
        newItems.splice(afterIndex + 1, 0, '')
        onUpdate?.({ ...content, items: newItems })

        // Focus the new item
        setTimeout(() => {
            itemRefs.current[afterIndex + 1]?.focus()
        }, 0)
    }, [items, content, onUpdate])

    // Remove an item at index
    const removeItem = useCallback((index) => {
        if (items.length <= 1) {
            // If only one item left, don't remove, just clear
            onUpdate?.({ ...content, items: [''] })
            return
        }
        const newItems = items.filter((_, i) => i !== index)
        onUpdate?.({ ...content, items: newItems })

        // Focus the previous item
        setTimeout(() => {
            const focusIndex = Math.max(0, index - 1)
            itemRefs.current[focusIndex]?.focus()
        }, 0)
    }, [items, content, onUpdate])

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            addItem(index)
        }

        if (e.key === 'Backspace') {
            const currentText = itemRefs.current[index]?.textContent || ''
            if (!currentText) {
                e.preventDefault()
                removeItem(index)
            }
        }

        if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault()
            itemRefs.current[index - 1]?.focus()
        }

        if (e.key === 'ArrowDown' && index < items.length - 1) {
            e.preventDefault()
            itemRefs.current[index + 1]?.focus()
        }

        // Tab to outdent/create new paragraph block
        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            const currentText = itemRefs.current[index]?.textContent || ''
            if (!currentText && items.length === 1) {
                // Transform to paragraph if empty single item
                onAddNext?.('paragraph')
            }
        }
    }

    const handleInput = (e, index) => {
        const value = e.currentTarget.textContent || ''
        updateItem(index, value)
    }

    const handlePaste = (e, index) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')

        // Split pasted content by newlines to create multiple list items
        const lines = text.split(/\n/).filter(line => line.trim())

        if (lines.length === 1) {
            // Single line paste - just insert at cursor
            document.execCommand('insertText', false, lines[0])
            return
        }

        // Multi-line paste - create new items for each line
        const currentItems = [...items]
        const currentText = itemRefs.current[index]?.textContent || ''

        // Replace current item with first line (appended to existing text)
        currentItems[index] = currentText + lines[0]

        // Insert remaining lines as new items
        const newItems = lines.slice(1)
        currentItems.splice(index + 1, 0, ...newItems)

        onUpdate?.({ ...content, items: currentItems })

        // Focus the last inserted item
        setTimeout(() => {
            itemRefs.current[index + lines.length - 1]?.focus()
        }, 0)
    }

    // Render read-only view
    if (!isAdmin) {
        return (
            <div className={`my-4 ${listType === 'numbered' ? 'list-decimal' : 'list-disc'} ml-6 space-y-1`}>
                {items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                        <span className="text-gray-400 select-none flex-shrink-0 w-5 text-center">
                            {listType === 'numbered' ? `${index + 1}.` : '•'}
                        </span>
                        <span className="flex-1">{item}</span>
                    </div>
                ))}
            </div>
        )
    }

    // Admin editable view
    return (
        <div className="my-2 space-y-0.5">
            {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 group/item">
                    <span className="text-gray-400 select-none flex-shrink-0 w-5 text-center pt-0.5">
                        {listType === 'numbered' ? `${index + 1}.` : '•'}
                    </span>
                    <div
                        ref={el => itemRefs.current[index] = el}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => handleInput(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={(e) => handlePaste(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        className={`flex-1 outline-none min-h-[1.5em] rounded px-1 -mx-1 ${focusedIndex === index ? 'bg-gray-50' : ''
                            }`}
                        dangerouslySetInnerHTML={{ __html: item }}
                    />
                </div>
            ))}

            {/* Add item button */}
            <button
                onClick={() => addItem(items.length - 1)}
                className="ml-7 text-xs text-gray-300 hover:text-gray-500 transition-colors py-1"
            >
                + Add item
            </button>
        </div>
    )
}