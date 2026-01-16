import { useState, useEffect } from 'react'
import { X, Check, Globe, Loader2, AlertCircle } from 'lucide-react'
import { Button } from './Button'

export function PublishModal({ isOpen, onClose, onConfirm, initialSlug, brandName, isPublishing }) {
    const [slug, setSlug] = useState(initialSlug || '')
    const [error, setError] = useState(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSlug(initialSlug || (brandName ? brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''))
            setError(null)
        }
    }, [isOpen, initialSlug, brandName])

    if (!isOpen) return null

    const handleSubmit = () => {
        // Basic validation
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
        onConfirm(cleanSlug)
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
                        Choose a custom link for your brand guidelines. This will be the public URL where people can access your brand.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Public Link
                            </label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                                    {host}/
                                </div>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => {
                                        setSlug(e.target.value)
                                        setError(null)
                                    }}
                                    placeholder="brand-name"
                                    className={`w-full pl-[calc(100%-120px)] pl-32 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm font-medium outline-none transition-all ${error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'}`}
                                    style={{ paddingLeft: `${Math.min(host.length * 8 + 20, 180)}px` }}
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
