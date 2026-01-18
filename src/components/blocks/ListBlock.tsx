'use client'

import { useState, useRef, useCallback } from 'react'

interface ListBlockContent {
    listType?: 'bullet' | 'numbered'
    items?: string[]
}

interface ListBlockProps {
    content: ListBlockContent
    isAdmin?: boolean
    onUpdate?: (content: ListBlockContent) => void
    onAddNext?: (type: string) => void
}

export default function ListBlock({
    content,
    isAdmin = false,
    onUpdate,
    onAddNext
}: ListBlockProps) {
    const listType = content?.listType || 'bullet'
    const items = content?.items || ['']

    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const updateItem = useCallback((index: number, value: string) => {
        const newItems = [...items]
        newItems[index] = value

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            onUpdate?.({ ...content, items: newItems })
        }, 300)
    }, [items, content, onUpdate])

    const addItem = useCallback((afterIndex: number) => {
        const newItems = [...items]
        newItems.splice(afterIndex + 1, 0, '')
        onUpdate?.({ ...content, items: newItems })

        setTimeout(() => {
            itemRefs.current[afterIndex + 1]?.focus()
        }, 0)
    }, [items, content, onUpdate])

    const removeItem = useCallback((index: number) => {
        if (items.length <= 1) {
            onUpdate?.({ ...content, items: [''] })
            return
        }
        const newItems = items.filter((_, i) => i !== index)
        onUpdate?.({ ...content, items: newItems })

        setTimeout(() => {
            const focusIndex = Math.max(0, index - 1)
            itemRefs.current[focusIndex]?.focus()
        }, 0)
    }, [items, content, onUpdate])

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
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

        if (e.key === 'Tab' && e.shiftKey) {
            e.preventDefault()
            const currentText = itemRefs.current[index]?.textContent || ''
            if (!currentText && items.length === 1) {
                onAddNext?.('paragraph')
            }
        }
    }

    const handleInput = (e: React.FormEvent, index: number) => {
        const value = (e.target as HTMLElement).textContent || ''
        updateItem(index, value)
    }

    const handlePaste = (e: React.ClipboardEvent, index: number) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        const lines = text.split(/\n/).filter(line => line.trim())

        if (lines.length === 1) {
            document.execCommand('insertText', false, lines[0])
            return
        }

        const currentItems = [...items]
        const currentText = itemRefs.current[index]?.textContent || ''
        currentItems[index] = currentText + lines[0]
        const newItems = lines.slice(1)
        currentItems.splice(index + 1, 0, ...newItems)

        onUpdate?.({ ...content, items: currentItems })

        setTimeout(() => {
            itemRefs.current[index + lines.length - 1]?.focus()
        }, 0)
    }

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

    return (
        <div className="my-2 space-y-0.5">
            {items.map((item, index) => (
                <div key={index} className="flex items-start gap-2 group/item">
                    <span className="text-gray-400 select-none flex-shrink-0 w-5 text-center pt-0.5">
                        {listType === 'numbered' ? `${index + 1}.` : '•'}
                    </span>
                    <div
                        ref={el => { itemRefs.current[index] = el }}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => handleInput(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onPaste={(e) => handlePaste(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        className={`flex-1 outline-none min-h-[1.5em] rounded px-1 -mx-1 ${focusedIndex === index ? 'bg-gray-50' : ''}`}
                        dangerouslySetInnerHTML={{ __html: item }}
                    />
                </div>
            ))}

            <button
                onClick={() => addItem(items.length - 1)}
                className="ml-7 text-xs text-gray-300 hover:text-gray-500 transition-colors py-1"
            >
                + Add item
            </button>
        </div>
    )
}
