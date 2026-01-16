import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Check, Loader2, Globe, Menu, PanelLeft, Upload } from 'lucide-react'
import { uploadFile } from '../lib/supabase'

// Helper to determine text color (black or white) based on background brightness
function getContrastColor(hexColor) {
    if (!hexColor) return 'white'

    // Convert to hex if it's not (basic check) - strict hex expected here for now
    const hex = hexColor.replace('#', '')

    // Parse r, g, b
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)

    // Calculate YIQ brightness
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000

    // Return black for light backgrounds, white for dark
    return (yiq >= 128) ? 'black' : 'white'
}

export default function Header({
    brand,
    isAdmin = false,
    onPublish,
    isPublishing,
    publishSuccess,
    sidebarOpen,
    onToggleSidebar,
    onUpdateBrand
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const fileInputRef = useRef(null)
    const colorInputRef = useRef(null)

    const bgColor = brand?.primary_color || brand?.primaryColor || '#111827'
    const textColor = getContrastColor(bgColor)
    const isDarkBg = textColor === 'white'
    const logoUrl = brand?.logo_url || brand?.logoUrl

    // Detect current page for active state
    const currentPath = location.pathname + location.hash
    const isGuidelinesActive = currentPath.includes('/introduction') || (!currentPath.includes('/assets') && currentPath.includes('/brand/'))
    const isAssetsActive = currentPath.includes('/assets')

    // Button styles based on contrast
    const iconBtnClass = isDarkBg
        ? "w-10 h-10 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 rounded-full backdrop-blur-sm transition-all"
        : "w-10 h-10 flex items-center justify-center bg-black/5 text-gray-900 hover:bg-black/10 rounded-full backdrop-blur-sm transition-all"

    const getNavLinkClass = (isActive) => {
        const baseClass = "transition-colors"
        if (isActive) {
            return isDarkBg
                ? `${baseClass} opacity-100`
                : `${baseClass} opacity-100`
        }
        return isDarkBg
            ? `${baseClass} opacity-60 hover:opacity-100`
            : `${baseClass} opacity-50 hover:opacity-100`
    }

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const url = await uploadFile(file, 'media')
            onUpdateBrand?.({ logoUrl: url })
        } catch (error) {
            console.error("Logo upload failed", error)
            alert("Failed to upload logo")
        }
    }

    const handleColorChange = (e) => {
        onUpdateBrand?.({ primaryColor: e.target.value })
    }

    // Base path for navigation
    const basePath = isAdmin ? '#/admin/brand' : '#/brand'

    // Public URL for View Live button (points to current page equivalent)
    const publicBase = `${window.location.origin}/#/brand/${brand?.id}`
    const viewLiveUrl = isAssetsActive
        ? `${publicBase}/assets`
        : `${publicBase}/introduction`

    return (
        <header
            className={`fixed top-4 ${isAdmin ? 'left-4 right-4 px-6' : 'left-8 right-8 px-10'} h-24 z-50 flex items-center justify-between shadow-sm transition-all rounded-full group/header`}
            style={{ backgroundColor: bgColor }}
        >
            {isAdmin && (
                <>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/svg+xml,image/png"
                        onChange={handleLogoUpload}
                    />

                    {/* Hidden Color Input - triggers native picker directly */}
                    <input
                        type="color"
                        ref={colorInputRef}
                        className="sr-only"
                        value={bgColor}
                        onChange={handleColorChange}
                    />

                    {/* Change Color Button - styled to match header */}
                    <button
                        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/header:opacity-100 px-4 py-2 rounded-full text-sm font-medium transition-all z-50 pointer-events-auto shadow-lg ${isDarkBg ? 'bg-white/20 text-white hover:bg-white/30 border border-white/30' : 'bg-black/10 text-gray-900 hover:bg-black/20 border border-black/10'}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            colorInputRef.current?.click()
                        }}
                        title="Change Header Color"
                    >
                        Change Color
                    </button>
                </>
            )}

            {/* Left Side: Back + Logo */}
            <div className="flex items-center gap-4 relative z-10">
                {isAdmin && (
                    <button
                        onClick={() => navigate('/admin')}
                        className={`${iconBtnClass} mr-2`}
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}

                {/* Logo - placed directly on header */}
                <div
                    className={`h-[30px] flex items-center relative group/logo ${isAdmin ? 'cursor-pointer' : ''}`}
                    onClick={() => isAdmin && fileInputRef.current?.click()}
                    title={isAdmin ? "Click to upload logo (SVG or PNG)" : ""}
                >
                    {logoUrl ? (
                        <img src={logoUrl} alt={brand?.name} className="h-full w-auto object-contain" />
                    ) : (
                        <span className="text-xl font-bold" style={{ color: textColor }}>{brand?.name}</span>
                    )}

                    {isAdmin && logoUrl && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity rounded">
                            <Upload size={14} className="text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Nav + Actions */}
            <div className="flex items-center gap-8">
                <nav
                    className="flex items-center gap-6 font-medium text-[15px]"
                    style={{ color: textColor }}
                >
                    <a
                        href={`${basePath}/${brand?.id}/introduction`}
                        className={getNavLinkClass(isGuidelinesActive)}
                    >
                        Guidelines
                    </a>
                    <a
                        href={`${basePath}/${brand?.id}/assets`}
                        className={getNavLinkClass(isAssetsActive)}
                    >
                        Assets
                    </a>
                    {/* Documentation link removed */}
                </nav>

                {isAdmin ? (
                    <div className={`flex items-center gap-3 pl-6 border-l ${isDarkBg ? 'border-white/10' : 'border-black/5'}`}>
                        {/* View Live (Icon Only) */}
                        <a
                            href={viewLiveUrl}
                            target="_blank"
                            className={iconBtnClass}
                            title="View Live Site"
                        >
                            <ExternalLink size={18} />
                        </a>

                        <button
                            onClick={onPublish}
                            disabled={isPublishing}
                            className={`
                                flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-gray-900 transition-all shadow-lg
                                ${publishSuccess ? 'bg-green-400 hover:bg-green-300' : 'bg-white hover:bg-gray-50'}
                                ${isPublishing ? 'opacity-75 cursor-wait' : ''}
                            `}
                        >
                            {isPublishing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : publishSuccess ? (
                                <Check size={16} />
                            ) : (
                                <Globe size={16} />
                            )}
                            {isPublishing ? 'Publishing' : publishSuccess ? 'Published' : 'Publish'}
                        </button>
                    </div>
                ) : null}
            </div>
        </header>
    )
}
