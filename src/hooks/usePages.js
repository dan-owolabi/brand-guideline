import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePages(brandId) {
    const [pages, setPages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchPages = async () => {
        if (!brandId) {
            setPages([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('pages')
                .select('*')
                .eq('brand_id', brandId)
                .order('order', { ascending: true })

            if (error) throw error
            setPages(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPages()
    }, [brandId])

    const createPage = async (pageData) => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .insert([{ ...pageData, brand_id: brandId }])
                .select()
                .single()

            if (error) throw error
            setPages(prev => [...prev, data])
            return data
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const updatePage = async (id, updates) => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .update(updates)
                .eq('id', id)
                .select()
                .single()

            if (error) throw error
            setPages(prev => prev.map(p => p.id === id ? data : p))
            return data
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    const deletePage = async (id) => {
        try {
            const { error } = await supabase
                .from('pages')
                .delete()
                .eq('id', id)

            if (error) throw error
            setPages(prev => prev.filter(p => p.id !== id))
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    return { pages, loading, error, createPage, updatePage, deletePage, refetch: fetchPages }
}
