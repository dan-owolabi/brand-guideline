'use client'

import * as React from "react"
import { X } from "lucide-react"

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 z-50">
                {children}
            </div>
        </div>
    )
}

interface DialogContentProps {
    children: React.ReactNode
    title: string
    description?: string
    onClose: () => void
}

export function DialogContent({ children, title, description, onClose }: DialogContentProps) {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                    <X size={20} />
                </button>
            </div>
            <div className="py-2">
                {children}
            </div>
        </div>
    )
}

interface DialogFooterProps {
    children: React.ReactNode
}

export function DialogFooter({ children }: DialogFooterProps) {
    return (
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
            {children}
        </div>
    )
}
