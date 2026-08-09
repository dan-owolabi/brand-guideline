import { useState, useRef, useEffect } from 'react'
import { ImagePlus, X, Maximize, Minimize, Loader2 } from 'lucide-react'
import { uploadFile } from '../../lib/supabase'
import { ImagePresets, getResponsiveSrcSet } from '../../lib/imageOptimizer'

export default function ImageBlock({
    content,
    isAdmin = false,
    onUpdate
}) {
    const [isUploading, setIsUploading] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [tempWidth, setTempWidth] = useState(content?.width || null)
    const fileInputRef = useRef(null)
    const imageRef = useRef(null)
    const resizeStartRef = useRef(null)

    // Sync tempWidth when content changes
    useEffect(() => {
        if (!isResizing) {
            setTempWidth(content?.width || null)
        }
    }, [content?.width, isResizing])

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            // Upload to Supabase storage to get a persistent URL
            const url = await uploadFile(file, 'media')
            onUpdate?.({ ...content, src: url, alt: file.name })
        } catch (err) {
            console.error('Failed to upload image:', err)
            alert('Image upload failed. Please check your Supabase storage configuration.')
        } finally {
            setIsUploading(false)
            // Reset file input so same file can be selected again
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemove = () => {
        onUpdate?.({ ...content, src: null, alt: '', width: null })
    }

    const toggleFullWidth = () => {
        onUpdate?.({ ...content, fullWidth: !content.fullWidth, width: null })
    }

    // Resize handlers
    const startResize = (e, direction) => {
        e.preventDefault()
        e.stopPropagation()
        if (!imageRef.current) return

        const rect = imageRef.current.getBoundingClientRect()
        resizeStartRef.current = {
            startX: e.clientX,
            startWidth: rect.width,
            direction
        }
        setIsResizing(true)
    }

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e) => {
            if (!resizeStartRef.current) return
            const { startX, startWidth, direction } = resizeStartRef.current

            let diff = e.clientX - startX
            if (direction === 'left') diff = -diff

            const newWidth = Math.max(100, Math.min(1200, startWidth + diff * 2)) // *2 for center-anchored resize
            setTempWidth(newWidth)
        }

        const handleMouseUp = () => {
            if (tempWidth) {
                onUpdate?.({ ...content, width: tempWidth, fullWidth: false })
            }
            setIsResizing(false)
            resizeStartRef.current = null
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, tempWidth, content, onUpdate])

    const hasImage = content?.src
    const isFullWidth = content?.fullWidth
    const displayWidth = isFullWidth ? '100%' : (tempWidth ? `${tempWidth}px` : 'auto')

    // Optimized image URL for public view
    const optimizedSrc = isFullWidth
        ? ImagePresets.hero(content?.src)
        : ImagePresets.content(content?.src)
    const srcSet = getResponsiveSrcSet(content?.src)

    if (!isAdmin) {
        if (!hasImage) return null
        return (
            <figure className={`my-6 ${isFullWidth ? '-mx-8 md:-mx-16 max-w-none' : 'max-w-full'}`}>
                <img
                    src={optimizedSrc}
                    srcSet={srcSet || undefined}
                    sizes={isFullWidth ? '100vw' : '(max-width: 768px) 100vw, 800px'}
                    alt={content.alt || ''}
                    className="w-full rounded-xl"
                    loading="lazy"
                    decoding="async"
                />
                {content.caption && (
                    <figcaption className="prose-small text-center mt-2">
                        {content.caption}
                    </figcaption>
                )}
            </figure>
        )
    }

    return (
        <div
            className={`relative my-6 group/image ${isFullWidth ? '-mx-8 md:-mx-16 max-w-none' : 'max-w-full'}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {hasImage ? (
                <div className="relative flex justify-center">
                    <div
                        className="relative inline-block"
                        style={{ width: displayWidth, maxWidth: '100%' }}
                    >
                        <img
                            ref={imageRef}
                            src={content.src}
                            alt={content.alt || ''}
                            className={`w-full rounded-xl ${isUploading ? 'opacity-50' : ''} ${isResizing ? 'select-none' : ''}`}
                            draggable={false}
                        />

                        {/* Left resize handle */}
                        <div
                            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center"
                            onMouseDown={(e) => startResize(e, 'left')}
                        >
                            <div className="w-1 h-8 bg-blue-500 rounded-full" />
                        </div>

                        {/* Right resize handle */}
                        <div
                            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center"
                            onMouseDown={(e) => startResize(e, 'right')}
                        >
                            <div className="w-1 h-8 bg-blue-500 rounded-full" />
                        </div>

                        {/* Upload overlay */}
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                                <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                                    <Loader2 size={16} className="animate-spin text-gray-600" />
                                    <span className="text-sm font-medium text-gray-600">Uploading...</span>
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 flex gap-2 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                                title="Replace image"
                            >
                                <ImagePlus size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleFullWidth(); }}
                                className="p-1.5 bg-white shadow-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                                title={isFullWidth ? "Collapse" : "Full width"}
                            >
                                {isFullWidth ? <Minimize size={16} /> : <Maximize size={16} />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <input
                        type="text"
                        placeholder="Add a caption..."
                        value={content.caption || ''}
                        onChange={(e) => onUpdate?.({ ...content, caption: e.target.value })}
                        className="absolute -bottom-6 left-0 right-0 text-center prose-small bg-transparent border-none outline-none italic"
                    />
                </div>
            ) : (
                <button
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full h-48 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:border-gray-300 hover:text-gray-400 transition-colors pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? (
                        <>
                            <Loader2 size={32} className="animate-spin" />
                            <span className="text-sm">Uploading image...</span>
                        </>
                    ) : (
                        <>
                            <ImagePlus size={32} />
                            <span className="text-sm">Click to add image</span>
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
