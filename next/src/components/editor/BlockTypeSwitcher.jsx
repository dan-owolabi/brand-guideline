'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
    Type, Heading1, Heading2, Heading3,
    List, ListOrdered, Quote, Minus,
    Image, Video, FileCode, Paperclip,
    ChevronDown, Check, Table2
} from 'lucide-react'

const MENU_ITEMS = [
    {
        label: 'Turn into', items: [
            { id: 'text', label: 'Text', icon: Type, type: 'text', variant: 'paragraph' },
            { id: 'h1', label: 'Heading 1', icon: Heading1, type: 'text', variant: 'heading1' },
            { id: 'h2', label: 'Heading 2', icon: Heading2, type: 'text', variant: 'heading2' },
            { id: 'h3', label: 'Heading 3', icon: Heading3, type: 'text', variant: 'heading3' },
            { id: 'h4', label: 'Heading 4', icon: Heading2, type: 'text', variant: 'heading4' },
            { id: 'small', label: 'Small text', icon: Type, type: 'text', variant: 'small' },
            { id: 'quote', label: 'Quote', icon: Quote, type: 'text', variant: 'quote' },
            { id: 'divider', label: 'Divider', icon: Minus, type: 'divider' },
            { id: 'table', label: 'Table', icon: Table2, type: 'table' }
        ]
    },
    {
        label: 'Media', items: [
            { id: 'image', label: 'Image', icon: Image, type: 'image' },
            { id: 'imageGrid', label: 'Image Grid', icon: Image, type: 'imageGrid' },
            { id: 'video', label: 'Video', icon: Video, type: 'video' },
            { id: 'link', label: 'Link', icon: Paperclip, type: 'link' },
            { id: 'embed', label: 'Embed', icon: FileCode, type: 'embed' }
        ]
    }
]

export default function BlockTypeSwitcher({ block, onTransform }) {
    const [open, setOpen] = useState(false)
    const menuRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (item, e) => {
        // Handle Formatting commands
        if (item.type === 'format') {
            e.preventDefault()
            e.stopPropagation()
            document.execCommand(item.command, false, item.value || null)
            setOpen(false)
            return
        }

        onTransform(item.type, item.variant)
        setOpen(false)
    }

    // Determine current icon/label
    const getCurrentItem = () => {
        if (block.type === 'text') {
            const variant = block.content?.variant || 'paragraph'
            return MENU_ITEMS[0].items.find(i => i.variant === variant) || MENU_ITEMS[0].items[0]
        }
        if (block.type === 'image') return { icon: Image, label: 'Image' }
        if (block.type === 'imageGrid') return { icon: Image, label: 'Image Grid' }
        if (block.type === 'video') return { icon: Video, label: 'Video' }
        if (block.type === 'embed') return { icon: FileCode, label: 'Embed' }
        if (block.type === 'link') return { icon: Paperclip, label: 'Link' }
        if (block.type === 'divider') return { icon: Minus, label: 'Divider' }
        if (block.type === 'table') return { icon: Table2, label: 'Table' }

        return { icon: Type, label: 'Block' }
    }

    const currentItem = getCurrentItem()

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setOpen(!open)
                }}
                className="p-1.5 text-gray-300 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 flex items-center justify-center gap-1"
                title="Change block type"
            >
                <span className="text-xs font-medium w-max text-gray-400 hover:text-gray-900 w-12 text-right truncate">
                    {currentItem.label}
                </span>
                <ChevronDown size={12} />
            </button>

            {open && (
                <div
                    className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in duration-150 origin-top-left"
                    style={{ minWidth: '180px' }}
                >
                    <div className="py-1 max-h-64 overflow-y-auto">
                        {MENU_ITEMS.map((group, groupIndex) => (
                            <div key={group.label} className={groupIndex > 0 ? 'border-t border-gray-100 mt-1 pt-1' : ''}>
                                <div className="px-3 py-1 text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                                    {group.label}
                                </div>
                                {group.items.map((item) => {
                                    const isActive = block.type === 'text' && block.content?.variant === item.variant
                                    return (
                                        <button
                                            key={item.id}
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={(e) => handleSelect(item, e)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${isActive ? 'bg-gray-50 text-blue-600' : 'text-gray-700'}`}
                                        >
                                            <item.icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                                            <span className="flex-1 text-left">{item.label}</span>
                                            {isActive && <Check size={14} />}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}