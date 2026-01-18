
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BrandCanvas from '@/components/BrandCanvas'

interface PageProps {
    params: { slug: string }
}

async function getBrand(slug: string) {
    const { data: brand, error } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !brand) return null
    return brand
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    try {
        const brand = await getBrand(params.slug)
        if (!brand) return { title: 'Brand Not Found' }

        return {
            title: `${brand.name} - Brand Guidelines`,
            description: `Official brand guidelines for ${brand.name}`,
            icons: {
                icon: brand.logo_url || '/favicon.ico'
            }
        }
    } catch (e) {
        return {
            title: 'Brand Guidelines'
        }
    }
}

export default async function BrandIntroductionPage({ params }: PageProps) {
    const brand = await getBrand(params.slug)

    if (!brand) {
        notFound()
    }

    return (
        <BrandCanvas
            isAdmin={false}
            brandData={brand}
            basePath={`/brand/${params.slug}`}
        />
    )
}
