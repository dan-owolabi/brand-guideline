'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                return React.cloneElement(child as React.ReactElement<DropdownContextType>, { open, setOpen })
            })}
        </div>
    )
}

interface DropdownMenuTriggerProps {
    children: React.ReactNode
    asChild?: boolean
    open?: boolean
    setOpen?: (open: boolean) => void
    className?: string
}

const DropdownMenuTrigger = ({ children, asChild, open, setOpen, className }: DropdownMenuTriggerProps) => {
    const Comp = asChild ? "span" : "button"
    return (
        <Comp
            className={cn("cursor-pointer", className)}
            onClick={() => setOpen?.(!open)}
            aria-expanded={open}
        >
            {children}
        </Comp>
    )
}

interface DropdownMenuContentProps {
    children: React.ReactNode
    open?: boolean
    className?: string
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
}

const DropdownMenuContent = ({ children, open, className, align = "center" }: DropdownMenuContentProps) => {
    if (!open) return null

    const alignClass = {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0"
    }[align]

    return (
        <div
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                alignClass,
                "mt-2",
                className
            )}
            style={{ top: "100%" }}
        >
            {children}
        </div>
    )
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
    ({ className, inset, children, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-accent hover:text-accent-foreground",
                inset && "pl-8",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
)
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuLabel = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
    ({ className, inset, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
            {...props}
        />
    )
)
DropdownMenuLabel.displayName = "DropdownMenuLabel"

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("-mx-1 my-1 h-px bg-muted", className)}
            {...props}
        />
    )
)
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
}
