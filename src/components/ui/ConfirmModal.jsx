import { useState } from 'react'
import { X, AlertTriangle, Trash2, Info } from 'lucide-react'

/**
 * Reusable Confirmation Modal Component
 * 
 * Usage:
 * const [confirmState, setConfirmState] = useState({ open: false })
 * 
 * const handleDelete = () => {
 *   setConfirmState({
 *     open: true,
 *     title: 'Delete file?',
 *     message: 'This action cannot be undone.',
 *     confirmText: 'Delete',
 *     variant: 'danger',
 *     onConfirm: () => { // do delete }
 *   })
 * }
 * 
 * <ConfirmModal {...confirmState} onClose={() => setConfirmState({ open: false })} />
 */

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = 'Confirm action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default' // 'default' | 'danger' | 'warning'
}) {
    if (!open) return null

    const variantStyles = {
        default: {
            icon: Info,
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-500',
            buttonBg: 'bg-gray-900 hover:bg-gray-800',
        },
        danger: {
            icon: Trash2,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            buttonBg: 'bg-red-600 hover:bg-red-700',
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-500',
            buttonBg: 'bg-amber-600 hover:bg-amber-700',
        }
    }

    const style = variantStyles[variant] || variantStyles.default
    const Icon = style.icon

    const handleConfirm = () => {
        onConfirm?.()
        onClose?.()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${style.iconBg} rounded-full flex items-center justify-center mb-4`}>
                        <Icon size={24} className={style.iconColor} />
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-500 text-sm mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className={`flex-1 px-4 py-2.5 ${style.buttonBg} text-white font-medium text-sm rounded-xl transition-colors`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Hook for easier confirm modal usage
 */
export function useConfirmModal() {
    const [state, setState] = useState({ open: false })

    const confirm = ({ title, message, confirmText, cancelText, variant, onConfirm }) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                title,
                message,
                confirmText,
                cancelText,
                variant,
                onConfirm: () => {
                    onConfirm?.()
                    resolve(true)
                },
                onCancel: () => resolve(false)
            })
        })
    }

    const close = () => {
        state.onCancel?.()
        setState({ open: false })
    }

    const ConfirmModalComponent = () => (
        <ConfirmModal
            {...state}
            onClose={close}
        />
    )

    return { confirm, ConfirmModal: ConfirmModalComponent, close }
}

/**
 * Input Modal Component - For prompts that need text input
 */
export function InputModal({
    open,
    onClose,
    onSubmit,
    title = 'Enter value',
    placeholder = '',
    defaultValue = '',
    submitText = 'Create',
    cancelText = 'Cancel'
}) {
    const [value, setValue] = useState(defaultValue)

    // Reset value when modal opens
    useState(() => {
        if (open) setValue(defaultValue)
    }, [open, defaultValue])

    if (!open) return null

    const handleSubmit = (e) => {
        e?.preventDefault()
        if (value.trim()) {
            onSubmit?.(value.trim())
            onClose?.()
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 fade-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <X size={18} />
                </button>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {title}
                    </h3>

                    {/* Input */}
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all mb-6"
                    />

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            type="submit"
                            disabled={!value.trim()}
                            className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-colors"
                        >
                            {submitText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
