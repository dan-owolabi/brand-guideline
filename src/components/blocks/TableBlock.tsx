'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface TableBlockContent {
    headers?: string[]
    rows?: string[][]
    hasHeaderRow?: boolean
    colWidths?: string[]
}

interface TableBlockProps {
    content: TableBlockContent
    isAdmin?: boolean
    onUpdate?: (content: TableBlockContent) => void
}

export default function TableBlock({
    content,
    isAdmin = false,
    onUpdate
}: TableBlockProps) {
    const headers = content?.headers || ['Column 1', 'Column 2']
    const rows = content?.rows || [['', ''], ['', '']]
    const hasHeaderRow = content?.hasHeaderRow !== false

    const colWidthsProp = content?.colWidths || []
    const DEFAULT_COL_WIDTH = '150px'
    const safeColWidths = headers.map((_, i) => colWidthsProp[i] || DEFAULT_COL_WIDTH)

    const tableRef = useRef<HTMLTableElement>(null)
    const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null)
    const [tempColWidths, setTempColWidths] = useState(safeColWidths)

    useEffect(() => {
        if (!resizing) {
            setTempColWidths(safeColWidths)
        }
    }, [content?.colWidths, headers.length, resizing])

    const updateHeaders = (newHeaders: string[]) => {
        onUpdate?.({ ...content, headers: newHeaders, rows, colWidths: safeColWidths })
    }

    const updateRows = (newRows: string[][]) => {
        onUpdate?.({ ...content, headers, rows: newRows, colWidths: safeColWidths })
    }

    const commitColWidths = (newWidths: string[]) => {
        onUpdate?.({ ...content, headers, rows, colWidths: newWidths })
    }

    const addColumn = (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        const newHeaders = [...headers, `Column ${headers.length + 1}`]
        const newRows = rows.map(row => [...row, ''])
        const newColWidths = [...safeColWidths, '150px']
        onUpdate?.({ ...content, headers: newHeaders, rows: newRows, colWidths: newColWidths })
    }

    const removeColumn = (colIndex: number, e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (headers.length <= 1) return
        const newHeaders = headers.filter((_, i) => i !== colIndex)
        const newRows = rows.map(row => row.filter((_, i) => i !== colIndex))
        const newColWidths = safeColWidths.filter((_, i) => i !== colIndex)
        onUpdate?.({ ...content, headers: newHeaders, rows: newRows, colWidths: newColWidths })
    }

    const addRow = (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        const newRow = headers.map(() => '')
        updateRows([...rows, newRow])
    }

    const removeRow = (rowIndex: number, e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (rows.length <= 1) return
        updateRows(rows.filter((_, i) => i !== rowIndex))
    }

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = rows.map((row, ri) =>
            ri === rowIndex
                ? row.map((cell, ci) => ci === colIndex ? value : cell)
                : row
        )
        updateRows(newRows)
    }

    const updateHeader = (colIndex: number, value: string) => {
        const newHeaders = headers.map((h, i) => i === colIndex ? value : h)
        updateHeaders(newHeaders)
    }

    const toggleHeaderRow = () => {
        onUpdate?.({ ...content, hasHeaderRow: !hasHeaderRow })
    }

    const startResize = (index: number, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.pageX
        const headerCell = (e.target as HTMLElement).closest('th')
        const startWidth = headerCell?.getBoundingClientRect().width || 150

        setResizing({ index, startX, startWidth })
    }

    useEffect(() => {
        if (!resizing) return

        const handleMouseMove = (e: MouseEvent) => {
            const diff = e.pageX - resizing.startX
            const newWidth = Math.max(50, resizing.startWidth + diff)

            setTempColWidths(prev => {
                const draft = [...prev]
                draft[resizing.index] = `${newWidth}px`
                return draft
            })
        }

        const handleMouseUp = (e: MouseEvent) => {
            const diff = e.pageX - resizing.startX
            const newWidth = Math.max(50, resizing.startWidth + diff)
            const finalWidths = [...safeColWidths]
            while (finalWidths.length <= resizing.index) finalWidths.push('auto')

            finalWidths[resizing.index] = `${newWidth}px`

            commitColWidths(finalWidths)
            setResizing(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizing, safeColWidths])

    if (!isAdmin) {
        return (
            <div className="my-6 overflow-x-auto">
                <table className="w-full border-collapse text-xs table-fixed">
                    <colgroup>
                        {safeColWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                    </colgroup>
                    {hasHeaderRow && (
                        <thead>
                            <tr className="border-b border-gray-200">
                                {headers.map((header, i) => (
                                    <th key={i} className="px-4 py-2 text-left font-semibold text-gray-900 bg-gray-50 break-words border-r border-gray-100 last:border-r-0">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri} className="border-b border-gray-100">
                                {row.map((cell, ci) => (
                                    <td key={ci} className="px-4 py-2 text-gray-700 break-words border-r border-gray-100 last:border-r-0">
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="my-6 overflow-x-auto">
            <div className="min-w-max">
                <table
                    ref={tableRef}
                    className="border-collapse text-xs border border-gray-200 rounded-lg overflow-hidden"
                >
                    <colgroup>
                        {tempColWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                        <col style={{ width: '40px' }} />
                    </colgroup>
                    {hasHeaderRow && (
                        <thead>
                            <tr className="bg-gray-50">
                                {headers.map((header, i) => (
                                    <th key={i} className="relative border-r border-gray-200 last:border-r-0 group/col p-0">
                                        <div className="flex relative items-center h-full">
                                            <input
                                                type="text"
                                                value={header}
                                                onChange={(e) => updateHeader(i, e.target.value)}
                                                className="w-full px-3 py-2 bg-transparent font-semibold text-gray-900 outline-none min-w-0"
                                                placeholder="Header"
                                            />
                                            {headers.length > 1 && (
                                                <button
                                                    onClick={(e) => removeColumn(i, e)}
                                                    className="absolute top-1 right-2 p-0.5 bg-red-100 text-red-500 rounded opacity-0 group-hover/col:opacity-100 transition-opacity z-10"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <div
                                            className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 z-20"
                                            onMouseDown={(e) => startResize(i, e)}
                                        />
                                    </th>
                                ))}
                                <th className="bg-gray-50 p-0 text-center align-middle">
                                    <button
                                        onClick={(e) => addColumn(e)}
                                        className="p-1 text-gray-400 hover:text-gray-600 inline-flex"
                                        title="Add column"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr key={ri} className="border-t border-gray-200 group/row">
                                {row.map((cell, ci) => (
                                    <td key={ci} className="border-r border-gray-100 last:border-r-0 p-0 relative">
                                        <textarea
                                            value={cell}
                                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                                            className="w-full h-full px-3 py-2 bg-transparent text-gray-700 outline-none resize-none min-w-0 block overflow-hidden"
                                            rows={1}
                                            style={{ minHeight: '36px' }}
                                            placeholder="..."
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement
                                                target.style.height = 'auto'
                                                target.style.height = target.scrollHeight + 'px'
                                            }}
                                        />
                                    </td>
                                ))}
                                <td className="text-center align-middle">
                                    {rows.length > 1 && (
                                        <button
                                            onClick={(e) => removeRow(ri, e)}
                                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity inline-flex"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button
                    onClick={(e) => addRow(e)}
                    className="w-full mt-1 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                    <Plus size={12} />
                    Add row
                </button>
            </div>

            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={hasHeaderRow}
                        onChange={toggleHeaderRow}
                        className="rounded border-gray-300"
                    />
                    Header row
                </label>
            </div>
        </div>
    )
}
