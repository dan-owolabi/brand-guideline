import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Page {
    id: string
    brand_id: string
    title: string
    slug: string
    order: number
    created_at?: string
}

export function usePages(brandId: string | undefined) {
    const [pages, setPages] = useState<Page[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPages()
    }, [brandId])

    const createPage = async (pageData: Partial<Page>) => {
        try {
            const { data, error } = await supabase
                .from('pages')
                .insert([{ ...pageData, brand_id: brandId }])
                .select()
                .single()

            if (error) throw error
            setPages(prev => [...prev, data])
            return data
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const updatePage = async (id: string, updates: Partial<Page>) => {
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
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    const deletePage = async (id: string) => {
        try {
            const { error } = await supabase
                .from('pages')
                .delete()
                .eq('id', id)

            if (error) throw error
            setPages(prev => prev.filter(p => p.id !== id))
        } catch (err: any) {
            setError(err.message)
            throw err
        }
    }

    return { pages, loading, error, createPage, updatePage, deletePage, refetch: fetchPages }
}
