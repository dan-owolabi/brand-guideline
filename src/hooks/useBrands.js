import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useBrands() {
    const [brands, setBrands] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchBrands()
    }, [])

    const fetchBrands = async () => {
        try {
            const { data, error } = await supabase
                .from('brands')
                .select('*')
                .order('name', { ascending: true })

            if (error) throw error
            setBrands(data || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const createBrand = async (name) => {
        try {
            const { data, error } = await supabase
                .from('brands')
                .insert([{
                    name,
                    primary_color: '#6366F1',
                    navigation: []
                }])
                .select()
                .single()

            if (error) throw error
            setBrands(prev => [...prev, data])
            return data
        } catch (err) {
            throw err
        }
    }

    return { brands, loading, error, createBrand, fetchBrands }
}
