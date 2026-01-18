/**
 * Image Compression Utilities
 * 
 * Compresses images client-side before upload using Canvas API.
 * This reduces file sizes by 60-80% without requiring external APIs.
 * Converts images to WebP for modern optimization.
 */

export interface HelperOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
}

/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param options - Compression options
 */
export async function compressImage(file: File, options: HelperOptions = {}): Promise<File> {
    const {
        maxWidth = 1920,
        maxHeight = 1920,
        quality = 0.8
    } = options

    // Skip compression for small files (under 100KB) or non-images
    if (file.size < 100 * 1024 || !file.type.startsWith('image/')) {
        return file
    }

    // Skip SVGs - they're already optimized vector format
    if (file.type === 'image/svg+xml') {
        return file
    }

    return new Promise((resolve) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            resolve(file)
            return
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img

            if (width > maxWidth) {
                height = (height * maxWidth) / width
                width = maxWidth
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height
                height = maxHeight
            }

            canvas.width = width
            canvas.height = height

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file) // Fallback to original
                        return
                    }

                    // Create new file with original name but .webp extension
                    const newName = file.name.replace(/\.\w+$/, '.webp')

                    const compressedFile = new File(
                        [blob],
                        newName,
                        { type: 'image/webp' }
                    )

                    // Only use compressed if actually smaller
                    if (compressedFile.size < file.size) {
                        console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`)
                        resolve(compressedFile)
                    } else {
                        resolve(file)
                    }
                },
                'image/webp',
                quality
            )

            // Cleanup
            URL.revokeObjectURL(img.src)
        }

        img.onerror = () => {
            resolve(file) // Fallback to original on error
        }

        img.src = URL.createObjectURL(file)
    })
}

/**
 * Compress multiple files
 */
export async function compressImages(files: File[]): Promise<File[]> {
    return Promise.all(files.map(file => compressImage(file)))
}
