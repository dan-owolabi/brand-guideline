import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Brand {
    id: string
    name: string
    slug: string
    logo_url?: string
    banner_url?: string
    primary_color?: string
    font_family?: string
    navigation?: any[]
    draft?: any
    published?: any
    created_at?: string
    updated_at?: string
}

export function useBrands() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBrands = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setBrands(data || [])
        } catch (err: any) {
            console.error('Error fetching brands:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBrands()
    }, [fetchBrands])

    const createBrand = async (name: string) => {
        try {
            // Generate a simple slug from name (though typically slug might be distinct)
            // The original code didn't set slug, so maybe database handles it or it's nullable initially?
            // But typically we should probably set it. 
            // The original used: name, primary_color, navigation.

            const { data, error } = await supabase
                .from('brands')
                .insert([{
                    name,
                    primary_color: '#6366F1',
                    navigation: [],
                    // slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') // Optional if DB generates it
                }])
                .select()
                .single()

            if (error) throw error

            setBrands(prev => [...prev, data])
            return data
        } catch (err: any) {
            console.error('Error creating brand:', err)
            throw err
        }
    }

    return { brands, loading, error, fetchBrands, createBrand }
}
