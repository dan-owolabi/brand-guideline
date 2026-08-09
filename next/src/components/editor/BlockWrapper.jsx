'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function BlockWrapper({
    children,
    isAdmin,
    blockId
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: blockId, disabled: !isAdmin })

    const style = {
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
            {/* 
                We pass listeners and attributes down to children. 
                BrandCanvas will catch these and apply them to the drag handle.
            */}
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        dragHandleProps: { ...attributes, ...listeners }
                    })
                }
                return child
            })}
        </div>
    )
}