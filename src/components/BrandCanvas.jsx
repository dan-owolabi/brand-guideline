import { useState, useEffect, useMemo } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { useBrandEditor } from '../hooks/useBrandEditor'
import { getBlockComponent } from './blocks'
import BlockWrapper from './editor/BlockWrapper'
import { Dialog, DialogContent, DialogFooter } from './ui/Dialog'
import { PublishModal } from './ui/PublishModal'
import Header from './Header'
import { Plus, Loader2, ChevronLeft, ChevronRight, Trash2, GripVertical, Copy, X } from 'lucide-react'
import BlockTypeSwitcher from './editor/BlockTypeSwitcher'
import FloatingTextToolbar from './editor/FloatingTextToolbar'
import SlashMenu from './editor/SlashMenu'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

/**
 * BrandCanvas - The unified renderer/editor for brand guidelines.
 * Same component serves both public (read-only) and admin (editable) views.
 */
export default function BrandCanvas({ isAdmin = false, brandData }) {
    const params = useParams()
    const navigate = useNavigate()
    const activeSlug = params.slug

    // Use provided brandData (public) or fetch draft (admin)
    const {
        draft,
        loading,
        saving,
        error,
        publish,
        updateBlock,
        addBlock,
        removeBlock,
        updateSection,
        addSection,
        removeSection,
        reorderBlocks,
        brandMetadata: adminBrandMetadata,
        updateBrandMetadata,
        undo,
        redo
    } = useBrandEditor(isAdmin ? params.brandId : null)

    // For public view, use brandData directly; for admin, use hook metadata
    const brandMetadata = isAdmin ? adminBrandMetadata : {
        id: brandData?.brandId,
        name: brandData?.name,
        logoUrl: brandData?.logoUrl,
        primaryColor: brandData?.primaryColor
    }

    // Undo/Redo keyboard shortcuts
    // Global undo/redo keyboard shortcuts - only when not editing text
    useEffect(() => {
        if (!isAdmin) return

        const handleKeyDown = (e) => {
            // Check if user is editing in a contenteditable element
            const activeElement = document.activeElement
            const isEditingText = activeElement?.closest('[contenteditable="true"]') ||
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA'

            // Only intercept Ctrl+Z when NOT editing text
            // This allows native browser undo to work in text fields
            if (!isEditingText && (e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) {
                    redo()
                } else {
                    undo()
                }
            }
            // Also support Ctrl+Y for redo
            if (!isEditingText && (e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault()
                redo()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isAdmin, undo, redo])

    const [publishSuccess, setPublishSuccess] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [hoveredBlockIndex, setHoveredBlockIndex] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [autoOpenMenuBlockId, setAutoOpenMenuBlockId] = useState(null)
    const [sectionToDelete, setSectionToDelete] = useState(null)
    const [addBlockMenuPos, setAddBlockMenuPos] = useState(null) // { top, left, insertIndex }

    // Multi-select state
    const [selectedBlockIds, setSelectedBlockIds] = useState(new Set())
    const [lastSelectedBlockId, setLastSelectedBlockId] = useState(null)

    // Use draft for admin, brandData for public
    const data = isAdmin ? draft : brandData?.published
    const sections = data?.sections || []
    const tokens = data?.tokens || {}

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Group sections by their group property
    // NOTE: All hooks must be called before any early returns to comply with React's Rules of Hooks
    const groupedSections = useMemo(() => {
        const groups = {}
        sections.forEach(s => {
            const g = s.group || 'General'
            if (!groups[g]) groups[g] = []
            groups[g].push(s)
        })
        return groups
    }, [sections])

    // Find current active section
    const activeSection = useMemo(() => {
        if (!activeSlug) return sections[0]
        return sections.find(s => s.slug === activeSlug) || sections[0]
    }, [activeSlug, sections])

    // Navigation pagination
    const allSectionsList = useMemo(() => sections, [sections])

    // Extract H2/H3 for current section
    const subheadings = useMemo(() => {
        if (!activeSection?.blocks) return []
        return activeSection.blocks
            .filter(b => b.type === 'text' && b.content?.variant === 'heading2')
            .map(b => ({
                id: b.id,
                text: b.content?.text,
                variant: b.content?.variant
            }))
    }, [activeSection])

    // Helper to decode HTML entities in text (runs twice to handle double-encoding)
    const decodeEntities = (text) => {
        if (!text) return text
        const textarea = document.createElement('textarea')
        // First decode
        textarea.innerHTML = text
        let decoded = textarea.value
        // Second decode to handle double-encoded entities (e.g., &amp; stored as literal text)
        textarea.innerHTML = decoded
        return textarea.value
    }

    // Early returns for loading and error states - AFTER all hooks
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-center">
                    <h3 className="font-bold mb-2">Error Loading Brand</h3>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    if (loading && !brandData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-gray-400" size={32} />
                    <p className="text-sm font-medium text-gray-500">Loading guidelines...</p>
                </div>
            </div>
        )
    }

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = activeSection.blocks.findIndex((b) => b.id === active.id)
            const newIndex = activeSection.blocks.findIndex((b) => b.id === over.id)
            reorderBlocks(activeSection.id, oldIndex, newIndex)
        }
    }

    const activeSectionIndex = allSectionsList.findIndex(s => s.id === activeSection?.id)
    const prevSection = activeSectionIndex > 0 ? allSectionsList[activeSectionIndex - 1] : null
    const nextSection = activeSectionIndex < allSectionsList.length - 1 ? allSectionsList[activeSectionIndex + 1] : null

    const [publishModalOpen, setPublishModalOpen] = useState(false)

    const handlePublishClick = () => {
        setPublishModalOpen(true)
    }

    const handleConfirmPublish = async (slug) => {
        setIsPublishing(true)
        try {
            await publish({ slug })
            setPublishSuccess(true)
            setPublishModalOpen(false)
            setTimeout(() => setPublishSuccess(false), 3000)
        } catch (err) {
            alert('Failed to publish: ' + err.message)
        } finally {
            setIsPublishing(false)
        }
    }

    const handleAddSection = () => {
        const title = "Untitled Section"
        const slug = `untitled-${Date.now()}`

        // Use the last group from existing sections, or default to first group
        const existingGroups = [...new Set(sections.map(s => s.group).filter(Boolean))]
        const lastGroup = existingGroups[existingGroups.length - 1] || existingGroups[0] || "General"

        addSection({
            title,
            slug,
            group: lastGroup,
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    content: { text: '', variant: 'paragraph' }
                }
            ]
        })
        const brandId = brandData?.brandId || params.brandId
        navigate(`/admin/brand/${brandId}/${slug}`)
    }

    const handleRemoveSection = () => {
        if (!sectionToDelete) return
        removeSection(sectionToDelete)
        setSectionToDelete(null)
        const brandId = brandData?.brandId || params.brandId
        navigate(`/admin/brand/${brandId}/introduction`)
    }

    const handleBlockUpdate = (blockIndex, newContent) => {
        if (!activeSection) return
        updateBlock(activeSection.id, blockIndex, newContent)
    }

    const handleAddBlock = (atIndex, newBlockOrBlocks, autoOpen = false) => {
        if (!activeSection) return
        const blocks = [...(activeSection.blocks || [])]

        if (Array.isArray(newBlockOrBlocks)) {
            blocks.splice(atIndex, 0, ...newBlockOrBlocks)
            // Auto open first one? Or none?
        } else {
            blocks.splice(atIndex, 0, newBlockOrBlocks)
        }

        updateSection(activeSection.id, { blocks })

        if (autoOpen && !Array.isArray(newBlockOrBlocks)) {
            setAutoOpenMenuBlockId(newBlockOrBlocks.id)
            setTimeout(() => setAutoOpenMenuBlockId(null), 100)
        }
    }

    const confirmDeleteBlock = (index) => {
        if (!activeSection) return
        removeBlock(activeSection.id, index)
    }

    const handleCopyBlock = async (index) => {
        if (!activeSection || !activeSection.blocks?.[index]) return
        const block = activeSection.blocks[index]
        try {
            await navigator.clipboard.writeText(JSON.stringify(block))
        } catch (err) {
            console.error('Failed to copy block:', err)
        }
    }

    // Multi-select handlers
    const handleBlockSelect = (blockId, e) => {
        if (!activeSection) return
        e.stopPropagation() // Prevent clearing selection when clicking a block handler

        const isShift = e.shiftKey

        const newSelected = new Set(selectedBlockIds)

        if (isShift && lastSelectedBlockId && activeSection.blocks.some(b => b.id === lastSelectedBlockId)) {
            // Range selection
            const blocks = activeSection.blocks
            const lastIndex = blocks.findIndex(b => b.id === lastSelectedBlockId)
            const currentIndex = blocks.findIndex(b => b.id === blockId)

            const start = Math.min(lastIndex, currentIndex)
            const end = Math.max(lastIndex, currentIndex)

            for (let i = start; i <= end; i++) {
                newSelected.add(blocks[i].id)
            }
        } else {
            // Toggle selection - clicking a checkbox adds/removes from selection
            if (selectedBlockIds.has(blockId)) {
                newSelected.delete(blockId)
            } else {
                newSelected.add(blockId)
            }
            setLastSelectedBlockId(blockId)
        }

        setSelectedBlockIds(newSelected)
    }

    const clearSelection = () => {
        setSelectedBlockIds(new Set())
        setLastSelectedBlockId(null)
    }

    // Bulk actions
    const handleBulkDelete = () => {
        if (!activeSection || selectedBlockIds.size === 0) return
        if (!confirm(`Delete ${selectedBlockIds.size} blocks?`)) return

        const newBlocks = activeSection.blocks.filter(b => !selectedBlockIds.has(b.id))
        updateSection(activeSection.id, { blocks: newBlocks })
        clearSelection()
    }

    const handleBulkCopy = async () => {
        if (!activeSection || selectedBlockIds.size === 0) return
        const blocksToCopy = activeSection.blocks.filter(b => selectedBlockIds.has(b.id))
        try {
            await navigator.clipboard.writeText(JSON.stringify(blocksToCopy))
        } catch (err) {
            console.error('Failed to copy blocks:', err)
        }
    }

    const handleTransformBlock = (blockIndex, newType, newVariant) => {
        if (!activeSection) return
        const blocks = [...activeSection.blocks]
        const block = blocks[blockIndex]
        if (!block) return

        blocks[blockIndex] = {
            ...block,
            type: newType,
            content: {
                ...block.content,
                variant: newVariant
            }
        }
        updateSection(activeSection.id, { blocks })
    }

    const navigateToSection = (section) => {
        if (!section) return
        const brandId = brandData?.brandId || params.brandId
        const prefix = isAdmin ? `/admin/brand/${brandId}` : `/brand/${brandId}`
        navigate(`${prefix}/${section.slug}`)
    }

    return (
        <div className="min-h-screen bg-white" onClick={clearSelection}>
            {isAdmin && <FloatingTextToolbar />}
            <Header
                brand={brandMetadata}
                isAdmin={isAdmin}
                onPublish={handlePublishClick}
                isPublishing={isPublishing}
                publishSuccess={publishSuccess}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onUpdateBrand={updateBrandMetadata}
            />

            <div className="flex pt-24 h-[calc(100vh-1rem)]">
                {/* Sidebar */}
                <aside className={`
                    fixed md:relative left-0 top-32 md:top-0 bottom-0 w-64 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 z-40
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:w-0 md:translate-x-0 md:border-none md:opacity-0 pointer-events-none md:pointer-events-none'}
                `}>
                    <nav className="flex-1 px-6 py-8 min-w-[16rem] overflow-y-auto">
                        {Object.entries(groupedSections).map(([groupName, groupSections], groupIndex) => (
                            <div key={groupName} className={groupIndex === 0 ? '' : 'pt-4'}>
                                <h3
                                    className={`text-[14px] font-semibold text-[#111] mb-2 ${isAdmin ? 'cursor-text hover:text-gray-600' : ''}`}
                                    contentEditable={isAdmin}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        const newGroupName = e.currentTarget.textContent.trim()
                                        if (isAdmin && newGroupName && newGroupName !== groupName) {
                                            groupSections.forEach(section => {
                                                updateSection(section.id, { group: newGroupName })
                                            })
                                        }
                                    }}
                                >
                                    {groupName}
                                </h3>
                                <ul className="space-y-1.5">
                                    {groupSections.map((section) => {
                                        const isActive = activeSection?.id === section.id
                                        return (
                                            <li key={section.id}>
                                                <div className="flex items-center justify-between group/item">
                                                    <NavLink
                                                        to={isAdmin ? `/admin/brand/${params.brandId}/${section.slug}` : `/brand/${params.brandId}/${section.slug}`}
                                                        className={`flex-1 py-0.5 transition-colors text-[14px] ${isActive ? 'font-medium text-[#111]' : 'font-normal text-[#666]'}`}
                                                    >
                                                        {decodeEntities(section.title)}
                                                    </NavLink>
                                                    {isAdmin && sections.length > 1 && (
                                                        <button
                                                            onClick={() => setSectionToDelete(section.id)}
                                                            className="opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-opacity"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                {isActive && subheadings.length > 0 && (
                                                    <ul className="mt-1 ml-4 space-y-1">
                                                        {subheadings.map(sub => (
                                                            <li key={sub.id}>
                                                                <a
                                                                    href={`#${sub.id}`}
                                                                    onClick={(e) => {
                                                                        e.preventDefault()
                                                                        document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth' })
                                                                    }}
                                                                    className={`
                                                                        block py-1 pl-4 text-[13px] font-light text-[#868585] transition-colors
                                                                        hover:text-[#1c1c1c]
                                                                    `}
                                                                >
                                                                    {sub.text || 'Untitled'}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        ))}
                        {isAdmin && (
                            <button
                                onClick={handleAddSection}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                <Plus size={16} /> Add section
                            </button>
                        )}
                    </nav>

                    {/* Profile Section */}
                    {isAdmin && (
                        <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Danny O.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <main className={`flex-1 pt-32 pb-24 px-8 md:px-16 overflow-y-auto transition-all duration-300 ${sidebarOpen ? '' : 'md:-ml-0'}`}>
                    <article className="max-w-3xl mx-auto pb-24">
                        {activeSection && (
                            <>
                                {/* Section Title */}
                                <h1
                                    className={`text-4xl font-bold text-gray-900 mb-8 ${isAdmin ? 'cursor-text hover:bg-gray-50 rounded px-1 -mx-1' : ''}`}
                                    contentEditable={isAdmin}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                        if (isAdmin && e.currentTarget.textContent !== activeSection.title) {
                                            updateSection(activeSection.id, { title: e.currentTarget.textContent })
                                        }
                                    }}
                                >
                                    {activeSection.title}
                                </h1>

                                {/* Blocks List */}
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <div className="space-y-1 relative group/blocks numbered-list-container">
                                        <SortableContext
                                            items={activeSection.blocks?.map(b => b.id) || []}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {activeSection.blocks?.map((block, index) => {
                                                const BlockComponent = getBlockComponent(block.type)
                                                return (
                                                    <div
                                                        key={block.id}
                                                        onMouseEnter={() => setHoveredBlockIndex(index)}
                                                        onMouseLeave={() => setHoveredBlockIndex(null)}
                                                        className="group/block relative -ml-16 pl-16 rounded-lg transition-colors"
                                                    >
                                                        {/* Hover "+" Button Between Blocks */}
                                                        {isAdmin && (
                                                            <div className="absolute -top-5 left-0 right-0 h-6 z-[60] hidden group-hover/block:flex items-center justify-center pointer-events-none">
                                                                <button
                                                                    className="w-7 h-7 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 rounded-full shadow-sm transition-all pointer-events-auto opacity-0 group-hover/block:opacity-100"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        const rect = e.currentTarget.getBoundingClientRect()
                                                                        setAddBlockMenuPos({
                                                                            top: rect.bottom + 4,
                                                                            left: rect.left - 100,
                                                                            insertIndex: index
                                                                        })
                                                                    }}
                                                                >
                                                                    <Plus size={16} />
                                                                </button>
                                                            </div>
                                                        )}

                                                        <BlockWrapper
                                                            isAdmin={isAdmin}
                                                            blockId={block.id}
                                                        >
                                                            <DndBlockContent
                                                                isAdmin={isAdmin}
                                                                index={index}
                                                                block={block}
                                                                BlockComponent={BlockComponent}
                                                                confirmDeleteBlock={confirmDeleteBlock}
                                                                handleCopyBlock={handleCopyBlock}
                                                                handleBlockUpdate={handleBlockUpdate}
                                                                handleTransformBlock={handleTransformBlock}
                                                                handleAddBlock={handleAddBlock}
                                                                autoOpenMenuBlockId={autoOpenMenuBlockId}
                                                                isSelected={selectedBlockIds.has(block.id)}
                                                                onSelect={(e) => handleBlockSelect(block.id, e)}
                                                                brand={brandMetadata}
                                                            />
                                                        </BlockWrapper>

                                                        {/* Bottom "Click to add" for last block */}
                                                        {isAdmin && index === (activeSection.blocks?.length - 1) && (
                                                            <div
                                                                className="relative mt-4 py-3 text-gray-300 hover:text-gray-500 cursor-text transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    const rect = e.currentTarget.getBoundingClientRect()
                                                                    setAddBlockMenuPos({
                                                                        top: rect.top + window.scrollY,
                                                                        left: rect.left,
                                                                        insertIndex: index + 1
                                                                    })
                                                                }}
                                                            >
                                                                <span className="text-sm">Click to add a block, or type "/" for commands</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </SortableContext>
                                    </div>
                                </DndContext>

                                {/* Bottom "Type '/' to insert" area */}
                                {isAdmin && (!activeSection.blocks || activeSection.blocks.length === 0) && (
                                    <div
                                        className="relative group/new h-12 flex items-center text-gray-300 hover:text-gray-400 cursor-text"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect()
                                            setAddBlockMenuPos({
                                                top: rect.top + window.scrollY,
                                                left: rect.left,
                                                insertIndex: 0
                                            })
                                        }}
                                    >
                                        <div className="flex gap-3 items-center opacity-0 group-hover/new:opacity-100 transition-opacity">
                                            <Plus size={18} />
                                            <span className="text-sm font-medium">Click to add a block</span>
                                        </div>
                                    </div>
                                )}

                                {/* Add Block Menu */}
                                {addBlockMenuPos && (
                                    <div style={{ position: 'fixed', top: addBlockMenuPos.top, left: addBlockMenuPos.left, zIndex: 100 }}>
                                        <SlashMenu
                                            position={{ top: 0, left: 0 }}
                                            onSelect={(itemOrItems) => {
                                                if (Array.isArray(itemOrItems)) {
                                                    // Handle paste (array of blocks)
                                                    // Renew IDs to avoid duplicates if pasting in same doc
                                                    const newBlocks = itemOrItems.map(b => ({
                                                        ...b,
                                                        id: crypto.randomUUID()
                                                    }))
                                                    handleAddBlock(addBlockMenuPos.insertIndex, newBlocks)
                                                } else {
                                                    // Handle single block creation
                                                    let content = {}

                                                    if (itemOrItems.variant) {
                                                        // Text block with variant
                                                        content = { text: '', variant: itemOrItems.variant }
                                                    } else if (itemOrItems.listType) {
                                                        // List block
                                                        content = { items: [''], listType: itemOrItems.listType }
                                                    }

                                                    const newBlock = {
                                                        id: crypto.randomUUID(),
                                                        type: itemOrItems.type,
                                                        content
                                                    }
                                                    handleAddBlock(addBlockMenuPos.insertIndex, newBlock, itemOrItems.type === 'text')
                                                }
                                                setAddBlockMenuPos(null)
                                            }}
                                            onClose={() => setAddBlockMenuPos(null)}
                                        />
                                    </div>
                                )}

                                {/* Navigation Footer */}
                                <div className="mt-24 pt-8 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => {
                                                navigateToSection(prevSection)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            disabled={!prevSection}
                                            className={`flex items-center gap-4 group ${!prevSection ? 'opacity-0 pointer-events-none' : ''}`}
                                        >
                                            <ChevronLeft size={24} className="text-gray-400 group-hover:text-gray-600" />
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-900">{decodeEntities(prevSection?.group)}</p>
                                                <p className="text-sm text-gray-500">{decodeEntities(prevSection?.title)}</p>
                                            </div>
                                        </button>

                                        <div className="h-12 w-px bg-gray-200" />

                                        <button
                                            onClick={() => {
                                                navigateToSection(nextSection)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            disabled={!nextSection}
                                            className={`flex items-center gap-4 group ${!nextSection ? 'opacity-0 pointer-events-none' : ''}`}
                                        >
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-900">{decodeEntities(nextSection?.group)}</p>
                                                <p className="text-sm text-gray-500">{decodeEntities(nextSection?.title)}</p>
                                            </div>
                                            <ChevronRight size={24} className="text-gray-400 group-hover:text-gray-600" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </article>
                </main>
            </div>

            <Dialog open={sectionToDelete !== null} onOpenChange={(open) => !open && setSectionToDelete(null)}>
                <DialogContent>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Section?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this section? This action cannot be undone.
                        </p>
                        <DialogFooter>
                            <button
                                onClick={() => setSectionToDelete(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRemoveSection}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Multi-select Action Bar */}
            {selectedBlockIds.size > 0 && (
                <div
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="text-sm font-medium pl-2 border-r border-gray-700 pr-4">
                        {selectedBlockIds.size} selected
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleBulkCopy}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors flex items-center gap-2 group"
                            title="Copy selected blocks"
                        >
                            <Copy size={16} />
                            <span className="text-xs font-medium">Copy JSON</span>
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="p-2 hover:bg-red-900/50 text-red-200 hover:text-red-100 rounded-full transition-colors flex items-center gap-2"
                            title="Delete selected blocks"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs font-medium">Delete</span>
                        </button>
                    </div>
                    <div className="border-l border-gray-700 pl-2 ml-1">
                        <button
                            onClick={clearSelection}
                            className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <PublishModal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={handleConfirmPublish}
                // Fallback to name-based slug if not set
                initialSlug={brandMetadata?.slug || (brandMetadata?.name ? brandMetadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')}
                brandName={brandMetadata?.name}
                isPublishing={isPublishing}
            />
        </div>
    )
}

// Sub-component to handle dragHandleProps injection correctly
function DndBlockContent({
    isAdmin,
    index,
    block,
    BlockComponent,
    confirmDeleteBlock,
    handleCopyBlock,
    handleBlockUpdate,
    handleTransformBlock,
    handleAddBlock,
    autoOpenMenuBlockId,
    dragHandleProps,
    isSelected,
    onSelect,
    brand
}) {
    const content = block.content || block.data || {}
    const isTight = content.tightSpacing === true

    const toggleTightSpacing = () => {
        handleBlockUpdate(index, { ...content, tightSpacing: !isTight })
    }

    return (
        <div
            className={`flex items-baseline gap-4 relative transition-all duration-200 ${isTight ? 'block-tight' : ''} ${isSelected ? 'bg-blue-50/50 -mx-4 px-4 rounded-lg ring-1 ring-blue-500/20' : ''}`}
        >
            {/* Side Controls (Admin Only) */}
            {isAdmin && (
                <div
                    className={`w-0 flex-none transition-opacity z-[70] ${isSelected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100'}`}
                    onClick={(e) => {
                        // Allow clicking empty space in controls to select (if not clicking a button)
                        if (e.target === e.currentTarget || e.target.classList.contains('control-area')) {
                            onSelect(e)
                        }
                    }}
                >
                    <div className="control-area w-[250px] -ml-[250px] flex items-center justify-end gap-1 pr-2">
                        {/* Box Selection Checkbox (visible on hover or selected) */}
                        <div
                            className={`w-4 h-4 border rounded mr-1 cursor-pointer flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelect(e)
                            }}
                        >
                            {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>

                        {/* Tight spacing toggle */}
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleTightSpacing(); }}
                            className={`p-1.5 transition-colors rounded hover:bg-gray-100 flex items-center justify-center ${isTight ? 'text-blue-600' : 'text-gray-300 hover:text-gray-900'}`}
                            title={isTight ? "Remove tight spacing" : "Reduce spacing above"}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <line x1="2" y1="4" x2="14" y2="4" />
                                <line x1="2" y1="8" x2="14" y2="8" />
                                <path d="M8 5.5 L6 7.5 M8 5.5 L10 7.5" strokeLinecap="round" />
                            </svg>
                        </button>

                        <div
                            {...dragHandleProps}
                            className="p-1.5 text-gray-300 hover:text-gray-900 cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-gray-100 flex items-center justify-center drag-handle"
                            title="Drag to reorder"
                            onClick={(e) => {
                                // Optional: Allow click on drag handle to select too
                                if (!e.defaultPrevented) onSelect(e)
                            }}
                        >
                            <GripVertical size={16} />
                        </div>

                        <BlockTypeSwitcher
                            block={block}
                            onTransform={(type, variant) => handleTransformBlock(index, type, variant)}
                        />

                        {/* Copy button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleCopyBlock(index); }}
                            className="p-1.5 text-gray-300 hover:text-gray-900 transition-colors rounded hover:bg-gray-100 flex items-center justify-center"
                            title="Copy block JSON"
                        >
                            <Copy size={16} />
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); confirmDeleteBlock(index); }}
                            className="p-1.5 text-gray-300 hover:text-red-600 transition-colors rounded hover:bg-gray-100 flex items-center justify-center"
                            title="Delete block"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )}


            <div className="flex-1 min-w-0">
                <BlockComponent
                    content={content}
                    isAdmin={isAdmin}
                    onUpdate={(newData) => handleBlockUpdate(index, newData)}
                    onTransform={(type, variant) => handleTransformBlock(index, type, variant)}
                    onAddNext={(variant) => handleAddBlock(index + 1, {
                        id: crypto.randomUUID(),
                        type: 'text',
                        content: { text: '', variant: variant || 'paragraph' }
                    }, true)}
                    autoOpen={autoOpenMenuBlockId === block.id}
                    brand={brand}
                />
            </div>
        </div>
    )
}
