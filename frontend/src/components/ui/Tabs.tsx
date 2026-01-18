'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProviderProps {
    children: React.ReactNode
    defaultValue: string
}

const TabsProvider = ({ children, defaultValue }: TabsProviderProps) => {
    const [value, setValue] = React.useState(defaultValue)
    return (
        <div className="w-full">
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                return React.cloneElement(child as React.ReactElement<{ activeValue?: string; onValueChange?: (val: string) => void }>, {
                    activeValue: value,
                    onValueChange: setValue
                })
            })}
        </div>
    )
}

interface TabsListLayoutProps {
    children: React.ReactNode
    activeValue?: string
    onValueChange?: (value: string) => void
    className?: string
}

const TabsListLayout = ({ children, activeValue, onValueChange, className }: TabsListLayoutProps) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-6", className)}>
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                const childProps = child.props as { value?: string }
                return React.cloneElement(child as React.ReactElement<{ isActive?: boolean; onClick?: () => void }>, {
                    isActive: childProps.value === activeValue,
                    onClick: () => onValueChange?.(childProps.value || '')
                })
            })}
        </div>
    )
}

interface TabTriggerProps {
    children: React.ReactNode
    value?: string
    isActive?: boolean
    onClick?: () => void
    className?: string
}

const TabTrigger = ({ children, isActive, onClick, className }: TabTriggerProps) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-background text-foreground shadow-sm" : "hover:text-foreground",
                className
            )}
        >
            {children}
        </button>
    )
}

interface TabContentProps {
    children: React.ReactNode
    value: string
    activeValue?: string
    className?: string
}

const TabContent = ({ children, value, activeValue, className }: TabContentProps) => {
    if (value !== activeValue) return null
    return (
        <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    )
}

export { TabsProvider, TabsListLayout, TabTrigger, TabContent }
