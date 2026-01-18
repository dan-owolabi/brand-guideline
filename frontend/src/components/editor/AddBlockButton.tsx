'use client'

import { useState } from 'react'
import { Plus, Type, AlignLeft, Image, AlertCircle, Minus, Link, LucideIcon } from 'lucide-react'

interface BlockContent {
    text?: string
    level?: number
    src?: string | null
    alt?: string
    type?: string
    url?: string
    label?: string
}

interface BlockOption {
    type: string
    label: string
    icon: LucideIcon
    defaultContent: BlockContent
}

const BLOCK_OPTIONS: BlockOption[] = [
    { type: 'heading', label: 'Heading', icon: Type, defaultContent: { text: '', level: 2 } },
    { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, defaultContent: { text: '' } },
    { type: 'image', label: 'Image', icon: Image, defaultContent: { src: null, alt: '' } },
    { type: 'callout', label: 'Callout', icon: AlertCircle, defaultContent: { type: 'info', text: '' } },
    { type: 'divider', label: 'Divider', icon: Minus, defaultContent: {} },
    { type: 'link', label: 'Link', icon: Link, defaultContent: { url: '', label: '' } }
]

interface NewBlock {
    id: string
    type: string
    content: BlockContent
}

interface AddBlockButtonProps {
    onAdd: (block: NewBlock) => void
    isVisible?: boolean
}

export default function AddBlockButton({ onAdd, isVisible = false }: AddBlockButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleAdd = (option: BlockOption) => {
        onAdd({
            id: crypto.randomUUID(),
            type: option.type,
            content: option.defaultContent
        })
        setIsOpen(false)
    }

    return (
        <div className={`
      relative h-0 flex items-center justify-center
      ${isVisible ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
      transition-opacity
    `}>
            {/* The + button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
          absolute z-10 p-1.5 rounded-full border-2 
          ${isOpen
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500'
                    }
          transition-colors shadow-sm
        `}
            >
                <Plus size={16} className={isOpen ? 'rotate-45' : ''} style={{ transition: 'transform 0.2s' }} />
            </button>

            {/* Block type menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                        {BLOCK_OPTIONS.map((option) => {
                            const IconComponent = option.icon
                            return (
                                <button
                                    key={option.type}
                                    onClick={() => handleAdd(option)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <IconComponent size={16} className="text-gray-400" />
                                    {option.label}
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}
