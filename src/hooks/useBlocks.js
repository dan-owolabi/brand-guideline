import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBlocks(pageId) {
    const [blocks, setBlocks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchBlocks = async () => {
        if (!pageId) {
            setBlocks([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('blocks')
                .select('*')
                .eq('page_id', pageId)
                .order('order', { ascending: true })

            if (error) throw error
            setBlocks(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBlocks()
    }, [pageId])

    const createBlock = async (blockData) => {
        try {
            const order = blocks.length > 0 ? Math.max(...blocks.map(b => b.order)) + 1 : 0
            const { data, error } = await supabase
                .from('blocks')
                .insert([{ ...blockData, page_id: pageId, order }])
                .select()
                .single()

            if (error) throw error
            setBlocks(prev => [...prev, data])
            return data
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const updateBlock = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('blocks')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            setBlocks(prev => prev.map(b => b.id === id ? data : b))
            return data
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const deleteBlock = async (id) => {
        try {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('id', id)

            if (error) throw error
            setBlocks(prev => prev.filter(b => b.id !== id))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const reorderBlocks = async (reorderedBlocks) => {
        try {
            const updates = reorderedBlocks.map((block, index) => ({
                id: block.id,
                order: index
            }))

            for (const update of updates) {
                await supabase
                    .from('blocks')
                    .update({ order: update.order })
                    .eq('id', update.id)
            }

            setBlocks(reorderedBlocks.map((b, i) => ({ ...b, order: i })))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    return { blocks, loading, error, createBlock, updateBlock, deleteBlock, reorderBlocks, refetch: fetchBlocks }
}
