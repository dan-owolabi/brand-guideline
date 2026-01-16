import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useBrandEditor } from '../../hooks/useBrandEditor'
import BrandRenderer from '../BrandRenderer'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
    Eye,
    Edit3,
    Save,
    Loader2,
    Upload,
    Undo2,
    Plus,
    CheckCircle2
} from 'lucide-react'

/**
 * ContentEditor - The main Live Preview editor for the admin dashboard.
 * Embeds BrandRenderer with inline editing capabilities.
 */
export default function ContentEditor() {
    const { currentBrand } = useOutletContext()
    const {
        draft,
        loading,
        saving,
        publish,
        saveDraft,
        updateSection,
        addSection,
        removeSection,
        updateBlock,
        addBlock,
        removeBlock
    } = useBrandEditor(currentBrand?.id)

    const [editMode, setEditMode] = useState(true) // true = Edit, false = Preview
    const [activeSlug, setActiveSlug] = useState(null)
    const [publishSuccess, setPublishSuccess] = useState(false)

    // Auto-select first section
    if (!activeSlug && draft?.sections?.length > 0) {
        setActiveSlug(draft.sections[0].slug)
    }

    const handlePublish = async () => {
        try {
            await publish()
            setPublishSuccess(true)
            setTimeout(() => setPublishSuccess(false), 3000)
        } catch (err) {
            alert('Failed to publish: ' + err.message)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[600px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!draft) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] text-center gap-4">
                <p className="text-gray-500">No draft data found.</p>
                <p className="text-sm text-gray-400">
                    Run the migration from <a href="/#/admin/migrate" className="underline text-indigo-600">Upgrade Data</a> first.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Editor Toolbar */}
            <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    {/* Edit/Preview Toggle */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setEditMode(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editMode
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Edit3 size={14} /> Edit
                        </button>
                        <button
                            onClick={() => setEditMode(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${!editMode
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                    </div>

                    {saving && (
                        <Badge variant="secondary" className="gap-1.5">
                            <Loader2 size={12} className="animate-spin" /> Saving...
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={saveDraft}
                        disabled={saving}
                        className="gap-1.5"
                    >
                        <Save size={14} /> Save Draft
                    </Button>
                    <Button
                        size="sm"
                        onClick={handlePublish}
                        disabled={saving}
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {publishSuccess ? (
                            <>
                                <CheckCircle2 size={14} /> Published!
                            </>
                        ) : (
                            <>
                                <Upload size={14} /> Publish
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Live Preview Area */}
            <div className="flex-1 overflow-auto bg-gray-50">
                <div className="min-h-full">
                    <BrandRenderer
                        data={draft}
                        editable={editMode}
                        activeSlug={activeSlug}
                        brand={{
                            primaryColor: draft.tokens?.primaryColor,
                            name: currentBrand?.name
                        }}
                        onUpdate={(newDraft) => {
                            // This is called by BrandRenderer when blocks are updated inline
                            // The useBrandEditor hook's updateDraft would handle this
                            // For now we'll handle it via the individual update functions
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
