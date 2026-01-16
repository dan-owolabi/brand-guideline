import { useState, useRef } from 'react'
import { ImagePlus, X, Plus, Grid2x2, Grid3x3, Square, RectangleHorizontal, RectangleVertical, Maximize2 } from 'lucide-react'
import { uploadFile } from '../../lib/supabase'
import { ImagePresets } from '../../lib/imageOptimizer'

const GRID_LAYOUTS = {
    1: 'grid-cols-1',
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2",
    5: "grid-cols-2 md:grid-cols-3",
    6: "grid-cols-2 md:grid-cols-3",
    7: "grid-cols-2 md:grid-cols-4",
    8: "grid-cols-2 md:grid-cols-4"
}

const ASPECT_RATIOS = {
    auto: '',                    // No fixed aspect - shows full image
    square: 'aspect-square',
    landscape: 'aspect-video',   // 16:9
    portrait: 'aspect-[9/16]'    // 9:16
}

export default function ImageGridBlock({
    content,
    isAdmin = false,
    onUpdate
}) {
    const [uploading, setUploading] = useState(false)
    const [replacingIndex, setReplacingIndex] = useState(null)
    const fileInputRef = useRef(null)
    const replaceInputRef = useRef(null)

    const images = content?.images || []
    const aspectRatio = content?.aspectRatio || 'square'
    const maxImages = 8

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const remainingSlots = maxImages - images.length
        const filesToUpload = files.slice(0, remainingSlots)

        setUploading(true)
        try {
            const uploadPromises = filesToUpload.map(async (file) => {
                // Try to upload to Supabase, fallback to blob URL
                try {
                    const url = await uploadFile(file, 'media')
                    return { src: url, alt: file.name }
                } catch {
                    return { src: URL.createObjectURL(file), alt: file.name }
                }
            })

            const newImages = await Promise.all(uploadPromises)
            onUpdate?.({ ...content, images: [...images, ...newImages] })
        } catch (error) {
            console.error('Upload failed:', error)
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleReplaceImage = async (e) => {
        const file = e.target.files?.[0]
        if (!file || replacingIndex === null) return

        setUploading(true)
        try {
            let url
            try {
                url = await uploadFile(file, 'media')
            } catch {
                url = URL.createObjectURL(file)
            }

            // Replace the image at the specific index, keeping description
            const newImages = images.map((img, i) =>
                i === replacingIndex ? { ...img, src: url, alt: file.name } : img
            )
            onUpdate?.({ ...content, images: newImages })
        } catch (error) {
            console.error('Replace failed:', error)
        } finally {
            setUploading(false)
            setReplacingIndex(null)
            if (replaceInputRef.current) replaceInputRef.current.value = ''
        }
    }

    const handleRemoveImage = (index) => {
        const newImages = images.filter((_, i) => i !== index)
        onUpdate?.({ ...content, images: newImages })
    }

    const handleCaptionChange = (index, caption) => {
        const newImages = images.map((img, i) =>
            i === index ? { ...img, caption } : img
        )
        onUpdate?.({ ...content, images: newImages })
    }

    const handleDescriptionChange = (index, description) => {
        const newImages = images.map((img, i) =>
            i === index ? { ...img, description } : img
        )
        onUpdate?.({ ...content, images: newImages })
    }

    const setAspectRatio = (ratio) => {
        onUpdate?.({ ...content, aspectRatio: ratio })
    }

    const gridCols = GRID_LAYOUTS[images.length] || 'grid-cols-3'
    const aspectClass = ASPECT_RATIOS[aspectRatio] || ''
    const isAutoAspect = !aspectRatio || aspectRatio === 'auto'

    // Public view
    if (!isAdmin) {
        if (!images.length) return null
        return (
            <div className={`my-6 grid ${gridCols} gap-6`}>
                {images.map((img, index) => (
                    <figure key={index} className="relative">
                        <img
                            src={ImagePresets.thumbnail(img.src)}
                            alt={img.alt || ''}
                            className={`w-full rounded-lg ${!isAutoAspect ? `${aspectClass} object-cover` : 'h-auto'}`}
                            loading="lazy"
                            decoding="async"
                        />
                        {img.description && (
                            <p className="text-sm text-gray-500 mt-2">
                                {img.description}
                            </p>
                        )}
                    </figure>
                ))}
            </div>
        )
    }

    // Admin view
    return (
        <div className="my-6">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
            />
            {/* Hidden input for replacing individual images */}
            <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                onChange={handleReplaceImage}
                className="hidden"
            />

            {/* Aspect ratio toggle */}
            {images.length > 0 && (
                <div className="flex items-center justify-end gap-2 mb-3">
                    <span className="text-xs text-gray-500">Aspect:</span>
                    <button
                        onClick={() => setAspectRatio('auto')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${isAutoAspect
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Maximize2 size={14} />
                        Auto
                    </button>
                    <button
                        onClick={() => setAspectRatio('square')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${aspectRatio === 'square'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <Square size={14} />
                        Square
                    </button>
                    <button
                        onClick={() => setAspectRatio('landscape')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${aspectRatio === 'landscape'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <RectangleHorizontal size={14} />
                        Landscape
                    </button>
                    <button
                        onClick={() => setAspectRatio('portrait')}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${aspectRatio === 'portrait'
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <RectangleVertical size={14} />
                        Portrait
                    </button>
                </div>
            )}

            {images.length > 0 ? (
                <div className={`grid ${gridCols} gap-4`}>
                    {images.map((img, index) => (
                        <div key={index} className="relative group/img">
                            <img
                                src={img.src}
                                alt={img.alt || ''}
                                className={`w-full h-auto rounded-lg ${!isAutoAspect ? `${aspectClass} object-contain bg-gray-50` : ''}`}
                            />
                            {/* Action buttons */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
                                {/* Replace button */}
                                <button
                                    onClick={() => {
                                        setReplacingIndex(index)
                                        replaceInputRef.current?.click()
                                    }}
                                    className="p-1.5 bg-white text-gray-600 rounded-full shadow-sm hover:bg-gray-50"
                                    title="Replace image"
                                >
                                    <ImagePlus size={14} />
                                </button>
                                {/* Remove button */}
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    title="Remove image"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            {/* Description textarea */}
                            <textarea
                                placeholder="Add description..."
                                value={img.description || ''}
                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                rows={2}
                                className="w-full text-sm text-center bg-transparent border-none outline-none mt-2 text-gray-500 placeholder:text-gray-300 resize-none"
                            />
                        </div>
                    ))}

                    {/* Add more button if under limit */}
                    {images.length < maxImages && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className={`rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-300 hover:border-gray-300 hover:text-gray-400 transition-colors min-h-32 ${aspectClass || 'py-8'}`}
                        >
                            <Plus size={24} />
                            <span className="text-xs">Add more</span>
                        </button>
                    )}
                </div>
            ) : (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-gray-300 hover:text-gray-400 transition-colors"
                >
                    <Grid3x3 size={32} />
                    <span className="text-sm">{uploading ? 'Uploading...' : 'Click to add images (up to 8)'}</span>
                </button>
            )}
        </div>
    )
}

