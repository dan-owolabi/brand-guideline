'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered, LucideIcon } from 'lucide-react'

interface ToolbarState {
    visible: boolean
    top: number
    left: number
}

interface ActiveFormats {
    bold: boolean
    italic: boolean
    underline: boolean
    strikeThrough: boolean
    mono: boolean
    unorderedList: boolean
    orderedList: boolean
}

interface FormatButtonProps {
    icon: LucideIcon
    label: string
    active: boolean
    prevActive: boolean
    nextActive: boolean
    onClick: (e: React.MouseEvent) => void
}

function FormatButton({ icon: Icon, label, active, prevActive, nextActive, onClick }: FormatButtonProps) {
    let borderRadius = '9999px'

    if (active) {
        if (prevActive && nextActive) {
            borderRadius = '1px'
        } else if (prevActive) {
            borderRadius = '1px 9999px 9999px 1px'
        } else if (nextActive) {
            borderRadius = '9999px 1px 1px 9999px'
        }
    }

    return (
        <button
            onClick={onClick}
            className={`p-2 transition-colors ${active
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full'
                }`}
            style={active ? { borderRadius } : undefined}
            title={label}
        >
            <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        </button>
    )
}

export default function FloatingTextToolbar() {
    const [toolbarState, setToolbarState] = useState<ToolbarState>({
        visible: false,
        top: 0,
        left: 0,
    })
    const [activeFormats, setActiveFormats] = useState<ActiveFormats>({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        mono: false,
        unorderedList: false,
        orderedList: false,
    })
    const toolbarRef = useRef<HTMLDivElement>(null)

    const checkActiveFormats = useCallback(() => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            mono: document.queryCommandValue('fontName')?.toLowerCase().includes('monospace') || false,
            unorderedList: document.queryCommandState('insertUnorderedList'),
            orderedList: document.queryCommandState('insertOrderedList'),
        })
    }, [])

    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection()
            if (!selection || selection.isCollapsed) {
                setToolbarState(prev => ({ ...prev, visible: false }))
                return
            }

            if (!selection.anchorNode?.parentElement?.closest('[contenteditable="true"]')) {
                setToolbarState(prev => ({ ...prev, visible: false }))
                return
            }

            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            if (rect.width === 0) {
                setToolbarState(prev => ({ ...prev, visible: false }))
                return
            }

            const toolbarWidth = 180
            const toolbarHeight = 40

            let left = rect.left + rect.width / 2 - toolbarWidth / 2
            let top = rect.top - toolbarHeight - 8

            if (left < 10) left = 10
            if (left + toolbarWidth > window.innerWidth - 10) {
                left = window.innerWidth - toolbarWidth - 10
            }
            if (top < 10) {
                top = rect.bottom + 8
            }

            setToolbarState({
                visible: true,
                top: top,
                left: left,
            })

            checkActiveFormats()
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        window.addEventListener('resize', handleSelectionChange)

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
            window.removeEventListener('resize', handleSelectionChange)
        }
    }, [checkActiveFormats])

    const handleFormat = (e: React.MouseEvent, command: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (command === 'mono') {
            if (activeFormats.mono) {
                document.execCommand('fontName', false, 'inherit')
            } else {
                document.execCommand('fontName', false, 'monospace')
            }
        } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
            document.execCommand(command, false)

            const selection = window.getSelection()
            const editor = selection?.anchorNode?.parentElement?.closest('[contenteditable="true"]')
            if (editor) {
                editor.dispatchEvent(new Event('input', { bubbles: true }))
            }
        } else {
            document.execCommand(command, false)
        }

        setTimeout(checkActiveFormats, 10)
    }

    if (!toolbarState.visible) return null

    return (
        <div
            ref={toolbarRef}
            className="fixed z-[100] bg-gray-100 shadow-lg rounded-full flex items-center p-1 gap-0 animate-in fade-in zoom-in duration-100"
            style={{
                top: toolbarState.top,
                left: toolbarState.left,
            }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <FormatButton
                icon={Bold}
                label="Bold (Ctrl+B)"
                active={activeFormats.bold}
                prevActive={false}
                nextActive={activeFormats.italic}
                onClick={(e) => handleFormat(e, 'bold')}
            />
            <FormatButton
                icon={Italic}
                label="Italic (Ctrl+I)"
                active={activeFormats.italic}
                prevActive={activeFormats.bold}
                nextActive={activeFormats.underline}
                onClick={(e) => handleFormat(e, 'italic')}
            />
            <FormatButton
                icon={Underline}
                label="Underline (Ctrl+U)"
                active={activeFormats.underline}
                prevActive={activeFormats.italic}
                nextActive={activeFormats.strikeThrough}
                onClick={(e) => handleFormat(e, 'underline')}
            />
            <FormatButton
                icon={Strikethrough}
                label="Strikethrough"
                active={activeFormats.strikeThrough}
                prevActive={activeFormats.underline}
                nextActive={activeFormats.mono}
                onClick={(e) => handleFormat(e, 'strikeThrough')}
            />
            <FormatButton
                icon={Code}
                label="Mono"
                active={activeFormats.mono}
                prevActive={activeFormats.strikeThrough}
                nextActive={false}
                onClick={(e) => handleFormat(e, 'mono')}
            />

            <div className="w-px h-5 bg-gray-300 mx-1" />

            <FormatButton
                icon={List}
                label="Bulleted list"
                active={activeFormats.unorderedList}
                prevActive={false}
                nextActive={activeFormats.orderedList}
                onClick={(e) => handleFormat(e, 'insertUnorderedList')}
            />
            <FormatButton
                icon={ListOrdered}
                label="Numbered list"
                active={activeFormats.orderedList}
                prevActive={activeFormats.unorderedList}
                nextActive={false}
                onClick={(e) => handleFormat(e, 'insertOrderedList')}
            />
        </div>
    )
}
