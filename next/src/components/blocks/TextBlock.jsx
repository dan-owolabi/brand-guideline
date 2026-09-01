'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Palette } from 'lucide-react'
import SlashMenu from '../editor/SlashMenu'

const BLOCK_VARIANTS = [
    { type: 'paragraph', label: 'Text', className: 'prose-paragraph' },
    { type: 'heading1', label: 'Heading 1', className: 'prose-h1' },
    { type: 'heading2', label: 'Heading 2', className: 'prose-h2' },
    { type: 'heading3', label: 'Heading 3', className: 'prose-h3' },
    { type: 'heading4', label: 'Heading 4', className: 'prose-h4' },
    { type: 'small', label: 'Small text', className: 'prose-small' },
    { type: 'quote', label: 'Quote', className: 'prose-quote' },
    { type: 'bullet', label: 'Bulleted list', className: 'prose-list-item' },
    { type: 'numbered', label: 'Numbered list', className: 'prose-list-item' }
]

// Background color presets - very light tints
const BG_COLORS = [
    { name: 'None', value: 'transparent' },
    { name: 'Gray', value: '#f9fafb' },
    { name: 'Blue', value: '#eff6ff' },
    { name: 'Green', value: '#f0fdf4' },
    { name: 'Yellow', value: '#fefce8' },
    { name: 'Red', value: '#fef2f2' },
    { name: 'Purple', value: '#faf5ff' },
]

export default function TextBlock({
    content,
    isAdmin = false,
    onUpdate,
    onAddNext,
    onTransform,
    shouldOpenMenu = false
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [showSlashMenu, setShowSlashMenu] = useState(false)
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })
    const [isEmpty, setIsEmpty] = useState(!content?.text)

    const editorRef = useRef(null)
    const containerRef = useRef(null)
    const debounceTimerRef = useRef(null)
    const lastSavedRef = useRef(content?.text || '')

    const blockType = content?.variant || 'paragraph'
    const variant = BLOCK_VARIANTS.find(v => v.type === blockType) || BLOCK_VARIANTS[0]

    // Set initial content ONLY on mount
    useEffect(() => {
        if (editorRef.current && content?.text !== undefined) {
            editorRef.current.innerHTML = content.text
            lastSavedRef.current = content.text
            // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived state alongside an imperative write to the contentEditable DOM (an external system), not avoidable derived state
            setIsEmpty(!content.text || content.text === '<br>')
        }
    }, [content?.text])

    // Handle external content updates (e.g., from database sync or undo) 
    // Only update if we're not currently editing AND content changed externally
    useEffect(() => {
        if (!isEditing && editorRef.current) {
            const currentDOMContent = editorRef.current.innerHTML
            // If props changed and we're not editing, sync
            if (content?.text !== lastSavedRef.current && content?.text !== currentDOMContent) {
                editorRef.current.innerHTML = content?.text || ''
                lastSavedRef.current = content?.text || ''
                // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing derived state alongside an imperative write to the contentEditable DOM (an external system), not avoidable derived state
                setIsEmpty(!content?.text || content?.text === '<br>')
            }
        }
    }, [content?.text, isEditing])

    // Handle auto-opening menu
    useEffect(() => {
        if (shouldOpenMenu && editorRef.current && !showSlashMenu) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to imperative focus/selection on the contentEditable DOM (an external system), not avoidable derived state
            setIsEditing(true)
            setShowSlashMenu(true)
            setMenuPosition({ top: 28, left: 0 })
            editorRef.current.focus()

            const range = document.createRange()
            range.selectNodeContents(editorRef.current)
            range.collapse(false)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
        }
    }, [shouldOpenMenu, showSlashMenu])

    const saveContent = useCallback((text) => {
        if (text !== lastSavedRef.current) {
            lastSavedRef.current = text
            onUpdate?.({ ...content, text })
        }
    }, [content, onUpdate])

    const handleInput = (e) => {
        const newText = e.currentTarget.innerHTML
        setIsEmpty(!newText || newText === '<br>')

        // Debounce save
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
            saveContent(newText)
        }, 500)
    }

    const handleBlur = () => {
        // Clear pending debounce and save immediately
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

        setTimeout(() => {
            if (!showSlashMenu) {
                setIsEditing(false)
                const currentText = editorRef.current?.innerHTML || ''
                saveContent(currentText)
            }
        }, 200)
    }

    const handleKeyDown = (e) => {
        if (showSlashMenu) {
            if (['ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
                e.preventDefault()
                return
            }
            if (e.key === 'Escape') {
                e.preventDefault()
                setShowSlashMenu(false)
                editorRef.current?.focus()
                return
            }
        }

        if (e.key === '/') {
            const rect = editorRef.current.getBoundingClientRect()
            setMenuPosition({
                top: rect.height,
                left: 0
            })
            setShowSlashMenu(true)
        }

        if (e.key === 'Enter' && !e.shiftKey && !showSlashMenu) {
            const currentText = editorRef.current?.innerHTML || ''
            const textContent = editorRef.current?.textContent || ''

            // Only create new block if the line is empty (user double-pressed Enter)
            if (!textContent.trim()) {
                e.preventDefault()
                saveContent(currentText)
                const isListItem = blockType === 'bullet' || blockType === 'numbered'
                onAddNext?.(isListItem ? blockType : 'paragraph')
            }
            // Otherwise, let the default Enter behavior happen (new line)
        }

        if (e.key === 'Backspace') {
            const currentText = editorRef.current?.innerHTML || ''
            if (!currentText || currentText === '<br>') {
                if (blockType !== 'paragraph' && onTransform) {
                    e.preventDefault()
                    onTransform('text', 'paragraph')
                }
            }
        }
    }

    // Strip external formatting but preserve line breaks and detect lists
    const handlePaste = (e) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')

        // Split into lines
        const lines = text.split(/\r?\n/)

        // Detect if this is a bulleted or numbered list
        const bulletPatterns = /^\s*[•*◦◆▪▸►-]\s*/
        const numberedPatterns = /^\s*\d+[.)]\s*/

        let isBulletList = lines.filter(l => l.trim()).every(line => bulletPatterns.test(line))
        let isNumberedList = lines.filter(l => l.trim()).every(line => numberedPatterns.test(line))

        const selection = window.getSelection()
        if (!selection.rangeCount) return

        const range = selection.getRangeAt(0)
        range.deleteContents()

        let html

        if (isBulletList) {
            // Create unordered list
            const listItems = lines
                .filter(line => line.trim())
                .map(line => `<li>${line.replace(bulletPatterns, '')}</li>`)
                .join('')
            html = `<ul>${listItems}</ul>`
        } else if (isNumberedList) {
            // Create ordered list
            const listItems = lines
                .filter(line => line.trim())
                .map(line => `<li>${line.replace(numberedPatterns, '')}</li>`)
                .join('')
            html = `<ol>${listItems}</ol>`
        } else {
            // Regular text with line breaks
            const fragment = document.createDocumentFragment()
            lines.forEach((line, index) => {
                if (index > 0) {
                    fragment.appendChild(document.createElement('br'))
                }
                if (line) {
                    fragment.appendChild(document.createTextNode(line))
                }
            })
            range.insertNode(fragment)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)

            // Trigger input event to save
            const inputEvent = new Event('input', { bubbles: true })
            editorRef.current?.dispatchEvent(inputEvent)
            return
        }

        // Insert list HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = html
        const listElement = tempDiv.firstChild
        range.insertNode(listElement)

        // Move cursor to end
        range.setStartAfter(listElement)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)

        // Trigger input event to save
        const inputEvent = new Event('input', { bubbles: true })
        editorRef.current?.dispatchEvent(inputEvent)
    }

    const handleSlashSelect = (item) => {
        setShowSlashMenu(false)
        if (onTransform) {
            if (item.type === 'text') {
                onTransform('text', item.variant)
                onUpdate?.({ ...content, variant: item.variant })
            } else {
                onTransform(item.type)
            }
        }
    }

    // Helper to fix double-encoded HTML entities (e.g., &amp;amp; → &amp;)
    const fixDoubleEncodedEntities = (html) => {
        return html
            .replace(/&amp;amp;/g, '&amp;')
            .replace(/&amp;lt;/g, '&lt;')
            .replace(/&amp;gt;/g, '&gt;')
            .replace(/&amp;quot;/g, '&quot;')
            .replace(/&amp;#/g, '&#')
    }

    const renderReadOnly = () => {
        // Fix any double-encoded HTML entities
        const rawHtml = content?.text || ''
        const html = fixDoubleEncodedEntities(rawHtml)

        if (blockType === 'bullet') {
            return (
                <div className="flex gap-2">
                    <span className="text-gray-400 select-none">•</span>
                    <div className="flex-1" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            )
        }
        if (blockType === 'numbered') {
            return (
                <div className="flex gap-2 prose-numbered-item">
                    <span className="text-gray-400 select-none font-medium prose-numbered-item-label min-w-[20px]"></span>
                    <div className="flex-1" dangerouslySetInnerHTML={{ __html: html }} />
                </div>
            )
        }
        if (blockType === 'quote') {
            return (
                <div>
                    <div dangerouslySetInnerHTML={{ __html: html }} />
                    {content?.attribution && (
                        <span className="prose-quote-attribution">— {content.attribution}</span>
                    )}
                </div>
            )
        }

        return <div dangerouslySetInnerHTML={{ __html: html }} />
    }

    const tightClass = content?.tightSpacing ? 'block-tight' : ''
    const bgColor = content?.backgroundColor || 'transparent'
    const hasPadding = content?.hasPadding && bgColor !== 'transparent'

    const blockStyle = {
        backgroundColor: bgColor,
        padding: hasPadding ? '0.75rem 1.25rem' : undefined,
        borderRadius: hasPadding ? '0.5rem' : undefined,
        margin: hasPadding ? '0.5rem 0' : undefined,
    }

    if (!isAdmin) {
        return (
            <div className={`${variant.className} ${tightClass}`} style={blockStyle}>
                {renderReadOnly()}
            </div>
        )
    }

    return (
        <div
            className={`relative group min-h-[1.5em] ${variant.className} ${tightClass} ${isEditing ? 'block-active-bg' : ''} ${isAdmin ? 'block-hover-outline' : ''} rounded-lg`}
            style={blockStyle}
            ref={containerRef}
        >
            {/* Color picker button - shows on hover */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setShowColorPicker(!showColorPicker)
                }}
                className={`absolute -right-10 top-0 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity ${bgColor !== 'transparent' ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                title="Background color"
            >
                <Palette size={16} />
            </button>

            {/* Color picker dropdown */}
            {showColorPicker && (
                <div
                    className="absolute -right-2 top-8 bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50 min-w-[140px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-[10px] uppercase font-medium tracking-wide text-gray-400 mb-1.5 px-1">Background</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                        {BG_COLORS.map((color) => (
                            <button
                                key={color.value}
                                onClick={() => {
                                    onUpdate?.({ ...content, backgroundColor: color.value })
                                    if (color.value !== 'transparent') {
                                        onUpdate?.({ ...content, backgroundColor: color.value, hasPadding: true })
                                    } else {
                                        onUpdate?.({ ...content, backgroundColor: color.value, hasPadding: false })
                                    }
                                }}
                                className={`w-6 h-6 rounded border-2 transition-all ${bgColor === color.value ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-gray-300'}`}
                                style={{ backgroundColor: color.value === 'transparent' ? '#fff' : color.value }}
                                title={color.name}
                            >
                                {color.value === 'transparent' && (
                                    <span className="block w-full h-full relative overflow-hidden rounded">
                                        <span className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent" style={{ background: 'linear-gradient(135deg, transparent 45%, #ef4444 45%, #ef4444 55%, transparent 55%)' }} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                    {bgColor !== 'transparent' && (
                        <label className="flex items-center gap-2 px-1 py-1 text-xs text-gray-600 cursor-pointer hover:bg-gray-50 rounded">
                            <input
                                type="checkbox"
                                checked={content?.hasPadding || false}
                                onChange={(e) => onUpdate?.({ ...content, hasPadding: e.target.checked })}
                                className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            Add padding
                        </label>
                    )}
                    <button
                        onClick={() => setShowColorPicker(false)}
                        className="w-full mt-1 text-xs text-gray-400 hover:text-gray-600 py-1"
                    >
                        Close
                    </button>
                </div>
            )}

            {isEmpty && !showSlashMenu && (
                <div className="absolute top-0 left-4 text-gray-300 pointer-events-none select-none z-0">
                    {blockType === 'heading1' ? 'Heading 1' :
                        blockType === 'heading2' ? 'Heading 2' :
                            blockType === 'heading3' ? 'Heading 3' :
                                blockType === 'heading4' ? 'Heading 4' :
                                    blockType === 'quote' ? 'Quote' :
                                        'Start writing...'}
                </div>
            )}

            <div className={`flex items-start gap-2 ${blockType === 'numbered' ? 'prose-numbered-item' : ''}`}>
                {blockType === 'bullet' && <span className="text-gray-400 pt-0 select-none w-5 flex-shrink-0 text-center">•</span>}
                {blockType === 'numbered' && <span className="text-gray-400 pt-0 select-none font-medium prose-numbered-item-label w-5 flex-shrink-0 text-center"></span>}

                {/* KEY FIX: No dangerouslySetInnerHTML here - content is set via useEffect */}
                <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onFocus={() => setIsEditing(true)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className="w-full bg-transparent border-none outline-none min-h-[1.5em] z-10 relative"
                    style={{ color: 'inherit', font: 'inherit', lineHeight: 'inherit' }}
                />
            </div>

            {showSlashMenu && (
                <SlashMenu
                    position={menuPosition}
                    onSelect={handleSlashSelect}
                    onClose={() => {
                        setShowSlashMenu(false)
                        editorRef.current?.focus()
                    }}
                />
            )}
        </div>
    )
}