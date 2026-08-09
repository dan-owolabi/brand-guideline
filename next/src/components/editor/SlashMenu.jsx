'use client'


import React, { useEffect, useRef, useState } from 'react'
import {
    Type, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus,
    Image, Video, FileCode, Paperclip, Table2,
    Clipboard, Package
} from 'lucide-react'

const MENU_ITEMS = [
    {
        label: 'Basic blocks', items: [
            { id: 'text', label: 'Text', icon: Type, type: 'text', variant: 'paragraph' },
            { id: 'h1', label: 'Heading 1', icon: Heading1, type: 'text', variant: 'heading1' },
            { id: 'h2', label: 'Heading 2', icon: Heading2, type: 'text', variant: 'heading2' },
            { id: 'h3', label: 'Heading 3', icon: Heading3, type: 'text', variant: 'heading3' },
            { id: 'h4', label: 'Heading 4', icon: Heading2, type: 'text', variant: 'heading4' },
            { id: 'small', label: 'Small text', icon: Type, type: 'text', variant: 'small' },
            { id: 'quote', label: 'Quote', icon: Quote, type: 'text', variant: 'quote' },
            { id: 'table', label: 'Table', icon: Table2, type: 'table' },
            { id: 'divider', label: 'Divider', icon: Minus, type: 'divider' }
        ]
    },
    {
        label: 'Attachment', items: [
            { id: 'image', label: 'Image', icon: Image, type: 'image' },
            { id: 'imageGrid', label: 'Image Grid', icon: Image, type: 'imageGrid' },
            { id: 'video', label: 'Video', icon: Video, type: 'video' },
            { id: 'link', label: 'Link', icon: Paperclip, type: 'link' },
            { id: 'embed', label: 'Embed', icon: FileCode, type: 'embed' },
            { id: 'asset', label: 'Assets', icon: Package, type: 'asset' }
        ]
    }
]

export default function SlashMenu({ position, onSelect, onClose }) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [clipboardBlocks, setClipboardBlocks] = useState(null)
    const menuRef = useRef(null)

    async function checkClipboard() {
        try {
            const text = await navigator.clipboard.readText()
            if (!text.trim().startsWith('{') && !text.trim().startsWith('[')) return

            const data = JSON.parse(text)

            // Validate if it looks like a block or array of blocks
            const isValidBlock = (b) => b && typeof b === 'object' && typeof b.id === 'string' && typeof b.type === 'string'

            if (Array.isArray(data)) {
                if (data.every(isValidBlock)) {
                    setClipboardBlocks(data)
                }
            } else if (isValidBlock(data)) {
                setClipboardBlocks([data])
            }
        } catch {
            // Ignore JSON parse errors or clipboard read errors
        }
    }

    // Check clipboard for valid blocks
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the Clipboard API (an external system) and setting state from the result is the documented allowed pattern
        checkClipboard()
    }, [])

    // Dynamic menu items including Paste if applicable
    const menuItems = clipboardBlocks ? [
        {
            label: 'Clipboard',
            items: [{
                id: 'paste',
                label: `Paste ${clipboardBlocks.length} block${clipboardBlocks.length > 1 ? 's' : ''}`,
                icon: Clipboard,
                type: 'paste',
                data: clipboardBlocks
            }]
        },
        ...MENU_ITEMS
    ] : MENU_ITEMS

    // Flatten items for keyboard navigation
    const allItems = menuItems.flatMap(g => g.items)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose()
            }
        }

        // Use mousedown to catch before focus changes
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % allItems.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                const item = allItems[selectedIndex]
                if (item.id === 'paste') {
                    // Pass the blocks data for paste
                    onSelect(item.data)
                } else {
                    onSelect(item)
                }
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [selectedIndex, allItems, onSelect, onClose])

    return (
        <div
            ref={menuRef}
            className="absolute z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden text-sm animate-in fade-in zoom-in duration-150"
            style={{
                top: position.top + 24,
                left: position.left
            }}
        >
            <div className="max-h-80 overflow-y-auto py-2">
                {menuItems.map((group, groupIndex) => (
                    <div key={group.label} className={groupIndex > 0 ? 'mt-2 pt-2 border-t border-gray-100' : ''}>
                        <div className="px-3 py-1 text-xs font-medium text-gray-500 mb-1">
                            {group.label}
                        </div>
                        {group.items.map((item) => {
                            const isSelected = allItems[selectedIndex].id === item.id
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        if (item.id === 'paste') {
                                            onSelect(item.data)
                                        } else {
                                            onSelect(item)
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-1.5 hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-100' : ''}`}
                                >
                                    <div className="w-10 h-10 border border-gray-200 rounded flex items-center justify-center bg-white flex-shrink-0">
                                        <item.icon size={18} className="text-gray-600" />
                                    </div>
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-medium text-gray-900">{item.label}</div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    )
}