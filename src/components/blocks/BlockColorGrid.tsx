'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Color {
    name: string
    hex: string
    usage?: string
}

interface ColorSwatchProps {
    color: Color
}

function ColorSwatch({ color }: ColorSwatchProps) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(color.hex)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const isLightColor = (hex: string): boolean => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        return luminance > 0.5
    }

    const textColor = isLightColor(color.hex) ? 'text-gray-900' : 'text-white'

    return (
        <div
            className="group relative rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105"
            onClick={copyToClipboard}
        >
            <div
                className="h-32 relative"
                style={{ backgroundColor: color.hex }}
            >
                <div className={`absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity ${textColor}`}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                </div>
            </div>

            <div className="p-4 bg-white border border-t-0 border-gray-100 rounded-b-xl">
                <h4 className="font-semibold text-gray-900 text-sm">{color.name}</h4>
                <p className="text-gray-500 text-sm font-mono mt-1">{color.hex}</p>
                {color.usage && (
                    <p className="text-gray-400 text-xs mt-2">{color.usage}</p>
                )}
            </div>
        </div>
    )
}

interface BlockColorGridData {
    title?: string
    colors: Color[]
}

interface BlockColorGridProps {
    data: BlockColorGridData
}

export default function BlockColorGrid({ data }: BlockColorGridProps) {
    const { title, colors } = data

    return (
        <div>
            {title && (
                <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {colors.map((color, index) => (
                    <ColorSwatch key={index} color={color} />
                ))}
            </div>
        </div>
    )
}
