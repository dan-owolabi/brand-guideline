'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Brand {
    id: string
    name: string
    slug: string
    logo_url: string | null
    primary_color: string | null
    font_family: string | null
    navigation: unknown[]
    published: unknown
    draft: unknown
    created_at: string
    updated_at: string
}

export function useBrand(id?: string) {
    const [brand, setBrand] = useState<Brand | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBrand = useCallback(async () => {
        try {
            setLoading(true)

            if (id) {
                const { data, error } = await supabase
                    .from('brands')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (error && error.code !== 'PGRST116') throw error
                setBrand(data as Brand | null)
            } else {
                const { data, error } = await supabase
                    .from('brands')
                    .select('*')
                    .limit(1)
                    .single()

                if (error && error.code !== 'PGRST116') throw error
                setBrand(data as Brand | null)
            }
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => {
        fetchBrand()
    }, [fetchBrand])

    const updateBrand = async (updates: Partial<Brand>) => {
        try {
            if (brand?.id) {
                const { data, error } = await supabase
                    .from('brands')
                    .update(updates)
                    .eq('id', brand.id)
                    .select()
                    .single()

                if (error) throw error
                setBrand(data as Brand)
                return data as Brand
            } else {
                const { data, error } = await supabase
                    .from('brands')
                    .insert([updates])
                    .select()
                    .single()

                if (error) throw error
                setBrand(data as Brand)
                return data as Brand
            }
        } catch (err) {
            setError((err as Error).message)
            throw err
        }
    }

    return { brand, loading, error, updateBrand, refetch: fetchBrand }
}

