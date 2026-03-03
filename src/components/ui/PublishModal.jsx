import { useState, useEffect } from 'react'
import { X, Check, Globe, Loader2, AlertCircle, BookOpen, Image, Layers } from 'lucide-react'
import { Button } from './Button'

const PUBLISH_MODES = [
    {
        id: 'both',
        label: 'Both',
        description: 'Guidelines + Assets',
        icon: Layers,
    },
    {
        id: 'guidelines',
        label: 'Guidelines only',
        description: 'Hide the assets page',
        icon: BookOpen,
    },
    {
        id: 'assets',
        label: 'Assets only',
        description: 'Hide the guidelines',
        icon: Image,
    },
]

export function PublishModal({ isOpen, onClose, onConfirm, initialSlug, brandName, isPublishing }) {
    const [slug, setSlug] = useState(initialSlug || '')
    const [error, setError] = useState(null)
    const [publishMode, setPublishMode] = useState('both')

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSlug(initialSlug || (brandName ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''))
            setError(null)
            setPublishMode('both')
        }
    }, [isOpen, initialSlug, brandName])

    if (!isOpen) return null

    const handleSubmit = () => {
        const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-')

        if (!cleanSlug) {
            setError('Please enter a valid link name')
            return
        }

        if (cleanSlug.length < 1) {
            setError('Link must be at least 1 characters')
            return
        }

        if (['admin', 'assets', 'login', 'signup', 'api'].includes(cleanSlug)) {
            setError('This link name is reserved')
            return
        }

        setSlug(cleanSlug)
        onConfirm(cleanSlug, publishMode)
    }

    const host = window.location.host

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!isPublishing ? onClose : undefined} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                            <Globe size={24} />
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isPublishing}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mb-2">Publish your Brand</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Choose what to make public and set your brand's URL.
                    </p>

                    <div className="space-y-5">
                        {/* What to publish */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                What to publish
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {PUBLISH_MODES.map((mode) => {
                                    const Icon = mode.icon
                                    const isSelected = publishMode === mode.id
                                    return (
                                        <button
                                            key={mode.id}
                                            onClick={() => setPublishMode(mode.id)}
                                            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all ${
                                                isSelected
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {isSelected && (
                                                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                                    <Check size={10} className="text-white" />
                                                </span>
                                            )}
                                            <Icon
                                                size={20}
                                                className={isSelected ? 'text-green-600' : 'text-gray-400'}
                                            />
                                            <div>
                                                <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                                                    {mode.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                                                    {mode.description}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Public Link */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Public Link
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                    {host}/brand/
                                </div>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlug(e.target.value)
                                        setError(null)
                                    }}
                                    placeholder="brand-name"
                                    className={`w-full pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm font-medium outline-none transition-all ${error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                                    style={{ paddingLeft: `${Math.min((host.length + 7) * 8 + 20, 220)}px` }}
                                />
                            </div>
                            {error && (
                                <div className="flex items-center gap-1.5 mt-2 text-red-500 text-xs font-medium">
                                    <AlertCircle size={12} />
                                    {error}
                                </div>
                            )}
                            <p className="mt-2 text-xs text-gray-400">
                                Letters, numbers, and dashes only.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isPublishing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPublishing}
                        className="bg-green-500 hover:bg-green-600 text-white shadow-md shadow-green-500/20"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                Publishing...
                            </>
                        ) : (
                            <>
                                Publish Live
                                <Globe size={16} className="ml-2 opacity-60" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
