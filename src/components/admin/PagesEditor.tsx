'use client'

import { useState } from 'react'
import { useAdminContext } from '@/components/admin/AdminContext'
import { usePages } from '@/hooks/usePages'
import { useBlocks } from '@/hooks/useBlocks'
import {
    Plus,
    Trash2,
    ChevronRight,
    Loader2,
    Layout,
    Type,
    Palette,
    Type as Font,
    Download,
    Image as ImageIcon,
    CheckSquare,
    Star,
    PlusCircle,
    MoreVertical,
    ArrowUpRight,
    FileText,
    BookOpen,
    X,
} from 'lucide-react'
import BlockEditor from './BlockEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { decodeHTMLEntities } from '@/utils/decodeHtml'

const BLOCK_TYPES = [
    { type: 'hero', label: 'Hero Banner', icon: Layout, description: 'Visual header' },
    { type: 'text', label: 'Text Block', icon: Type, description: 'Narrative content' },
    { type: 'color-grid', label: 'Color Grid', icon: Palette, description: 'Brand swatches' },
    { type: 'typography-showcase', label: 'Typography', icon: Font, description: 'Font styles' },
    { type: 'asset-grid', label: 'Asset Grid', icon: Download, description: 'Download links' },
    { type: 'logo-showcase', label: 'Logo Showcase', icon: ImageIcon, description: 'Logo variants' },
    { type: 'do-dont', label: 'Do / Don\'t', icon: CheckSquare, description: 'Brand rules' },
    { type: 'value-grid', label: 'Value Grid', icon: Star, description: 'Core values' },
]

export default function PagesEditor() {
    const { currentBrand } = useAdminContext()

    const { pages, loading: pagesLoading, createPage, updatePage, deletePage } = usePages(currentBrand?.id)
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const { blocks, loading: blocksLoading, createBlock, updateBlock, deleteBlock } = useBlocks(selectedPageId)

    const [newPageTitle, setNewPageTitle] = useState('')
    const [newPageSlug, setNewPageSlug] = useState('')
    const [showNewPageForm, setShowNewPageForm] = useState(false)
    const [showBlockPicker, setShowBlockPicker] = useState(false)

    const selectedPage = pages.find(p => p.id === selectedPageId)

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPageTitle || !newPageSlug) return

        try {
            const page = await createPage({
                title: newPageTitle,
                slug: newPageSlug.toLowerCase().replace(/\s+/g, '-'),
                order: pages.length
            })
            setNewPageTitle('')
            setNewPageSlug('')
            setShowNewPageForm(false)
            if (page) setSelectedPageId(page.id)
        } catch (err) {
            console.error('Failed to create page:', err)
        }
    }

    const handleAddBlock = async (type: string) => {
        try {
            await createBlock({
                type,
                data: getDefaultBlockData(type)
            })
            setShowBlockPicker(false)
        } catch (err) {
            console.error('Failed to create block:', err)
        }
    }

    const handleDeletePage = async (pageId: string) => {
        if (!confirm('Delete this page and all its blocks?')) return
        try {
            await deletePage(pageId)
            if (selectedPageId === pageId) {
                setSelectedPageId(null)
            }
        } catch (err) {
            console.error('Failed to delete page:', err)
        }
    }

    if (pagesLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
        )
    }

    return (
        <div className="flex gap-10 -m-10 min-h-screen">
            {/* Pages Sidebar / Workspace Navigation */}
            <div className="w-72 bg-[#f9fafb] border-r border-gray-100 flex flex-col pt-10 pb-10">
                <div className="px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Pages</h2>
                        <Button variant="ghost" size="icon" onClick={() => setShowNewPageForm(true)} className="h-6 w-6">
                            <PlusCircle className="w-4 h-4 text-indigo-600" />
                        </Button>
                    </div>

                    <div className="space-y-1">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => setSelectedPageId(page.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all group",
                                    selectedPageId === page.id
                                        ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className={cn("w-4 h-4", selectedPageId === page.id ? "text-indigo-600" : "text-gray-400")} />
                                    <span className="truncate font-medium">{decodeHTMLEntities(page.title)}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePage(page.id)
                                        }}
                                        className="p-1 hover:text-red-600 rounded"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                    <ChevronRight size={14} className="text-gray-300" />
                                </div>
                            </button>
                        ))}

                        {showNewPageForm && (
                            <form onSubmit={handleCreatePage} className="mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3 animate-in fade-in zoom-in-95">
                                <Input
                                    value={newPageTitle}
                                    onChange={(e) => {
                                        setNewPageTitle(e.target.value)
                                        setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                                    }}
                                    placeholder="Page title"
                                    className="h-8 text-xs"
                                    autoFocus
                                />
                                <Input
                                    value={newPageSlug}
                                    onChange={(e) => setNewPageSlug(e.target.value)}
                                    placeholder="slug"
                                    className="h-8 text-xs font-mono"
                                />
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1 h-7 text-xs bg-indigo-600">Create</Button>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewPageForm(false)} className="h-7 text-xs">Cancel</Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Workspace Tip */}
                <div className="mt-auto px-6">
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                        <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-2">Editor Tip</h4>
                        <p className="text-[11px] text-indigo-700 leading-relaxed">
                            Drag pages to reorder them in your sidebar navigation.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 bg-white overflow-y-auto pt-10 pb-10">
                {selectedPage ? (
                    <div className="px-10 max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Editor Header */}
                        <div className="flex items-end justify-between border-b pb-8 border-gray-100">
                            <div className="space-y-1">
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 mb-2">Live Preview</Badge>
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{decodeHTMLEntities(selectedPage.title)}</h1>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <span>Slug:</span>
                                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">/{selectedPage.slug}</span>
                                    <a href={`/#/${selectedPage.slug}`} target="_blank" className="text-indigo-600 hover:underline flex items-center gap-1 ml-2">
                                        View <ArrowUpRight size={14} />
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => setShowBlockPicker(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                                    <Plus className="w-4 h-4" /> Add Block
                                </Button>
                            </div>
                        </div>

                        {/* Block List */}
                        <div className="space-y-6">
                            {blocksLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-gray-300" size={32} />
                                </div>
                            ) : (
                                <>
                                    {blocks.length === 0 ? (
                                        <div className="text-center py-24 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4 text-gray-400 group hover:border-indigo-200 hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => setShowBlockPicker(true)}>
                                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                            <p className="font-medium">Click to add your first block to this page</p>
                                        </div>
                                    ) : (
                                        blocks.map((block) => (
                                            <BlockEditor
                                                key={block.id}
                                                block={block}
                                                brand={currentBrand ?? undefined}
                                                onUpdate={(data) => updateBlock(block.id, { data })}
                                                onDelete={() => deleteBlock(block.id)}
                                            />
                                        ))
                                    )}

                                    {/* Add Block Overlay */}
                                    {showBlockPicker && (
                                        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-2xl font-bold text-gray-900">Add Content Block</h3>
                                                        <p className="text-gray-500 text-sm">Choose a block type to add to your page.</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => setShowBlockPicker(false)}>
                                                        <X size={20} />
                                                    </Button>
                                                </div>
                                                <div className="p-8 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                                                    {BLOCK_TYPES.map((bt) => (
                                                        <button
                                                            key={bt.type}
                                                            onClick={() => handleAddBlock(bt.type)}
                                                            className="group flex items-start gap-4 p-4 rounded-2xl border border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all text-left"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-indigo-100 shrink-0 transition-colors">
                                                                <bt.icon className="w-5 h-5 text-gray-500 group-hover:text-indigo-600" />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-900 text-sm group-hover:text-indigo-900">{bt.label}</div>
                                                                <div className="text-[11px] text-gray-500 mt-0.5">{bt.description}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center">
                            <BookOpen size={40} className="text-gray-200" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-gray-900 font-bold">Workspace</h3>
                            <p className="text-sm max-w-xs mt-2">Select a page from the sidebar to manage its content and visual blocks.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function getDefaultBlockData(type: string) {
    switch (type) {
        case 'hero':
            return { imageUrl: '', headline: 'Your Headline', subheadline: 'Add a supporting message', overlayColor: '#6366f1', overlayOpacity: 0.6 }
        case 'text':
            return { title: 'Section Title', body: 'Start typing your content here. You can use multiple paragraphs.' }
        case 'color-grid':
            return { title: 'Color Palette', colors: [{ name: 'Primary', hex: '#6366f1', usage: 'Main brand color' }] }
        case 'typography-showcase':
            return { fontFamily: 'Inter', specimens: [{ label: 'Heading 1', size: '32px', weight: '700', sample: 'Building the Future' }] }
        case 'asset-grid':
            return { assets: [] }
        case 'logo-showcase':
            return { logos: [] }
        case 'do-dont':
            return { title: 'Guidelines', items: [{ type: 'do', description: 'Center the logo' }, { type: 'dont', description: 'Stretch the logo' }] }
        case 'value-grid':
            return { values: [{ title: 'Innovative', description: 'We push boundaries.', icon: 'Zap' }] }
        default:
            return {}
    }
}
