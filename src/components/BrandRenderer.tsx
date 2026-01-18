'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import BlockRenderer from './BlockRenderer'
import { decodeHTMLEntities } from '../utils/decodeHtml'
import { Block } from '@/components/blocks/types'
import { cn } from '@/lib/utils'

interface BrandTokens {
    primaryColor?: string
    fontFamily?: string
    [key: string]: any
}

interface Section {
    id: string
    slug: string
    title: string
    blocks?: Block[]
}

interface BrandData {
    tokens?: BrandTokens
    sections?: Section[]
    [key: string]: any
}

interface BrandRendererProps {
    data: BrandData
    editable?: boolean
    onUpdate?: (newData: BrandData) => void
    activeSlug?: string | null
    brand?: any
}

/**
 * BrandRenderer - Unified renderer for both Public and Admin preview.
 */
export default function BrandRenderer({
    data,
    editable = false,
    onUpdate,
    activeSlug,
    brand
}: BrandRendererProps) {
    const tokens = data?.tokens || {}
    const sections = data?.sections || []
    const pathname = usePathname()

    // Find the active section based on slug
    // For admin preview, activeSlug is passed prop. For public, we derive from pathname eventually or assume parent handles it.
    const currentSlug = activeSlug || pathname?.split('/').pop() || sections[0]?.slug
    const activeSection = sections.find(s => s.slug === currentSlug) || sections[0]

    // Apply tokens as CSS variables
    useEffect(() => {
        if (tokens?.primaryColor) {
            document.documentElement.style.setProperty('--brand-primary', tokens.primaryColor)
        }
        if (tokens?.fontFamily) {
            document.documentElement.style.setProperty('--brand-font', `"${tokens.fontFamily}", sans-serif`)
        }
    }, [tokens])

    if (!data || !sections.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-gray-400">
                <p>No content yet. Add sections to get started.</p>
            </div>
        )
    }

    return (
        <div
            className="flex min-h-screen bg-white"
            style={{ fontFamily: tokens?.fontFamily ? `"${tokens.fontFamily}", sans-serif` : undefined }}
        >
            {/* Sidebar */}
            <aside className="fixed left-0 top-20 bottom-0 w-64 bg-white border-r border-gray-100 overflow-y-auto py-8">
                <nav className="px-6 space-y-10">
                    <div>
                        <h3 className="mb-4 text-xl font-bold text-gray-900 tracking-tight">
                            Sections
                        </h3>
                        <ul className="space-y-3">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    {editable ? (
                                        // In edit mode (admin), we might want to just handle click or navigation
                                        // If activeSlug is controlled by parent, we might expect parent to handle navigation,
                                        // but here we are rendering Links.
                                        // If this is purely a renderer, maybe we should use buttons or callbacks for admin?
                                        // But standard Link works if we are in a proper route structure.
                                        // For now, assume simple Link works or we just highlight based on prop.
                                        <div
                                            className={cn(
                                                "block text-[15px] transition-colors cursor-pointer",
                                                section.slug === currentSlug
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-500 hover:text-gray-900"
                                            )}
                                        // If we are in editable mode inside ContentEditor, clicking might need to trigger something else?
                                        // But typically this Renderer is just the "View".
                                        // In Admin ContentEditor, we might want to prevent actual navigation if we edit in place?
                                        // Ideally ContentEditor handles the layout and we just render the content logic?
                                        // But BrandRenderer includes the Sidebar...
                                        // If editable is true, we probably shouldn't use real Links if we want to stay in the editor context?
                                        // Let's use a dummy link for now or just text.
                                        >
                                            {decodeHTMLEntities(section.title)}
                                        </div>
                                    ) : (
                                        <Link
                                            href={`/${section.slug}`}
                                            className={cn(
                                                "block text-[15px] transition-colors",
                                                (section.slug === currentSlug) // Simple check
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-500 hover:text-gray-900"
                                            )}
                                        >
                                            {decodeHTMLEntities(section.title)}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 pt-8 pb-16 px-12">
                {activeSection ? (
                    <div className="max-w-4xl">
                        {/* Page Title */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-8">
                            {decodeHTMLEntities(activeSection.title)}
                        </h1>

                        {/* Blocks */}
                        <BlockRenderer
                            blocks={activeSection.blocks || []}
                            brand={{
                                ...brand,
                                primary_color: brand?.primary_color || brand?.primaryColor || tokens?.primaryColor,
                                primaryColor: brand?.primaryColor || brand?.primary_color || tokens?.primaryColor
                            }}
                        />
                    </div>
                ) : (
                    <p className="text-gray-400">Select a section from the sidebar.</p>
                )}
            </main>
        </div>
    )
}
