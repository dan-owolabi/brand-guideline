'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered } from 'lucide-react'

export default function FloatingTextToolbar() {
    const [toolbarState, setToolbarState] = useState({
        visible: false,
        top: 0,
        left: 0,
    })
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        mono: false,
        unorderedList: false,
        orderedList: false,
    })
    const toolbarRef = useRef(null)

    const checkActiveFormats = useCallback(() => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            mono: document.queryCommandValue('fontName')?.toLowerCase().includes('monospace'),
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

            // Check if selection is inside an editor
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

            // Position centered above selection
            const toolbarWidth = 180
            const toolbarHeight = 40

            let left = rect.left + rect.width / 2 - toolbarWidth / 2
            let top = rect.top - toolbarHeight - 8

            // Keep within viewport bounds
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

            // Check which formats are currently active
            checkActiveFormats()
        }

        document.addEventListener('selectionchange', handleSelectionChange)
        window.addEventListener('resize', handleSelectionChange)

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange)
            window.removeEventListener('resize', handleSelectionChange)
        }
    }, [checkActiveFormats])

    const handleFormat = (e, command, value = null) => {
        e.preventDefault()
        e.stopPropagation()

        if (command === 'mono') {
            // Toggle mono: if already mono, remove it; otherwise apply
            if (activeFormats.mono) {
                document.execCommand('fontName', false, 'inherit')
            } else {
                document.execCommand('fontName', false, 'monospace')
            }
        } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
            // Use browser's native list command - it handles toggle properly
            document.execCommand(command, false, null)

            // Trigger input event to save
            const selection = window.getSelection()
            const editor = selection?.anchorNode?.parentElement?.closest('[contenteditable="true"]')
            if (editor) {
                editor.dispatchEvent(new Event('input', { bubbles: true }))
            }
        } else {
            document.execCommand(command, false, value)
        }

        // Update active states after applying
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

            {/* Divider */}
            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* List formatting */}
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

// eslint-disable-next-line no-unused-vars -- Icon is used as a JSX tag below; core no-unused-vars doesn't track that for params
function FormatButton({ icon: Icon, label, active, prevActive, nextActive, onClick }) {
    // Determine border radius based on neighbors
    let borderRadius = '9999px' // Full circle by default

    if (active) {
        if (prevActive && nextActive) {
            // Both neighbors active: flat on both sides
            borderRadius = '1px'
        } else if (prevActive) {
            // Previous is active: flat on left, round on right
            borderRadius = '1px 9999px 9999px 1px'
        } else if (nextActive) {
            // Next is active: round on left, flat on right
            borderRadius = '9999px 1px 1px 9999px'
        }
        // else: neither neighbor is active, stays full circle
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