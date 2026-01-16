import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import BlockRenderer from './BlockRenderer'
import { decodeHTMLEntities } from '../utils/decodeHtml'

/**
 * BrandRenderer - Unified renderer for both Public and Admin preview.
 * 
 * Props:
 *   - data: { tokens, sections } - The brand document (draft or published)
 *   - editable: boolean - If true, renders inline editing affordances
 *   - onUpdate: (newData) => void - Called when data changes in editable mode
 *   - activeSlug: string - Which section/page slug is currently active
 */
export default function BrandRenderer({
    data,
    editable = false,
    onUpdate,
    activeSlug,
    brand
}) {
    const { tokens, sections } = data || { tokens: {}, sections: [] }

    // Find the active section based on slug
    const activeSection = sections.find(s => s.slug === activeSlug) || sections[0]

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
                    {/* Group sections by any potential grouping logic, or just list them */}
                    <div>
                        <h3 className="mb-4 text-xl font-bold text-gray-900 tracking-tight">
                            Sections
                        </h3>
                        <ul className="space-y-3">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <NavLink
                                        to={`/${section.slug}`}
                                        className={({ isActive }) => `
                                            block text-[15px] transition-colors
                                            ${isActive || section.slug === activeSlug
                                                ? 'text-gray-900 font-medium'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        {decodeHTMLEntities(section.title)}
                                    </NavLink>
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
                            brand={brand || { primaryColor: tokens?.primaryColor }}
                            editable={editable}
                            onBlockUpdate={(blockIndex, newData) => {
                                if (!editable || !onUpdate) return
                                // Create updated sections
                                const updatedSections = sections.map((s, i) => {
                                    if (s.id !== activeSection.id) return s
                                    const updatedBlocks = s.blocks.map((b, bi) =>
                                        bi === blockIndex ? { ...b, data: newData } : b
                                    )
                                    return { ...s, blocks: updatedBlocks }
                                })
                                onUpdate({ ...data, sections: updatedSections })
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
