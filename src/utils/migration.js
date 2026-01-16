import { supabase } from '../lib/supabase'

export async function migrateBrandToDraft(brandId) {
    if (!brandId) return

    try {
        // 1. Fetch current relational data
        const { data: brand, error: brandError } = await supabase
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single()

        if (brandError) throw brandError

        const { data: pages, error: pagesError } = await supabase
            .from('pages')
            .select('*')
            .eq('brand_id', brandId)
            .order('order', { ascending: true })

        if (pagesError) throw pagesError

        // 2. Fetch blocks for all pages
        const pagesWithBlocks = await Promise.all(pages.map(async (page) => {
            const { data: blocks } = await supabase
                .from('blocks')
                .select('*')
                .eq('page_id', page.id)
                .order('order', { ascending: true })

            return {
                ...page,
                blocks: blocks || []
            }
        }))

        // 3. Construct Draft JSON
        const draftData = {
            tokens: {
                primaryColor: brand.primary_color || '#0066FF',
                fontFamily: brand.font_family || 'Geist',
                logoUrl: brand.logo_url
            },
            sections: pagesWithBlocks.map(page => ({
                id: page.id,
                slug: page.slug,
                title: page.title,
                blocks: page.blocks.map(block => ({
                    id: block.id,
                    type: block.type,
                    data: block.data
                }))
            }))
        }

        // 4. Update Brand with Draft Data
        const { error: updateError } = await supabase
            .from('brands')
            .update({
                draft: draftData,
                // Optional: set published to same if we want to seed it
                published: draftData
            })
            .eq('id', brandId)

        if (updateError) throw updateError

        console.log('Migration successful for brand:', brand.name)
        return draftData

    } catch (err) {
        console.error('Migration failed:', err)
        throw err
    }
}
