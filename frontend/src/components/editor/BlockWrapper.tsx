'use client'

import React, { CSSProperties, ReactNode, ReactElement } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface BlockWrapperProps {
    children: ReactNode
    isAdmin: boolean
    blockId: string
}

interface DragHandleProps {
    [key: string]: unknown
}

interface ChildProps {
    dragHandleProps?: DragHandleProps
}

export default function BlockWrapper({
    children,
    isAdmin,
    blockId
}: BlockWrapperProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: blockId, disabled: !isAdmin })

    const style: CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative'
    }

    if (!isAdmin) {
        return <div id={blockId} className="block-content">{children}</div>
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            id={blockId}
            className={`relative group block-content ${isDragging ? 'ring-2 ring-black/5 rounded-lg' : ''}`}
        >
            {React.Children.map(children, child => {
                if (React.isValidElement<ChildProps>(child)) {
                    return React.cloneElement(child, {
                        dragHandleProps: { ...attributes, ...listeners }
                    } as Partial<ChildProps>)
                }
                return child
            })}
        </div>
    )
}
