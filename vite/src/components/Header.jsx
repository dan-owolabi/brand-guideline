import { useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Check, Loader2, Globe, Menu, PanelLeft, Upload } from 'lucide-react'
import { uploadFile } from '../lib/supabase'
import { getBrandUrl } from '../lib/domainResolver'

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
    onToggleSidebar,
    onUpdateBrand,
    basePath,
    publishMode
}) {
    const navigate = useNavigate()
    const location = useLocation()
    const fileInputRef = useRef(null)
    const colorInputRef = useRef(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const bgColor = brand?.primary_color || brand?.primaryColor || '#111827'
    const textColor = getContrastColor(bgColor)
    const isDarkBg = textColor === 'white'
    const logoUrl = brand?.logo_url || brand?.logoUrl

    // Detect current page for active state
    const currentPath = location.pathname + location.hash

    // Active state logic
    const isAssetsActive = currentPath.includes('/assets')
    const isGuidelinesActive = !isAssetsActive && (
        currentPath === '/' ||
        currentPath.includes('/introduction') ||
        (isAdmin && currentPath.includes('/brand/'))
    )

    // Button styles based on contrast
    const iconBtnClass = isDarkBg
        ? "w-10 h-10 flex items-center justify-center bg-white/10 text-white hover:bg-white/20 rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-sm"
        : "w-10 h-10 flex items-center justify-center bg-black/5 text-gray-900 hover:bg-black/10 rounded-full backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-sm"

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

    // Navigation Links Logic
    // Admin: /admin/brand/:id/introduction
    // Public: {basePath}/introduction
    const publicBasePath = typeof basePath !== 'undefined' ? basePath : `/brand/${brand?.slug}`

    const guidelinesLink = isAdmin
        ? `/admin/brand/${brand?.id}/introduction`
        : `${publicBasePath}/introduction`

    const assetsLink = isAdmin
        ? `/admin/brand/${brand?.id}/assets`
        : `${publicBasePath}/assets`

    // Public URL for View Live button
    const publicIdentifier = brand?.slug || brand?.id
    // Instead of routing to /brand/slug, use the canonical getBrandUrl which creates slug.guidr.space
    const viewLiveUrl = isAssetsActive
        ? `${getBrandUrl(publicIdentifier)}/assets`
        : getBrandUrl(publicIdentifier)

    return (
        <header
            className={`fixed top-4 md:top-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[calc(100%-2rem)] max-w-[1400px] ${isAdmin ? 'px-4 md:px-6' : 'px-6 md:px-10'} h-16 md:h-[72px] z-50 flex items-center justify-between border border-white/20 shadow-float backdrop-blur-2xl transition-all rounded-full group/header`}
            style={{ backgroundColor: isDarkBg ? `${bgColor}E6` : `${bgColor}E6` }}
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
                {/* Sidebar Toggle - Visible on Mobile and Desktop */}
                {onToggleSidebar && (
                    <button
                        onClick={onToggleSidebar}
                        className={`${iconBtnClass} mr-2`}
                        title="Toggle Sidebar"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}

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
                    className={`h-6 md:h-6 flex items-center relative group/logo ${isAdmin ? 'cursor-pointer' : ''}`}
                    onClick={() => isAdmin && fileInputRef.current?.click()}
                    title={isAdmin ? "Click to upload logo (SVG or PNG)" : ""}
                >
                    {logoUrl ? (
                        <img src={logoUrl} alt={brand?.name} className="h-full w-auto object-contain" />
                    ) : (
                        <span className="text-lg md:text-xl font-bold" style={{ color: textColor }}>{brand?.name}</span>
                    )}

                    {isAdmin && logoUrl && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity rounded">
                            <Upload size={14} className="text-white" />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side: Nav + Actions */}
            <div className="flex items-center gap-4 md:gap-8">
                <nav
                    className="hidden md:flex items-center gap-6 font-medium text-[15px]"
                    style={{ color: textColor }}
                >
                    {(isAdmin || !publishMode || publishMode === 'both' || publishMode === 'guidelines') && (
                        <Link
                            to={guidelinesLink}
                            className={getNavLinkClass(isGuidelinesActive)}
                        >
                            Guidelines
                        </Link>
                    )}
                    {(isAdmin || !publishMode || publishMode === 'both' || publishMode === 'assets') && (
                        <Link
                            to={assetsLink}
                            className={getNavLinkClass(isAssetsActive)}
                        >
                            Assets
                        </Link>
                    )}
                </nav>

                {isAdmin ? (
                    <div className={`flex items-center gap-2 md:gap-3 md:pl-6 md:border-l ${isDarkBg ? 'border-white/10' : 'border-black/5'}`}>
                        {/* View Live (Icon Only) */}
                        <a
                            href={viewLiveUrl}
                            target="_blank"
                            className={`${iconBtnClass} hidden md:flex`}
                            title="View Live Site"
                        >
                            <ExternalLink size={18} />
                        </a>

                        <button
                            onClick={onPublish}
                            disabled={isPublishing}
                            className={`
                                flex items-center gap-1.5 md:gap-2 px-5 md:px-7 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold text-gray-900 transition-all shadow-float hover:scale-105 active:scale-95
                                ${publishSuccess ? 'bg-green-400 hover:bg-green-300' : 'bg-white hover:bg-gray-50'}
                                ${isPublishing ? 'opacity-75 cursor-wait' : ''}
                            `}
                        >
                            {isPublishing ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : publishSuccess ? (
                                <Check size={14} />
                            ) : (
                                <Globe size={14} />
                            )}
                            <span className="hidden sm:inline">{isPublishing ? 'Publishing' : publishSuccess ? 'Published' : 'Publish'}</span>
                        </button>
                    </div>
                ) : null}

                {/* Mobile Menu Toggle */}
                <button
                    className={`${iconBtnClass} md:hidden`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    <Menu size={20} />
                </button>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="absolute top-20 left-0 right-0 bg-white shadow-xl rounded-2xl p-4 flex flex-col gap-2 md:hidden animate-in slide-in-from-top-4 z-50 mx-4 border border-gray-100">
                        {(isAdmin || !publishMode || publishMode === 'both' || publishMode === 'guidelines') && (
                            <Link
                                to={`${basePath}/${brand?.id}/introduction`}
                                className={`p-3 rounded-lg font-medium transition-colors ${isGuidelinesActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Guidelines
                            </Link>
                        )}
                        {(isAdmin || !publishMode || publishMode === 'both' || publishMode === 'assets') && (
                            <Link
                                to={`${basePath}/${brand?.id}/assets`}
                                className={`p-3 rounded-lg font-medium transition-colors ${isAssetsActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Assets
                            </Link>
                        )}
                        {isAdmin && (
                            <a
                                href={viewLiveUrl}
                                target="_blank"
                                className="p-3 rounded-lg font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                            >
                                View Live Site
                                <ExternalLink size={16} />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </header >
    )
}
