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
 *   - publish: () => Promise<void>
 *   - saveDraft: () => Promise<void>
 */
export function useBrandEditor(brandId) {
    // History state: { past: [], present: null, future: [] }
    const [history, setHistory] = useState({ past: [], present: null, future: [] })
    const draft = history.present // Derived draft for consumption

    const [brandMetadata, setBrandMetadata] = useState({ id: null, name: '', logoUrl: '', primaryColor: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)

    // Track if update is from user action to trigger save
    const isUserAction = useRef(false)

    // Debounce timer ref
    const saveTimer = useRef(null)
    // Track fetched brand ID (for when brandId prop not passed)
    const fetchedBrandIdRef = useRef(brandId)

    // Get the effective brand ID
    const getEffectiveBrandId = () => brandId || fetchedBrandIdRef.current

    // Fetch initial draft data
    useEffect(() => {
        const fetchDraft = async () => {
            setLoading(true)
            try {
                let query = supabase
                    .from('brands')
                    .select('id, draft, published, name, logo_url, primary_color')

                if (brandId) {
                    query = query.eq('id', brandId)
                } else {
                    query = query.limit(1)
                }

                const { data, error } = await query.single()

                if (error) throw error

                // Store brandId for saves
                if (data?.id) {
                    fetchedBrandIdRef.current = data.id
                }

                // If no sections exist, seed with defaults
                const existingDraft = data.draft || data.published || { tokens: {}, sections: [] }
                let finalDraft = existingDraft

                if (!existingDraft.sections || existingDraft.sections.length === 0) {
                    const defaultDraft = getDefaultDraft()
                    finalDraft = defaultDraft
                    // Save defaults to database
                    await supabase
                        .from('brands')
                        .update({ draft: defaultDraft })
                        .eq('id', data.id)
                }

                // Initialize history
                setHistory({ past: [], present: finalDraft, future: [] })
                isUserAction.current = false // Don't trigger save on load

                setBrandMetadata({
                    id: data.id,
                    name: data.name,
                    logoUrl: data.logo_url,
                    primaryColor: data.primary_color
                })
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchDraft()
    }, [brandId])

    // Debounced save function
    const debouncedSave = useCallback((newDraft) => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current)
        }
        saveTimer.current = setTimeout(async () => {
            setSaving(true)
            try {
                await supabase
                    .from('brands')
                    .update({ draft: newDraft })
                    .eq('id', getEffectiveBrandId())
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
        // Optimistic update
        setBrandMetadata(prev => ({ ...prev, ...updates }))

        const dbUpdates = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl
        if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor

        try {
            await supabase
                .from('brands')
                .update(dbUpdates)
                .eq('id', getEffectiveBrandId())
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
    const publish = useCallback(async () => {
        if (!draft) {
            console.error('Publish failed: No draft data')
            throw new Error('No draft data to publish')
        }

        const brandIdToUse = getEffectiveBrandId()
        console.log('[Publish] Starting publish for brand:', brandIdToUse)
        console.log('[Publish] Draft data:', draft)

        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('brands')
                .update({
                    published: draft,
                })
                .eq('id', brandIdToUse)
                .select()

            if (error) {
                console.error('[Publish] Supabase error:', error)
                throw new Error(error.message || 'Failed to publish')
            }

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
        if (!draft) return
        setSaving(true)
        try {
            await supabase
                .from('brands')
                .update({ draft })
                .eq('id', getEffectiveBrandId())
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
