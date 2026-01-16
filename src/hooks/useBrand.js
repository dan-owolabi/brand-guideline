import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBrand(id) {
    const [brand, setBrand] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchBrand = async () => {
        try {
            setLoading(true)
            let query = supabase.from('brands').select('*')

            if (id) {
                query = query.eq('id', id).single()
            } else {
                query = query.limit(1).single()
            }

            const { data, error } = await query

            if (error && error.code !== 'PGRST116') throw error
            setBrand(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBrand()
    }, [id])

    const updateBrand = async (updates) => {
        try {
            if (brand?.id) {
                const { data, error } = await supabase
                    .from('brands')
                    .update(updates)
                    .eq('id', brand.id)
                    .select()
                    .single()

                if (error) throw error
                setBrand(data)
                return data
            } else {
                const { data, error } = await supabase
                    .from('brands')
                    .insert([updates])
                    .select()
                    .single()

                if (error) throw error
                setBrand(data)
                return data
            }
        } catch (err) {
            setError(err.message)
            throw err
        }
    }

    return { brand, loading, error, updateBrand, refetch: fetchBrand }
}
