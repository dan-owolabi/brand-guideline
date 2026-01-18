'use client'

import { useState, ChangeEvent } from 'react'
import BlockRenderer from '../BlockRenderer'
import {
    Trash2, ChevronDown, ChevronUp, GripVertical, Upload, Plus,
    X, Loader2, Save, Image as ImageIcon, CheckCircle2, XCircle,
    Star, PlusCircle
} from 'lucide-react'
import { uploadFile } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card, CardContent } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils'

// Types for block data
interface Block {
    id: string
    type: string
    data?: any
}

interface Brand {
    id: string
    primary_color?: string
}

interface BlockEditorProps {
    block: Block
    brand?: Brand
    onUpdate: (data: any) => Promise<void>
    onDelete: () => void
}

const BLOCK_LABELS: Record<string, string> = {
    'hero': 'Hero Banner',
    'text': 'Text Block',
    'color-grid': 'Color Grid',
    'typography-showcase': 'Typography',
    'asset-grid': 'Asset Grid',
    'logo-showcase': 'Logo Showcase',
    'do-dont': 'Do / Don\'t',
    'value-grid': 'Value Grid'
}

export default function BlockEditor({ block, brand, onUpdate, onDelete }: BlockEditorProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [data, setData] = useState(block.data || {})
    const [saving, setSaving] = useState(false)

    const handleFieldChange = (field: string, value: any) => {
        const newData = { ...data, [field]: value }
        setData(newData)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await onUpdate(data)
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            const url = await uploadFile(file)
            handleFieldChange(field, url)
        } catch (err) {
            console.error('Upload failed:', err)
        }
    }

    return (
        <Card className="group overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            {/* Block Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-gray-50/50 border-b border-gray-100 select-none">
                <GripVertical size={16} className="text-gray-300 cursor-grab hover:text-gray-900 transition-colors" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{block.type}</span>
                    <span className="text-sm font-bold text-gray-900">{BLOCK_LABELS[block.type] || block.type}</span>
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="sm"
                        className="h-8 bg-indigo-600 hover:bg-indigo-700 font-bold text-[11px] gap-1.5"
                    >
                        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        {saving ? 'Saving' : 'Save'}
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 text-gray-400"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>

            {/* Block Content */}
            {isExpanded && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                    {/* Live Preview Section */}
                    <div className="border-b border-gray-100 bg-white">
                        <div className="px-6 py-2 bg-gray-50/30 border-b border-gray-50 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Live Preview</span>
                        </div>
                        <div className="p-8">
                            <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden bg-white">
                                <BlockRenderer blocks={[{ ...block, data }]} brand={brand} />
                            </div>
                        </div>
                    </div>

                    <CardContent className="p-8 bg-gray-50/30">
                        {block.type === 'hero' && (
                            <HeroEditor data={data} onChange={handleFieldChange} onImageUpload={handleImageUpload} />
                        )}
                        {block.type === 'text' && (
                            <TextEditor data={data} onChange={handleFieldChange} />
                        )}
                        {block.type === 'color-grid' && (
                            <ColorGridEditor data={data} onChange={handleFieldChange} />
                        )}
                        {block.type === 'typography-showcase' && (
                            <TypographyEditor data={data} onChange={handleFieldChange} />
                        )}
                        {block.type === 'asset-grid' && (
                            <AssetGridEditor data={data} onChange={handleFieldChange} onImageUpload={handleImageUpload} />
                        )}
                        {block.type === 'logo-showcase' && (
                            <LogoShowcaseEditor data={data} onChange={handleFieldChange} onImageUpload={handleImageUpload} />
                        )}
                        {block.type === 'do-dont' && (
                            <DoDontEditor data={data} onChange={handleFieldChange} />
                        )}
                        {block.type === 'value-grid' && (
                            <ValueGridEditor data={data} onChange={handleFieldChange} />
                        )}
                    </CardContent>
                </div>
            )}
        </Card>
    )
}

// Helpers
const LabelWithDesc = ({ label, desc }: { label: string, desc?: string }) => (
    <div className="space-y-1 mb-2">
        <Label className="text-gray-900 font-bold">{label}</Label>
        {desc && <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>}
    </div>
)

// Individual Editors
interface EditorProps {
    data: any
    onChange: (field: string, value: any) => void
    onImageUpload?: (e: ChangeEvent<HTMLInputElement>, field: string) => Promise<void>
}

function HeroEditor({ data, onChange, onImageUpload }: EditorProps) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <LabelWithDesc label="Headline" desc="The primary bold text on the banner." />
                    <Input
                        value={data.headline || ''}
                        onChange={(e) => onChange('headline', e.target.value)}
                        placeholder="Introduce your brand..."
                        className="h-10 transition-all focus:ring-indigo-100"
                    />
                </div>
                <div>
                    <LabelWithDesc label="Subheadline" desc="A short supporting message." />
                    <Input
                        value={data.subheadline || ''}
                        onChange={(e) => onChange('subheadline', e.target.value)}
                        placeholder="Explain what you do..."
                        className="h-10 transition-all focus:ring-indigo-100"
                    />
                </div>
            </div>

            <div>
                <LabelWithDesc label="Background Image" desc="Recommended: 1920x1080px or higher." />
                <div className="group relative border-2 border-dashed rounded-2xl p-2 transition-all hover:bg-gray-50 hover:border-indigo-200">
                    {data.imageUrl ? (
                        <div className="relative aspect-[21/9] rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                            <img src={data.imageUrl} alt="Hero" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                <Button variant="outline" size="sm" className="bg-white border-0 h-8 font-bold relative">
                                    <Upload size={14} className="mr-2" /> Change Image
                                    <input type="file" accept="image/*" onChange={(e) => onImageUpload?.(e, 'imageUrl')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => onChange('imageUrl', '')} className="h-8 font-bold bg-white text-red-600 hover:bg-red-50 border-0 shadow-none">
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center aspect-[21/9] cursor-pointer text-gray-400">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Upload size={24} className="text-gray-400 group-hover:text-indigo-600" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 mb-1">Click to upload hero image</p>
                            <p className="text-xs">Drag and drop or browse files</p>
                            <input type="file" accept="image/*" onChange={(e) => onImageUpload?.(e, 'imageUrl')} className="hidden" />
                        </label>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div>
                    <LabelWithDesc label="Overlay Color" desc="Color tint applied to the image." />
                    <div className="flex items-center gap-3 mt-1">
                        <div className="w-10 h-10 rounded-lg border shadow-sm shrink-0 overflow-hidden" style={{ backgroundColor: data.overlayColor }}>
                            <input type="color" value={data.overlayColor || '#6366f1'} onChange={(e) => onChange('overlayColor', e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                        </div>
                        <Input value={data.overlayColor || '#6366f1'} onChange={(e) => onChange('overlayColor', e.target.value)} className="font-mono h-9" />
                    </div>
                </div>
                <div>
                    <LabelWithDesc label="Overlay Opacity" desc="Adjust transparency (0.1 - 1.0)." />
                    <input type="range" min="0" max="1" step="0.1" value={data.overlayOpacity || 0.6} onChange={(e) => onChange('overlayOpacity', parseFloat(e.target.value))} className="w-full mt-3 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
            </div>
        </div>
    )
}

function TextEditor({ data, onChange }: EditorProps) {
    return (
        <div className="space-y-6">
            <div>
                <LabelWithDesc label="Title" desc="Section heading for this text block." />
                <Input
                    value={data.title || ''}
                    onChange={(e) => onChange('title', e.target.value)}
                    placeholder="e.g. Brand Voice"
                    className="font-bold text-lg h-12"
                />
            </div>
            <div>
                <LabelWithDesc label="Content" desc="Use markdown or multiple paragraphs." />
                <Textarea
                    value={data.body || ''}
                    onChange={(e) => onChange('body', e.target.value)}
                    placeholder="Our brand voice is confident, helpful, and innovative..."
                    className="min-h-[200px] leading-relaxed resize-none p-4"
                />
            </div>
        </div>
    )
}

function ColorGridEditor({ data, onChange }: EditorProps) {
    const colors = data.colors || []
    const addColor = () => onChange('colors', [...colors, { name: 'New Color', hex: '#000000', usage: '' }])
    const updateColor = (idx: number, fld: string, val: any) => {
        const list = [...colors]; list[idx] = { ...list[idx], [fld]: val }; onChange('colors', list)
    }
    const removeColor = (idx: number) => onChange('colors', colors.filter((_: any, i: number) => i !== idx))

    return (
        <div className="space-y-6">
            <LabelWithDesc label="Color Grid Title" desc="Name this collection of colors." />
            <Input value={data.title || ''} onChange={(e) => onChange('title', e.target.value)} className="h-10 mb-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {colors.map((color: any, index: number) => (
                    <div key={index} className="flex flex-col p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group/item">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl border shadow-sm overflow-hidden shrink-0" style={{ backgroundColor: color.hex }}>
                                <input type="color" value={color.hex} onChange={(e) => updateColor(index, 'hex', e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                            </div>
                            <div className="flex-1">
                                <Input value={color.name} onChange={(e) => updateColor(index, 'name', e.target.value)} className="h-9 font-bold" />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeColor(index)} className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <X size={14} />
                            </Button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-400 w-10">Hex</Label>
                                <Input value={color.hex} onChange={(e) => updateColor(index, 'hex', e.target.value)} className="h-8 font-mono text-xs" />
                            </div>
                            <div className="flex items-start gap-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-400 w-10 mt-2">Usage</Label>
                                <Textarea value={color.usage || ''} onChange={(e) => updateColor(index, 'usage', e.target.value)} placeholder="Usage notes..." className="min-h-[60px] text-xs resize-none" />
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addColor} className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all gap-2 group">
                    <Plus size={24} className="group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold">Add Color</span>
                </button>
            </div>
        </div>
    )
}

function DoDontEditor({ data, onChange }: EditorProps) {
    const items = data.items || []
    const addItem = (type: string) => onChange('items', [...items, { type, description: '' }])
    const updateItem = (idx: number, val: string) => {
        const list = [...items]; list[idx] = { ...list[idx], description: val }; onChange('items', list)
    }
    const removeItem = (idx: number) => onChange('items', items.filter((_: any, i: number) => i !== idx))

    return (
        <div className="space-y-6">
            <LabelWithDesc label="Guidelines Title" desc="Name this set of rules." />
            <Input value={data.title || ''} onChange={(e) => onChange('title', e.target.value)} className="h-10 mb-6" />

            <div className="space-y-3">
                {items.map((item: any, index: number) => (
                    <div key={index} className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border transition-all animate-in slide-in-from-left-2 duration-200",
                        item.type === 'do' ? "bg-emerald-50/30 border-emerald-100" : "bg-red-50/30 border-red-100"
                    )}>
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                            item.type === 'do' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                            {item.type === 'do' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <div className="flex-1">
                            <Label className={cn("text-[10px] uppercase font-bold mb-1 block", item.type === 'do' ? "text-emerald-700" : "text-red-700")}>
                                {item.type === 'do' ? 'Do' : "Don't"}
                            </Label>
                            <Input
                                value={item.description}
                                onChange={(e) => updateItem(index, e.target.value)}
                                placeholder={item.type === 'do' ? "e.g. Keep ample whitespace..." : "e.g. Don't stretch the logo..."}
                                className="bg-white border-0 shadow-none h-8 text-sm"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500">
                            <X size={14} />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" size="sm" onClick={() => addItem('do')} className="flex-1 h-10 border-emerald-100 bg-emerald-50/30 text-emerald-700 hover:bg-emerald-100 transition-colors gap-2 font-bold">
                    <PlusCircle size={14} /> Add positive rule
                </Button>
                <Button variant="outline" size="sm" onClick={() => addItem('dont')} className="flex-1 h-10 border-red-100 bg-red-50/30 text-red-700 hover:bg-red-100 transition-colors gap-2 font-bold">
                    <PlusCircle size={14} /> Add negative rule
                </Button>
            </div>
        </div>
    )
}

function LogoShowcaseEditor({ data, onChange, onImageUpload }: EditorProps) {
    const logos = data.logos || []
    const addLogo = () => onChange('logos', [...logos, { name: 'New Variant', imageUrl: '', description: '' }])
    const updateLogo = (idx: number, fld: string, val: any) => {
        const list = [...logos]; list[idx] = { ...list[idx], [fld]: val }; onChange('logos', list)
    }
    const removeLogo = (idx: number) => onChange('logos', logos.filter((_: any, i: number) => i !== idx))

    const handleUpload = async (idx: number, file: File) => {
        try {
            const url = await uploadFile(file)
            updateLogo(idx, 'imageUrl', url)
        } catch (err) {
            console.error('Upload failed:', err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {logos.map((logo: any, index: number) => (
                    <div key={index} className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4 group/item relative hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                            <Input value={logo.name} onChange={(e) => updateLogo(index, 'name', e.target.value)} className="h-8 font-bold border-0 shadow-none p-0 text-gray-900" placeholder="Variant name" />
                            <Button variant="ghost" size="icon" onClick={() => removeLogo(index)} className="h-8 w-8 text-gray-300 hover:text-red-500 group-hover/item:opacity-100 opacity-0 transition-opacity">
                                <Trash2 size={14} />
                            </Button>
                        </div>

                        <div className="aspect-square bg-gray-50 rounded-2xl flex flex-col items-center justify-center p-6 border group/img relative overflow-hidden">
                            {logo.imageUrl ? (
                                <>
                                    <img src={logo.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                                    <div className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <label className="text-white text-xs font-bold cursor-pointer hover:underline flex items-center gap-2">
                                            <Upload size={14} /> Change Logo
                                            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(index, e.target.files[0])} className="hidden" />
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <label className="flex flex-col items-center justify-center cursor-pointer text-gray-400 gap-2">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <Plus size={20} className="text-indigo-600" />
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Add Logo</span>
                                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(index, e.target.files[0])} className="hidden" />
                                </label>
                            )}
                        </div>

                        <Textarea value={logo.description || ''} onChange={(e) => updateLogo(index, 'description', e.target.value)} placeholder="Usage instructions..." className="min-h-[60px] text-xs resize-none bg-gray-50/50 border-0 shadow-none p-3" />
                    </div>
                ))}
                <button onClick={addLogo} className="border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <span className="text-sm font-bold">Add Variant</span>
                </button>
            </div>
        </div>
    )
}

function ValueGridEditor({ data, onChange }: EditorProps) {
    const values = data.values || []
    const addValue = () => onChange('values', [...values, { title: 'New Value', description: '', icon: 'Star' }])
    const updateValue = (idx: number, fld: string, val: any) => {
        const list = [...values]; list[idx] = { ...list[idx], [fld]: val }; onChange('values', list)
    }
    const removeValue = (idx: number) => onChange('values', values.filter((_: any, i: number) => i !== idx))

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {values.map((val: any, index: number) => (
                    <div key={index} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3 group/item">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                <Star size={18} className="text-indigo-600" />
                            </div>
                            <Input value={val.title} onChange={(e) => updateValue(index, 'title', e.target.value)} className="h-9 font-bold border-0 shadow-none p-0 text-gray-900" placeholder="Value name" />
                            <Button variant="ghost" size="icon" onClick={() => removeValue(index)} className="h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 w-10">Icon</Label>
                            <Input value={val.icon || ''} onChange={(e) => updateValue(index, 'icon', e.target.value)} className="h-8 text-xs font-mono" placeholder="Zap, Star, etc" />
                        </div>
                        <Textarea value={val.description || ''} onChange={(e) => updateValue(index, 'description', e.target.value)} placeholder="Description..." className="min-h-[80px] text-xs resize-none bg-gray-50/50 border-0 shadow-none" />
                    </div>
                ))}
                <button onClick={addValue} className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all gap-2 group">
                    <Plus size={24} />
                    <span className="text-sm font-bold">Add Value</span>
                </button>
            </div>
        </div>
    )
}

function TypographyEditor({ data, onChange }: EditorProps) {
    const specimens = data.specimens || []
    const addSpec = () => onChange('specimens', [...specimens, { label: 'Style', size: '16px', weight: '400', sample: 'Building brands' }])
    const updateSpec = (idx: number, fld: string, val: any) => {
        const list = [...specimens]; list[idx] = { ...list[idx], [fld]: val }; onChange('specimens', list)
    }
    const removeSpec = (idx: number) => onChange('specimens', specimens.filter((_: any, i: number) => i !== idx))

    return (
        <div className="space-y-6">
            <LabelWithDesc label="Font Family" desc="The name of the font to showcase." />
            <Input value={data.fontFamily || ''} onChange={(e) => onChange('fontFamily', e.target.value)} className="h-10 mb-6 font-semibold" placeholder="e.g. Inter, Gilroy" />

            <div className="space-y-4">
                {specimens.map((spec: any, index: number) => (
                    <div key={index} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 group/item">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Label</Label>
                                    <Input value={spec.label} onChange={(e) => updateSpec(index, 'label', e.target.value)} className="h-8 text-xs" />
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Size</Label>
                                    <Input value={spec.size} onChange={(e) => updateSpec(index, 'size', e.target.value)} className="h-8 text-xs font-mono" />
                                </div>
                                <div>
                                    <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Weight</Label>
                                    <Input value={spec.weight} onChange={(e) => updateSpec(index, 'weight', e.target.value)} className="h-8 text-xs font-mono" />
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeSpec(index)} className="mt-4 h-8 w-8 text-gray-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                <Trash2 size={14} />
                            </Button>
                        </div>
                        <div>
                            <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Sample Text</Label>
                            <Input value={spec.sample} onChange={(e) => updateSpec(index, 'sample', e.target.value)} className="h-10 font-medium" />
                        </div>
                    </div>
                ))}
                <Button variant="outline" onClick={addSpec} className="w-full h-12 border-dashed border-2 hover:bg-gray-50 gap-2 font-bold text-gray-500">
                    <Plus size={16} /> Add font specimen
                </Button>
            </div>
        </div>
    )
}

function AssetGridEditor({ data, onChange, onImageUpload }: EditorProps) {
    const assets = data.assets || []
    const addAsset = () => onChange('assets', [...assets, { name: 'Asset Name', description: '', thumbnailUrl: '', downloadUrl: '' }])
    const updateAsset = (idx: number, fld: string, val: any) => {
        const list = [...assets]; list[idx] = { ...list[idx], [fld]: val }; onChange('assets', list)
    }
    const removeAsset = (idx: number) => onChange('assets', assets.filter((_: any, i: number) => i !== idx))

    const handleUpload = async (idx: number, file: File, field: string) => {
        try {
            const url = await uploadFile(file)
            updateAsset(idx, field, url)
        } catch (err) {
            console.error('Upload failed:', err)
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assets.map((asset: any, index: number) => (
                    <div key={index} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 group/item">
                        <div className="flex items-center justify-between">
                            <Input value={asset.name} onChange={(e) => updateAsset(index, 'name', e.target.value)} className="h-8 font-bold border-0 shadow-none p-0 text-gray-900" placeholder="Asset name" />
                            <Button variant="ghost" size="icon" onClick={() => removeAsset(index)} className="h-8 w-8 text-gray-300 hover:text-red-500">
                                <Trash2 size={14} />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center p-4 border rounded-xl bg-gray-50 cursor-pointer hover:bg-indigo-50/50 transition-all border-dashed group/up">
                                {asset.thumbnailUrl ? <ImageIcon size={20} className="text-indigo-600 mb-1" /> : <Upload size={20} className="text-gray-300 mb-1" />}
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Preview</span>
                                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(index, e.target.files[0], 'thumbnailUrl')} className="hidden" />
                            </label>
                            <label className="flex flex-col items-center justify-center p-4 border rounded-xl bg-gray-50 cursor-pointer hover:bg-emerald-50/50 transition-all border-dashed group/up">
                                {asset.downloadUrl ? <CheckCircle2 size={20} className="text-emerald-600 mb-1" /> : <Upload size={20} className="text-gray-300 mb-1" />}
                                <span className="text-[10px] font-bold text-gray-500 uppercase">File</span>
                                <input type="file" onChange={(e) => e.target.files?.[0] && handleUpload(index, e.target.files[0], 'downloadUrl')} className="hidden" />
                            </label>
                        </div>

                        <Textarea value={asset.description || ''} onChange={(e) => updateAsset(index, 'description', e.target.value)} placeholder="Description..." className="min-h-[60px] text-xs resize-none bg-gray-50/50 border-0 shadow-none" />
                    </div>
                ))}
                <button onClick={addAsset} className="border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:border-indigo-200 transition-all gap-2">
                    <Plus size={24} />
                    <span className="text-sm font-bold">Add Asset</span>
                </button>
            </div>
        </div>
    )
}
