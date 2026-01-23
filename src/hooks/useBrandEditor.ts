import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Types
import { Block } from '@/components/blocks/types'

export interface BrandSection {
    id: string
    slug: string
    title: string
    group?: string
    blocks: Block[]
}

export interface BrandTokens {
    primaryColor?: string
    fontFamily?: string
    customFontUrl?: string
    [key: string]: any
}

export interface BrandDraft {
    tokens: BrandTokens
    sections: BrandSection[]
}

export interface BrandMetadata {
    id: string | null
    name: string
    slug: string
    logoUrl: string
    primaryColor: string
}

interface UseBrandEditorResult {
    draft: BrandDraft | null
    loading: boolean
    saving: boolean
    error: string | null
    updateToken: (key: string, value: any) => void
    updateSection: (sectionId: string, updates: Partial<BrandSection>) => void
    addSection: (section: Partial<BrandSection>) => void
    removeSection: (sectionId: string) => void
    reorderSections: (newOrder: BrandSection[]) => void
    updateBlock: (sectionId: string, blockIndex: number, newData: any) => void
    addBlock: (sectionId: string, block: Partial<Block>) => void
    removeBlock: (sectionId: string, blockIndex: number) => void
    reorderBlocks: (sectionId: string, startIndex: number, endIndex: number) => void
    publish: (options?: { slug?: string }) => Promise<void>
    saveDraft: () => Promise<void>
    brandMetadata: BrandMetadata
    updateBrandMetadata: (updates: Partial<BrandMetadata>) => Promise<void>
    undo: () => void
    redo: () => void
}

const getDefaultDraft = () => ({
    tokens: {},
    sections: []
})


// Simple in-memory cache
const globalCache = new Map<string, { data: any, timestamp: number }>()

/**
 * useBrandEditor - Manages the draft JSON state for inline editing.
 */
export function useBrandEditor(identifier: string | null | undefined): UseBrandEditorResult {
    // History state
    const [history, setHistory] = useState<{ past: BrandDraft[], present: BrandDraft | null, future: BrandDraft[] }>({
        past: [],
        present: null,
        future: []
    })
    const draft = history.present

    const [brandMetadata, setBrandMetadata] = useState<BrandMetadata>({ id: null, name: '', slug: '', logoUrl: '', primaryColor: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Track if update is from user action to trigger save
    const isUserAction = useRef(false)

    // Debounce timer ref
    const saveTimer = useRef<NodeJS.Timeout | null>(null)
    // Track fetched brand ID
    const fetchedBrandIdRef = useRef<string | null>(null)

    // Get the effective brand ID
    const getEffectiveBrandId = useCallback(() => {
        if (!identifier) return fetchedBrandIdRef.current
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
        if (isUuid) return identifier
        return fetchedBrandIdRef.current
    }, [identifier])

    // Update state helper
    const updateStateFromData = useCallback((data: any) => {
        if (!data) return

        if (data.id) {
            fetchedBrandIdRef.current = data.id
        }

        const existingDraft = data.draft || data.published || { tokens: {}, sections: [] }
        let finalDraft = existingDraft

        if (!existingDraft.sections || existingDraft.sections.length === 0) {
            finalDraft = getDefaultDraft()
        }

        setHistory(prev => {
            // Only update if different to avoid reset? Actually we want to reset if we fetched new data.
            // But we might want to preserve history? For now, simple reset to fresh data is safer for sync.
            // Unless it's identical?
            if (JSON.stringify(prev.present) === JSON.stringify(finalDraft)) return prev
            return { past: [], present: finalDraft, future: [] }
        })
        isUserAction.current = false

        setBrandMetadata({
            id: data.id,
            name: data.name,
            slug: data.slug,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color
        })

        // Update cache
        if (identifier) {
            globalCache.set(identifier, { data, timestamp: Date.now() })
            if (data.slug) globalCache.set(data.slug, { data, timestamp: Date.now() })
            if (data.id) globalCache.set(data.id, { data, timestamp: Date.now() })
        }
    }, [identifier])

    // Fetch initial draft data
    useEffect(() => {
        if (!identifier) {
            setLoading(false)
            return
        }

        const fetchDraft = async () => {
            // Check cache first
            const cached = globalCache.get(identifier)
            if (cached) {
                updateStateFromData(cached.data)
                setLoading(false)
                // We could continue to fetch in background to revalidate, but for now strict cache is faster.
                // Or maybe we SHOULD revalidate?
                // Let's revalidate silently.
            } else {
                setLoading(true)
            }

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

                // If we didn't have cache, or if data changed, update.
                // For simplicity, always update just in case (useEffect handles simple equality check or we can do it here)
                updateStateFromData(data)

                // If it was a default seed that needed saving (logic was in original code), we should do it.
                // Original code: if (!existingDraft.sections...) update db.
                const existingDraft = data.draft || data.published
                if (!existingDraft || !existingDraft.sections || existingDraft.sections.length === 0) {
                    // We need to save the default draft we just created in updateStateFromData?
                    // Actually updateStateFromData creates finalDraft but doesn't return it.
                    // Let's rely on the user traversing or making edits to save, OR restore that logic differently.
                    // The original logic did an immediate update. That's risky if we are just viewing.
                    // I'll leave the auto-seed-save out for now or assume it's rare.
                }

            } catch (err: any) {
                console.error("Fetch draft error:", err)
                if (!cached) setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchDraft()
    }, [identifier, updateStateFromData])

    // Debounced save function
    const debouncedSave = useCallback((newDraft: BrandDraft) => {
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

                // Update cache logic implicitly handled if we refetch? 
                // Better to update cache with optimistic data?
                // For now, let's just save.
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

    // Update brand metadata
    const updateBrandMetadata = useCallback(async (updates: Partial<BrandMetadata>) => {
        const brandId = getEffectiveBrandId()
        if (!brandId) return

        setBrandMetadata(prev => ({ ...prev, ...updates }))

        const dbUpdates: any = {}
        if (updates.name !== undefined) dbUpdates.name = updates.name
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl
        if (updates.primaryColor !== undefined) dbUpdates.primary_color = updates.primaryColor

        try {
            await supabase
                .from('brands')
                .update(dbUpdates)
                .eq('id', brandId)

            // Invalidate/Update cache?
            // Simple: Since we mutated, subsequent fetches will get new data.
        } catch (err) {
            console.error('Failed to update brand metadata:', err)
        }
    }, [getEffectiveBrandId])

    // Update local draft
    const updateDraft = useCallback((updates: BrandDraft | ((prev: BrandDraft) => BrandDraft)) => {
        setHistory(curr => {
            if (!curr.present) return curr

            const newDraft = typeof updates === 'function' ? updates(curr.present) : { ...curr.present, ...updates }
            const newPast = [...curr.past, curr.present].slice(-50)
            isUserAction.current = true
            return {
                past: newPast,
                present: newDraft,
                future: []
            }
        })
    }, [])

    const undo = useCallback(() => {
        setHistory(curr => {
            if (curr.past.length === 0 || !curr.present) return curr
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

    const redo = useCallback(() => {
        setHistory(curr => {
            if (curr.future.length === 0 || !curr.present) return curr
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

    const updateToken = useCallback((key: string, value: any) => {
        updateDraft(prev => ({
            ...prev,
            tokens: { ...prev.tokens, [key]: value }
        }))
    }, [updateDraft])

    const updateSection = useCallback((sectionId: string, updates: Partial<BrandSection>) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s)
        }))
    }, [updateDraft])

    const addSection = useCallback((section: Partial<BrandSection>) => {
        const newSection: BrandSection = {
            id: crypto.randomUUID(),
            slug: section.slug || (section.title ? section.title.toLowerCase().replace(/\s+/g, '-') : 'new-section'),
            title: section.title || 'New Section',
            blocks: section.blocks || []
        }
        updateDraft(prev => ({
            ...prev,
            sections: [...prev.sections, newSection]
        }))
    }, [updateDraft])

    const removeSection = useCallback((sectionId: string) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }))
    }, [updateDraft])

    const reorderSections = useCallback((newOrder: BrandSection[]) => {
        updateDraft(prev => ({ ...prev, sections: newOrder }))
    }, [updateDraft])

    const updateBlock = useCallback((sectionId: string, blockIndex: number, newData: any) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const blocks = [...s.blocks]
                blocks[blockIndex] = { ...blocks[blockIndex], data: newData } // Changed content to data to match block interface
                return { ...s, blocks }
            })
        }))
    }, [updateDraft])

    const addBlock = useCallback((sectionId: string, block: Partial<Block>) => {
        const newBlock: Block = {
            id: crypto.randomUUID(),
            type: block.type || 'text',
            data: block.data || block.content || {}
        }
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s =>
                s.id === sectionId ? { ...s, blocks: [...s.blocks, newBlock] } : s
            )
        }))
    }, [updateDraft])

    const removeBlock = useCallback((sectionId: string, blockIndex: number) => {
        updateDraft(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id !== sectionId) return s
                const blocks = s.blocks.filter((_, i) => i !== blockIndex)
                return { ...s, blocks }
            })
        }))
    }, [updateDraft])

    const reorderBlocks = useCallback((sectionId: string, startIndex: number, endIndex: number) => {
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

    const publish = useCallback(async (options: { slug?: string } = {}) => {
        if (!draft) throw new Error('No draft data to publish')
        const brandIdToUse = getEffectiveBrandId()
        if (!brandIdToUse) throw new Error("Could not resolve Brand ID")

        setSaving(true)
        try {
            const updates: any = { published: draft }
            if (options.slug) updates.slug = options.slug

            const { data, error } = await supabase
                .from('brands')
                .update(updates)
                .eq('id', brandIdToUse)
                .select()

            if (error) throw new Error(error.message)
            if (options.slug) setBrandMetadata(prev => ({ ...prev, slug: options.slug! }))
            console.log('[Publish] Success!', data)
        } catch (err) {
            console.error('[Publish] Failed:', err)
            throw err
        } finally {
            setSaving(false)
        }
    }, [draft, getEffectiveBrandId])

    const saveDraft = useCallback(async () => {
        const brandId = getEffectiveBrandId()
        if (!draft || !brandId) return
        setSaving(true)
        try {
            await supabase.from('brands').update({ draft }).eq('id', brandId)
        } catch (err) {
            console.error('Failed to save draft:', err)
            throw err
        } finally {
            setSaving(false)
        }
    }, [draft, getEffectiveBrandId])

    return {
        draft, loading, saving, error, updateToken, updateSection, addSection, removeSection,
        reorderSections, updateBlock, addBlock, removeBlock, reorderBlocks, publish, saveDraft,
        brandMetadata, updateBrandMetadata, undo, redo
    }
}
