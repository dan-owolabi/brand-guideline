import { useState, useRef, useEffect } from 'react'
import { AlertCircle, Info, Lightbulb, AlertTriangle } from 'lucide-react'

/**
 * CalloutBlock - Styled callout with icon and editable message
 */
const CALLOUT_TYPES = {
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-500' },
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-500' },
    tip: { icon: Lightbulb, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-500' },
    important: { icon: AlertCircle, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', iconColor: 'text-purple-500' }
}

export default function CalloutBlock({
    content,
    isAdmin = false,
    onUpdate
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [localText, setLocalText] = useState(content?.text || '')
    const textareaRef = useRef(null)

    const type = content?.type || 'info'
    const style = CALLOUT_TYPES[type] || CALLOUT_TYPES.info
    const Icon = style.icon

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [isEditing])

    const startEditing = () => {
        setLocalText(content?.text || '')
        setIsEditing(true)
    }

    const handleBlur = () => {
        setIsEditing(false)
        if (localText !== content?.text) {
            onUpdate?.({ ...content, text: localText })
        }
    }

    const cycleType = () => {
        const types = Object.keys(CALLOUT_TYPES)
        const currentIndex = types.indexOf(type)
        const nextType = types[(currentIndex + 1) % types.length]
        onUpdate?.({ ...content, type: nextType })
    }

    return (
        <div className={`${style.bg} ${style.border} border rounded-lg p-4 flex gap-3 my-4`}>
            <div
                className={`${style.iconColor} shrink-0 ${isAdmin ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                onClick={isAdmin ? cycleType : undefined}
                title={isAdmin ? 'Click to change type' : undefined}
            >
                <Icon size={20} />
            </div>
            <div className="flex-1">
                {isAdmin && isEditing ? (
                    <textarea
                        ref={textareaRef}
                        value={localText}
                        onChange={(e) => setLocalText(e.target.value)}
                        onBlur={handleBlur}
                        className={`w-full ${style.text} bg-transparent border-none outline-none resize-none text-sm`}
                        rows={Math.max(2, localText.split('\n').length)}
                        placeholder="Enter callout message..."
                    />
                ) : (
                    <p
                        className={`${style.text} text-sm ${isAdmin ? 'cursor-text' : ''}`}
                        onClick={() => isAdmin && startEditing()}
                    >
                        {isEditing ? localText : (content?.text || (isAdmin ? <span className="opacity-50">Click to add message...</span> : ''))}
                    </p>
                )}
            </div>
        </div>
    )
}
