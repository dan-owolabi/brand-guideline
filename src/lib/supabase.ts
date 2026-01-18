import { createClient } from '@supabase/supabase-js'

// Fallback to placeholder values for build time to avoid "supabaseUrl is required" error
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get file category from filename
function getFileCategory(filename: string | null | undefined): string {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    const categories: Record<string, string[]> = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'],
        document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'],
        archive: ['zip', 'rar', '7z', 'tar', 'gz'],
        design: ['ai', 'psd', 'fig', 'sketch', 'xd', 'eps'],
        font: ['ttf', 'otf', 'woff', 'woff2', 'eot']
    }

    for (const [category, extensions] of Object.entries(categories)) {
        if (extensions.includes(ext)) return category
    }
    return 'other'
}

// Helper to upload file to storage
export async function uploadFile(file: File, bucket = 'media'): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

    return publicUrl
}

// Helper to delete file from storage
export async function deleteFile(url: string, bucket = 'media'): Promise<void> {
    const fileName = url.split('/').pop()
    if (!fileName) throw new Error('Invalid URL')

    const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName])

    if (error) throw error
}

// Asset type
export interface Asset {
    id?: string
    brand_id: string
    name: string
    file_url: string
    thumbnail_url: string | null
    file_type: string
    file_size: number
    category: string
    created_at?: string
}

// Upload asset with metadata extraction
export async function uploadAsset(file: File, brandId: string, bucket = 'assets'): Promise<Omit<Asset, 'id' | 'created_at'>> {
    const fileUrl = await uploadFile(file, bucket)
    const isImage = file.type.startsWith('image/')

    return {
        brand_id: brandId,
        name: file.name,
        file_url: fileUrl,
        thumbnail_url: isImage ? fileUrl : null,
        file_type: file.type,
        file_size: file.size,
        category: getFileCategory(file.name)
    }
}

// Fetch all assets for a brand
export async function getAssets(brandId: string): Promise<Asset[]> {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false })

    if (error) {
        console.log('Assets table may not exist:', error.message)
        return []
    }

    return data || []
}

// Save asset to database
export async function saveAsset(asset: Omit<Asset, 'id' | 'created_at'>): Promise<Asset> {
    const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete asset from database and storage
export async function deleteAsset(assetId: string, fileUrl: string | null, bucket = 'assets'): Promise<void> {
    // Delete from storage
    if (fileUrl) {
        try {
            await deleteFile(fileUrl, bucket)
        } catch (e) {
            console.log('Could not delete file from storage:', (e as Error).message)
        }
    }

    // Delete from database
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)

    if (error) throw error
}
