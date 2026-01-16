/**
 * Image Compression Utilities
 * 
 * Compresses images client-side before upload using Canvas API.
 * This reduces file sizes by 60-80% without requiring external APIs.
 */

/**
 * Compress an image file before upload
 * @param {File} file - The image file to compress
 * @param {object} options - Compression options
 * @param {number} options.maxWidth - Max width (default: 1920)
 * @param {number} options.maxHeight - Max height (default: 1920)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} Compressed file
 */
export async function compressImage(file, options = {}) {
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

    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

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

                    // Create new file with original name
                    const compressedFile = new File(
                        [blob],
                        file.name.replace(/\.\w+$/, '.jpg'), // Convert to jpg
                        { type: 'image/jpeg' }
                    )

                    // Only use compressed if actually smaller
                    if (compressedFile.size < file.size) {
                        console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`)
                        resolve(compressedFile)
                    } else {
                        resolve(file)
                    }
                },
                'image/jpeg',
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
export async function compressImages(files) {
    return Promise.all(files.map(file => compressImage(file)))
}
