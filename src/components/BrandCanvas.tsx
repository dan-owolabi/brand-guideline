'use client'

import React, { useState, useEffect, useMemo, KeyboardEvent, MouseEvent } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useBrandEditor, BrandSection } from '@/hooks/useBrandEditor'
import { getBlockComponent } from './blocks'
import BlockWrapper from './editor/BlockWrapper'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/Dialog'
import { PublishModal } from '@/components/ui/PublishModal'
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
    DragEndEvent,
    DragStartEvent,
    DragOverlay
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'

import { getCanonicalUrl } from '@/lib/brandResolver'
import { Block } from '@/components/blocks/types'

interface BrandCanvasProps {
    isAdmin?: boolean
    brandData?: any // Public data passed from server or static props
    basePath?: string
}

/**
 * BrandCanvas - The unified renderer/editor for brand guidelines.
 * Same component serves both public (read-only) and admin (editable) views.
 */
export default function BrandCanvas({ isAdmin = false, brandData, basePath }: BrandCanvasProps) {
    const params = useParams()
    const router = useRouter()

    // Admin route: /admin/brand/[brandId]/[slug] or /admin/brand/[brandId]/pages
    // Public route: /brand/[slug]/[pageSlug]
    // params.slug is the brand slug (public) or page slug (admin)?
    // The routing is a bit different in Next.js.
    // Let's assume params are:
    // Admin: { id: string, slug?: string } (if using optional catch-all or specific route)
    // Public: { slug: string, pageSlug?: string[] }

    const brandIdParam = params?.id as string
    const slugParam = params?.slug as string | string[]

    // Determine activeSlug based on context
    // Admin: active slug is the last part of path usually, or handled by page routing.
    // If this component is mounted at /admin/brand/[id]/[slug], then slugParam is the page slug.
    // If mounted at /admin/brand/[id], activeSlug might be empty/default.

    // For simplicity, we rely on props or params to determine the active section slug.
    // In the new routing: `app/admin/brand/[id]/[slug]/page.tsx` would pass the slug.

    // Let's try to normalize valid slug from params
    const activeSlug = isAdmin
        ? (Array.isArray(slugParam) ? slugParam[0] : slugParam)
        : (params?.pageSlug ? (Array.isArray(params.pageSlug) ? params.pageSlug[0] : params.pageSlug) : (typeof slugParam === 'string' ? slugParam : ''))

    // Resolve brand ID for editor hook
    const editorBrandId = isAdmin ? brandIdParam : null

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
        reorderSections,
        brandMetadata: adminBrandMetadata,
        updateBrandMetadata,
        undo,
        redo
    } = useBrandEditor(editorBrandId)

    // For public view, use brandData directly; for admin, use hook metadata
    const brandMetadata = isAdmin ? adminBrandMetadata : {
        id: brandData?.brandId || brandData?.id,
        name: brandData?.name,
        logoUrl: brandData?.logoUrl || brandData?.logo_url,
        primaryColor: brandData?.primaryColor || brandData?.primary_color,
        slug: brandData?.slug
    }

    // SEO: Set Canonical URL for public views
    useEffect(() => {
        if (isAdmin || !brandMetadata?.slug) return

        const canonicalUrl = getCanonicalUrl(brandMetadata.slug)
        let link = document.querySelector("link[rel='canonical']")

        if (!link) {
            link = document.createElement('link')
            link.setAttribute('rel', 'canonical')
            document.head.appendChild(link)
        }

        link.setAttribute('href', canonicalUrl)
    }, [isAdmin, brandMetadata?.slug])

    // Undo/Redo keyboard shortcuts
    useEffect(() => {
        if (!isAdmin) return

        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            const activeElement = document.activeElement
            const isEditingText = activeElement?.closest('[contenteditable="true"]') ||
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA'

            if (!isEditingText && (e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault()
                if (e.shiftKey) {
                    redo()
                } else {
                    undo()
                }
            }
            if (!isEditingText && (e.metaKey || e.ctrlKey) && e.key === 'y') {
                e.preventDefault()
                redo()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isAdmin, undo, redo])

    const [publishModalOpen, setPublishModalOpen] = useState(false)
    const [publishSuccess, setPublishSuccess] = useState(false)
    const [isPublishing, setIsPublishing] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true) // Default true for desktop
    const [autoOpenMenuBlockId, setAutoOpenMenuBlockId] = useState<string | null>(null)
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)
    const [addBlockMenuPos, setAddBlockMenuPos] = useState<any>(null)

    // Multi-select state
    const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
    const [lastSelectedBlockId, setLastSelectedBlockId] = useState<string | null>(null)

    // Use draft for admin, brandData for public
    const data = isAdmin ? draft : brandData?.published
    const sections: BrandSection[] = data?.sections || []

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

    // Find current active section
    const activeSection = useMemo(() => {
        if (!activeSlug) return sections[0]
        return sections.find(s => s.slug === activeSlug) || sections[0]
    }, [activeSlug, sections])

    const activeSectionIndex = sections.findIndex(s => s.id === activeSection?.id)
    const prevSection = activeSectionIndex > 0 ? sections[activeSectionIndex - 1] : null
    const nextSection = activeSectionIndex < sections.length - 1 ? sections[activeSectionIndex + 1] : null

    // Extract H2/H3 for current section
    const subheadings = useMemo(() => {
        if (!activeSection?.blocks) return []
        return activeSection.blocks
            .filter(b => b.type === 'text' && (b.data?.variant === 'heading2' || (b.data as any)?.content?.variant === 'heading2')) // Adapt to data structure
            .map(b => ({
                id: b.id,
                text: b.data?.text || (b.data as any)?.content?.text,
                variant: b.data?.variant || (b.data as any)?.content?.variant
            }))
    }, [activeSection])

    // Helper for selection state - must be before useEffect
    const hasSelection = selectedBlockIds.size > 0

    // Handle click outside to clear selection - must be before early returns
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent<any> | globalThis.MouseEvent) => {
            if (!hasSelection) return
            const target = e.target as HTMLElement
            if (!target.closest('.block-content') && !target.closest('.control-area')) {
                setSelectedBlockIds(new Set())
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [hasSelection])

    if (loading && !data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" />
            </div>
        )
    }

    if (error && !data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md text-center">
                    <h3 className="font-bold mb-2">Error Loading Brand</h3>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id && activeSection) {
            const oldIndex = activeSection.blocks.findIndex((b) => b.id === active.id)
            const newIndex = activeSection.blocks.findIndex((b) => b.id === over.id)
            if (oldIndex !== -1 && newIndex !== -1) {
                reorderBlocks(activeSection.id, oldIndex, newIndex)
            }
        }
    }

    const handleSectionDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = sections.findIndex((s) => s.id === active.id)
            const newIndex = sections.findIndex((s) => s.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newSections = arrayMove(sections, oldIndex, newIndex)
                reorderSections(newSections)
            }
        }
    }

    const handleConfirmPublish = async (slug: string) => {
        setIsPublishing(true)
        try {
            await publish({ slug })
            setPublishSuccess(true)
            setPublishModalOpen(false)
            setTimeout(() => setPublishSuccess(false), 3000)
        } catch (err: any) {
            alert('Failed to publish: ' + err.message)
        } finally {
            setIsPublishing(false)
        }
    }

    const handleAddSection = () => {
        const title = "Untitled Section"
        const slug = `untitled-${Date.now()}`

        // Use the last group from existing sections, or default to first group
        // const existingGroups = [...new Set(sections.map(s => s.group).filter(Boolean))]
        // const lastGroup = existingGroups[existingGroups.length - 1] || existingGroups[0] || "General"

        addSection({
            title,
            slug,
            blocks: [
                {
                    id: crypto.randomUUID(),
                    type: 'text',
                    data: { text: '', variant: 'paragraph' }
                }
            ]
        })
        const brandId = brandData?.brandId || params?.id
        router.push(`/admin/brand/${brandId}/${slug}`)
    }

    // Determine active block IDs for SortableContext
    const blockIds = activeSection?.blocks?.map(b => b.id) || []

    const handleDeleteSection = () => {
        if (sectionToDelete && activeSection?.id === sectionToDelete) {
            // Navigate away if deleting active section
            const idx = sections.findIndex(s => s.id === sectionToDelete)
            const next = sections[idx - 1] || sections[idx + 1]
            if (next) {
                const newSlug = next.slug
                const brandId = params?.id
                router.push(`/admin/brand/${brandId}/${newSlug}`)
            }
        }
        if (sectionToDelete) removeSection(sectionToDelete)
        setSectionToDelete(null)
    }

    // Helper function for block selection toggle
    const toggleBlockSelection = (blockId: string, multi: boolean) => {
        const newSet = new Set(multi ? selectedBlockIds : [])
        if (newSet.has(blockId)) newSet.delete(blockId)
        else newSet.add(blockId)
        setSelectedBlockIds(newSet)
        setLastSelectedBlockId(blockId)
    }


    return (
        <div className="flex flex-col h-screen overflow-hidden bg-white text-gray-900 font-sans">
            <Header
                brand={brandMetadata}
                isAdmin={isAdmin}
                onPublish={() => setPublishModalOpen(true)}
                isPublishing={isPublishing}
                publishSuccess={publishSuccess}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onUpdateBrand={updateBrandMetadata}
                basePath={basePath}
            />

            <div className="flex flex-1 pt-16 md:pt-20 overflow-hidden relative">
                {/* Sidebar */}
                <div
                    className={`fixed md:relative top-16 md:top-0 bottom-0 z-40 w-64 bg-gray-50/80 border-r border-gray-200/50 backdrop-blur-xl transition-all duration-300 ease-in-out transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'} md:translate-x-0 ${!sidebarOpen && 'md:!w-0 md:!border-none md:overflow-hidden'}`}
                >
                    <div className="h-full flex flex-col pt-8 px-4 pb-4 w-64">

                        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleSectionDragEnd}
                                modifiers={[restrictToVerticalAxis]}
                            >
                                <SortableContext
                                    items={sections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                    disabled={!isAdmin}
                                >
                                    <ul className="space-y-1">
                                        {sections.map((section) => (
                                            <SidebarSectionItem
                                                key={section.id}
                                                section={section}
                                                isAdmin={isAdmin}
                                                activeSectionId={activeSection?.id}
                                                brandId={brandMetadata.id}
                                                brandSlug={brandMetadata.slug}
                                                setSectionToDelete={setSectionToDelete}
                                                subheadings={activeSection?.id === section.id ? subheadings : []}
                                                sectionsCount={sections.length}
                                                basePath={isAdmin ? `/admin/brand/${brandMetadata.id}` : basePath}
                                            />
                                        ))}
                                    </ul>
                                </SortableContext>
                            </DndContext>
                        </div>

                        {/* New Section Button - at bottom */}
                        {isAdmin && (
                            <button
                                onClick={handleAddSection}
                                className="mt-4 flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium w-full"
                            >
                                <Plus size={18} />
                                <span>New section</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto scroll-smooth bg-white relative w-full">
                    <div className="max-w-4xl mx-auto px-4 md:px-12 py-12 md:py-20 min-h-[calc(100vh-5rem)]">
                        {activeSection ? (
                            <div className="space-y-8 pb-32">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                    modifiers={[restrictToVerticalAxis]}
                                >
                                    <SortableContext
                                        items={blockIds}
                                        strategy={verticalListSortingStrategy}
                                        disabled={!isAdmin}
                                    >
                                        <div className="space-y-2">
                                            {activeSection.blocks?.map((block, index) => {
                                                const BlockComponent = getBlockComponent(block.type)
                                                return (
                                                    <React.Fragment key={block.id}>
                                                        <BlockWrapper
                                                            blockId={block.id}
                                                            isAdmin={isAdmin}
                                                        >
                                                            <DndBlockContent
                                                                isAdmin={isAdmin}
                                                                index={index}
                                                                block={block}
                                                                BlockComponent={BlockComponent}
                                                                confirmDeleteBlock={() => removeBlock(activeSection.id, index)}
                                                                handleCopyBlock={() => {/* Copy logic */ }}
                                                                handleBlockUpdate={(newData: any) => updateBlock(activeSection.id, index, newData)}
                                                                handleTransformBlock={() => {/* Transform logic */ }}
                                                                handleAddBlock={(newBlock: any) => addBlock(activeSection.id, newBlock)}
                                                                autoOpenMenuBlockId={autoOpenMenuBlockId}
                                                                isSelected={selectedBlockIds.has(block.id)}
                                                                onSelect={(e: any) => toggleBlockSelection(block.id, e.ctrlKey || e.metaKey)}
                                                                brand={brandMetadata}
                                                            />
                                                        </BlockWrapper>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {isAdmin && (
                                    <div className="pt-8 opacity-50 hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => addBlock(activeSection.id, { id: crypto.randomUUID(), type: 'text', data: { text: '', variant: 'paragraph' } })}
                                            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-sm font-medium mx-auto"
                                        >
                                            <Plus size={16} />
                                            <span>Add Block at End</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <p>Select a section to view content</p>
                            </div>
                        )}

                        {/* Footer Nav */}
                        <div className="flex justify-between mt-20 pt-8 border-t border-gray-100 pb-10">
                            {prevSection ? (
                                <Link
                                    href={isAdmin
                                        ? `/admin/brand/${brandMetadata.id}/${prevSection.slug}`
                                        : `${basePath || `/brand/${brandMetadata.slug}`}/${prevSection.slug}`
                                    }
                                    className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors">
                                        <ChevronLeft size={18} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Previous</div>
                                        <div className="font-medium">{prevSection.title}</div>
                                    </div>
                                </Link>
                            ) : <div></div>}

                            {nextSection ? (
                                <Link
                                    href={isAdmin
                                        ? `/admin/brand/${brandMetadata.id}/${nextSection.slug}`
                                        : `${basePath || `/brand/${brandMetadata.slug}`}/${nextSection.slug}`
                                    }
                                    className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors group text-right"
                                >
                                    <div className="text-right">
                                        <div className="text-xs text-gray-400 uppercase tracking-wide font-medium">Next</div>
                                        <div className="font-medium">{nextSection.title}</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors">
                                        <ChevronRight size={18} />
                                    </div>
                                </Link>
                            ) : <div></div>}
                        </div>
                    </div>
                </main>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
                <DialogContent
                    title="Delete Section?"
                    description="Are you sure you want to delete this section? This action cannot be undone."
                    onClose={() => setSectionToDelete(null)}
                >
                    <DialogFooter>
                        <button onClick={() => setSectionToDelete(null)} className="px-4 py-2 rounded text-gray-500 hover:bg-gray-100">Cancel</button>
                        <button onClick={handleDeleteSection} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PublishModal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={handleConfirmPublish}
                initialSlug={brandMetadata?.slug}
                brandName={brandMetadata?.name}
                isPublishing={isPublishing}
            />
        </div>
    )
}

// Sub-components

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
    isSelected,
    onSelect,
    brand
}: any) {
    const content = block.content || block.data || {}
    const isTight = content.tightSpacing === true

    return (
        <div className={`flex items-baseline gap-4 relative transition-all duration-200 ${isTight ? 'block-tight' : ''} ${isSelected ? 'bg-blue-50/50 -mx-4 px-4 rounded-lg ring-1 ring-blue-500/20' : ''}`}>
            {isAdmin && (
                <div className={`w-0 flex-none transition-opacity z-[70] ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <div className="control-area w-[250px] -ml-[250px] flex items-center justify-end gap-1 pr-2">
                        <div
                            className={`w-4 h-4 border rounded mr-1 cursor-pointer flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white hover:border-gray-400'}`}
                            onClick={(e) => {
                                e.stopPropagation()
                                onSelect(e)
                            }}
                        >
                            {isSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); confirmDeleteBlock(); }}
                            className="p-1.5 text-gray-300 hover:text-red-600 transition-colors rounded hover:bg-gray-100 flex items-center justify-center"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 min-w-0">
                <BlockComponent
                    content={content}
                    data={content}
                    isAdmin={isAdmin}
                    onUpdate={handleBlockUpdate}
                    brand={brand}
                />
            </div>
        </div>
    )
}


function SidebarSectionItem({ section, isAdmin, activeSectionId, brandId, brandSlug, setSectionToDelete, subheadings, sectionsCount, basePath }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: section.id,
        disabled: !isAdmin
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as any,
        zIndex: isDragging ? 999 : 'auto'
    }

    const isActive = activeSectionId === section.id

    // Construct link path
    // If Admin: /admin/brand/[id]/[slug]
    // If Public: [basePath]/[slug]

    let href = ''
    if (isAdmin) {
        href = `/admin/brand/${brandId}/${section.slug}`
    } else {
        const base = basePath || `/brand/${brandSlug}`
        href = `${base}/${section.slug}`
    }

    return (
        <li ref={setNodeRef} style={style} {...attributes}>
            <div className={`flex items-center justify-between group/item relative ${isActive ? '' : 'hover:bg-gray-50'} rounded-md`}>
                {isAdmin && (
                    <div {...listeners} className="absolute -left-5 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover/item:opacity-100 transition-opacity z-10">
                        <GripVertical size={12} />
                    </div>
                )}

                <Link
                    href={href}
                    className={`flex-1 py-1 px-2 rounded-md transition-all text-[13px] tracking-tight ${isActive ? 'font-medium text-gray-900 bg-gray-100' : 'font-normal text-gray-500'}`}
                >
                    {section.title || 'Untitled Section'}
                </Link>

                {isAdmin && sectionsCount > 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSectionToDelete(section.id);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>
            {isActive && subheadings.length > 0 && (
                <ul className="mt-1 ml-4 space-y-1">
                    {subheadings.map((sub: any) => (
                        <li key={sub.id}>
                            <a
                                href={`#${sub.id}`}
                                onClick={(e) => {
                                    e.preventDefault()
                                    document.getElementById(sub.id)?.scrollIntoView({ behavior: 'smooth' })
                                }}
                                className="block py-1 pl-4 text-[13px] font-light text-[#868585] transition-colors hover:text-[#1c1c1c]"
                            >
                                {sub.text || 'Untitled'}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    )
}
