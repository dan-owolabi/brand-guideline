import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to upload file to storage
export async function uploadFile(file, bucket = 'media') {
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
export async function deleteFile(url, bucket = 'media') {
    const fileName = url.split('/').pop()
    const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName])

    if (error) throw error
}

// Upload asset with metadata extraction
export async function uploadAsset(file, brandId, bucket = 'assets') {
    const fileUrl = await uploadFile(file, bucket)
    const isImage = file.type.startsWith('image/')

    const asset = {
        brand_id: brandId,
        name: file.name,
        file_url: fileUrl,
        thumbnail_url: isImage ? fileUrl : null,
        file_type: file.type,
        file_size: file.size,
        category: getFileCategory(file.name)
    }

    return asset
}

// Get file category from filename
function getFileCategory(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    const categories = {
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

// Fetch all assets for a brand
export async function getAssets(brandId) {
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
export async function saveAsset(asset) {
    const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single()

    if (error) throw error
    return data
}

// Delete asset from database and storage
export async function deleteAsset(assetId, fileUrl, bucket = 'assets') {
    // Delete from storage
    if (fileUrl) {
        try {
            await deleteFile(fileUrl, bucket)
        } catch (e) {
            console.log('Could not delete file from storage:', e.message)
        }
    }

    // Delete from database
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId)

    if (error) throw error
}
