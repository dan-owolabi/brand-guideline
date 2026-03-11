import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getDefaultDraft } from '../data/defaultSections'

/**
 * useBrandEditor - Manages the draft JSON state for inline editing.
 * 
 * Returns:
 *   - draft: The current draft data ({ tokens, sections })
 *   - loading: boolean
 *   - saving: boolean
 *   - updateToken: (key, value) => void
 *   - updateSection: (sectionId, updates) => void
 *   - addSection: (section) => void
 *   - removeSection: (sectionId) => void
 *   - reorderSections: (newOrder) => void
 *   - updateBlock: (sectionId, blockIndex, newData) => void
 *   - addBlock: (sectionId, block) => void
 *   - removeBlock: (sectionId, blockIndex) => void
 *   - publish: (options) => Promise<void>
 *   - saveDraft: () => Promise<void>
 */
export function useBrandEditor(identifier) {
    // History state: { past: [], present: null, future: [] }
    const [history, setHistory] = useState({ past: [], present: null, future: [] })
    const draft = history.present // Derived draft for consumption

    const [brandMetadata, setBrandMetadata] = useState({ id: null, name: '', slug: '', logoUrl: '', primaryColor: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Track if update is from user action to trigger save
    const isUserAction = useRef(false)

    // Debounce timer ref
    const saveTimer = useRef(null)
    // Track fetched brand ID (for when identifier prop is null/slug)
    const fetchedBrandIdRef = useRef(null)

    // Get the effective brand ID
    const getEffectiveBrandId = useCallback(() => {
        // If identifier is UUID, use it. If slug, use fetchedBrandIdRef
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
        if (isUuid && identifier) return identifier
        return fetchedBrandIdRef.current
    }, [identifier])

    // Fetch initial draft data
    useEffect(() => {
        // Skip fetch if no identifier (public views get data from props)
        if (!identifier) {
            setLoading(false)
            return
        }

        const fetchDraft = async () => {
            setLoading(true)
            try {
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

                let query = supabase
                    .from('brands')
                    .select('id, draft, published, name, slug, logo_url, primary_color')

                if (isUuid) {
                    query = query.eq('id', identifier)
                } else {
                    query = query.eq('slug', identifier)
                }

                const { data, error } = await query.single()

                if (error) throw error

                // Store brandId for saves
                if (data?.id) {
                    fetchedBrandIdRef.current = data.id
                }

                // Check if a draft has any blocks with real visible content
                const hasContent = (d) =>
                    d?.sections?.some(s =>
                        s.blocks?.some(b => {
                            const c = b.content || b.data || {}
                            // Strip HTML tags to check for real text
                            const rawText = (c.text || '').replace(/<[^>]*>/g, '').trim()
                            if (rawText) return true
                            if (c.src || c.url || c.href) return true
                            if (Array.isArray(c.items) && c.items.some(i => typeof i === 'string' && i.trim())) return true
                            if (Array.isArray(c.rows) && c.rows.length > 0) return true
                            return false
                        })
                    ) ?? false

                // Published is usable as a restore source if it has actual content
                const publishedUsable = hasContent(data.published)

                // DEBUG: log diagnostic values inline (no object expansion needed)
                console.log('[useBrandEditor] draft.sections:', data.draft?.sections?.length ?? 'null',
                    '| draftHasContent:', hasContent(data.draft),
                    '| published.sections:', data.published?.sections?.length ?? 'null',
                    '| publishedUsable:', publishedUsable)
                console.log('[useBrandEditor] draftFirstBlock:', JSON.stringify(data.draft?.sections?.[0]?.blocks?.[0]))
                console.log('[useBrandEditor] publishedFirstBlock:', JSON.stringify(data.published?.sections?.[0]?.blocks?.[0]))

                const existingDraft = data.draft || data.published || { tokens: {}, sections: [] }
                let finalDraft = existingDraft

                if (!existingDraft.sections || existingDraft.sections.length === 0) {
                    // No sections at all — seed from published if available, else defaults
                    if (publishedUsable) {
                        finalDraft = data.published
                    } else {
                        const defaultDraft = getDefaultDraft()
                        finalDraft = defaultDraft
                    }
                    await supabase
                        .from('brands')
                        .update({ draft: finalDraft })
                        .eq('id', data.id)
                } else if (!hasContent(existingDraft) && publishedUsable) {
                    // Draft has sections but all blocks are empty — restore from published
                    finalDraft = data.published
                    await supabase
                        .from('brands')
                        .update({ draft: data.published })
                        .eq('id', data.id)
                }

                // Normalize: ensure all sections and blocks have IDs (required by @dnd-kit)
                finalDraft = {
                    ...finalDraft,
                    sections: (finalDraft.sections || []).map(section => ({
                        ...section,
                        id: section.id || crypto.randomUUID(),
                        blocks: (section.blocks || []).map(block => ({
                            ...block,
                            id: block.id || crypto.randomUUID()
                        }))
                    }))
                }

                // Initialize history
                setHistory({ past: [], present: finalDraft, future: [] })
                isUserAction.current = false // Don't trigger save on load

                setBrandMetadata({
                    id: data.id,
                    name: data.name,
                    slug: data.slug,
                    logoUrl: data.logo_url,
                    primaryColor: data.primary_color,
                    publishMode: data.published?.publishMode || 'both'
                })
            } catch (err) {
                console.error("Fetch draft error:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchDraft()
    }, [identifier])

    // Debounced save function
    const debouncedSave = useCallback((newDraft) => {
        const brandId = getEffectiveBrandId()
        if (!brandId) return

        if (saveTimer.current) {
            clearTimeout(saveTimer.current)
        }
        saveTimer.current = setTimeout(async () => {
            setSaving(true)
            try {
                await supabase
                    .from('brands')
                    .update({ draft: newDraft })
                    .eq('id', brandId)
            } catch (err) {
                console.error('Failed to save draft:', err)
            } finally {
                setSaving(false)
            }
        }, 1000) // 1 second debounce
    }, [getEffectiveBrandId])

    // Trigger save when draft changes via user action
    useEffect(() => {
        if (draft && isUserAction.current) {
            debouncedSave(draft)
            isUserAction.current = false
        }
    }, [draft, debouncedSave])

    // Update brand metadata (name, logo, color) - Direct update (no debounce for now)
    const updateBrandMetadata = useCallback(async (updates) => {
        const brandId = getEffectiveBrandId()
        if (!brandId) return

        // Optimistic update
        setBrandMetadata(prev => ({ ...prev, ...updates }))

        const dbUpdates = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl
        if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor

        try {
            await supabase
                .from('brands')
                .update(dbUpdates)
                .eq('id', brandId)
        } catch (err) {
            console.error('Failed to update brand metadata:', err)
        }
    }, [getEffectiveBrandId])

    // Update local draft and handle history
    const updateDraft = useCallback((updates) => {
        setHistory(curr => {
            const newDraft = typeof updates === 'function' ? updates(curr.present) : { ...curr.present, ...updates }

            // Limit history to 50 steps
            const newPast = [...curr.past, curr.present].slice(-50)

            isUserAction.current = true
            return {
                past: newPast,
                present: newDraft,
                future: [] // Clear future on new edit
            }
        })
    }, [])

    // Undo
    const undo = useCallback(() => {
        setHistory(curr => {
            if (curr.past.length === 0) return curr

            const previous = curr.past[curr.past.length - 1]
            const newPast = curr.past.slice(0, -1)

            isUserAction.current = true
            return {
                past: newPast,
                present: previous,
                future: [curr.present, ...curr.future]
            }
        })
    }, [])

    // Redo
    const redo = useCallback(() => {
        setHistory(curr => {
            if (curr.future.length === 0) return curr

            const next = curr.future[0]
            const newFuture = curr.future.slice(1)

            isUserAction.current = true
            return {
                past: [...curr.past, curr.present],
                present: next,
                future: newFuture
            }
        })
    }, [])

    // Token updates
    const updateToken = useCallback((key, value) => {
        updateDraft(prev => ({
            ...prev,
            tokens: { ...prev.tokens, [key]: value }
        }))
    }, [updateDraft])

    // Section management
    const updateSection = useCallback((sectionId, updates) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId ? { ...s, ...updates } : s
            )
        }))
    }, [updateDraft])

    const addSection = useCallback((section) => {
        const newSection = {
            id: crypto.randomUUID(),
            slug: section.slug || section.title.toLowerCase().replace(/\s+/g, '-'),
            title: section.title,
            group: section.group,
            blocks: section.blocks || []
        }
        updateDraft(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }))
    }, [updateDraft])

    const removeSection = useCallback((sectionId) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }))
    }, [updateDraft])

    const reorderSections = useCallback((newOrder) => {
        updateDraft(prev => ({
            ...prev,
            sections: newOrder
        }))
    }, [updateDraft])

    // Block management
    const updateBlock = useCallback((sectionId, blockIndex, newData) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const blocks = [...s.blocks]
                blocks[blockIndex] = { ...blocks[blockIndex], content: newData }
                return { ...s, blocks }
            })
        }))
    }, [updateDraft])

    const addBlock = useCallback((sectionId, block) => {
        const newBlock = {
            id: crypto.randomUUID(),
            type: block.type,
            content: block.content || block.data || {}
        }
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId
                    ? { ...s, blocks: [...s.blocks, newBlock] }
                    : s
            )
        }))
    }, [updateDraft])

    const removeBlock = useCallback((sectionId, blockIndex) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const blocks = s.blocks.filter((_, i) => i !== blockIndex)
                return { ...s, blocks }
            })
        }))
    }, [updateDraft])

    const reorderBlocks = useCallback((sectionId, startIndex, endIndex) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const blocks = [...s.blocks]
                const [removed] = blocks.splice(startIndex, 1)
                blocks.splice(endIndex, 0, removed)
                return { ...s, blocks }
            })
        }))
    }, [updateDraft])

    // Publish: Copy draft to published
    const publish = useCallback(async (options = {}) => {
        if (!draft) {
            console.error('Publish failed: No draft data')
            throw new Error('No draft data to publish')
        }

        const brandIdToUse = getEffectiveBrandId()
        if (!brandIdToUse) throw new Error("Could not resolve Brand ID")

        console.log('[Publish] Starting publish for brand:', brandIdToUse)
        console.log('[Publish] Options:', options)

        setSaving(true)
        try {
            const updates = {
                published: { ...draft, publishMode: options.mode || 'both' },
            }
            if (options.slug) {
                updates.slug = options.slug
            }

            const { data, error } = await supabase
                .from('brands')
                .update(updates)
                .eq('id', brandIdToUse)
                .select()

            if (error) {
                console.error('[Publish] Supabase error:', error)
                throw new Error(error.message || 'Failed to publish')
            }

            // Update metadata to reflect new publish state
            setBrandMetadata(prev => ({
                ...prev,
                ...(options.slug && { slug: options.slug }),
                publishMode: options.mode || 'both'
            }))

            console.log('[Publish] Success! Updated data:', data)
        } catch (err) {
            console.error('[Publish] Failed:', err)
            throw err
        } finally {
            setSaving(false)
        }
    }, [draft, getEffectiveBrandId])

    // Manual save (bypasses debounce)
    const saveDraft = useCallback(async () => {
        const brandId = getEffectiveBrandId()
        if (!draft || !brandId) return
        setSaving(true)
        try {
            await supabase
                .from('brands')
                .update({ draft })
                .eq('id', brandId)
        } catch (err) {
            console.error('Failed to save draft:', err)
            throw err
        } finally {
            setSaving(false)
        }
    }, [draft, getEffectiveBrandId])

    return {
        draft,
        loading,
        saving,
        error,
        updateToken,
        updateSection,
        addSection,
        removeSection,
        reorderSections,
        updateBlock,
        addBlock,
        removeBlock,
        reorderBlocks,
        publish,
        saveDraft,
        brandMetadata,
        updateBrandMetadata,
        undo,
        redo
    }
}
