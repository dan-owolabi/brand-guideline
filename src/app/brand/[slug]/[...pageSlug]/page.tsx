
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import BrandCanvas from '@/components/BrandCanvas'

interface PageProps {
    params: { slug: string; pageSlug: string[] }
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
    const brand = await getBrand(params.slug)
    if (!brand) return { title: 'Brand Not Found' }

    // We could try to find the specific section title here if we parsed the JSON content
    // but for now, generic title is safer/faster
    const sectionSlug = params.pageSlug[0]

    return {
        title: `${sectionSlug} - ${brand.name} Guidelines`,
        description: `Official brand guidelines for ${brand.name}`
    }
}

export default async function BrandSectionPage({ params }: PageProps) {
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
