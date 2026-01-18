'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface SheetContextType {
    open: boolean
    setOpen: (open: boolean) => void
}

const Sheet = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <>
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                return React.cloneElement(child as React.ReactElement<SheetContextType>, { open, setOpen })
            })}
        </>
    )
}

interface SheetTriggerProps {
    children: React.ReactNode
    asChild?: boolean
    setOpen?: (open: boolean) => void
    className?: string
}

const SheetTrigger = ({ children, asChild, setOpen, className }: SheetTriggerProps) => {
    const Comp = asChild ? "span" : "button"
    return (
        <Comp
            className={cn("cursor-pointer", className)}
            onClick={() => setOpen?.(true)}
        >
            {children}
        </Comp>
    )
}

interface SheetContentProps {
    children: React.ReactNode
    open?: boolean
    setOpen?: (open: boolean) => void
    side?: 'left' | 'right' | 'top' | 'bottom'
    className?: string
}

const SheetContent = ({ children, open, setOpen, side = "left", className }: SheetContentProps) => {
    const sheetRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (open && sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
                setOpen?.(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [open, setOpen])

    if (!open) return null

    const sideClasses = {
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <div
                ref={sheetRef}
                className={cn(
                    "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out duration-300",
                    sideClasses[side],
                    className
                )}
                data-state={open ? "open" : "closed"}
            >
                <button
                    onClick={() => setOpen?.(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>
    )
}

export { Sheet, SheetTrigger, SheetContent }
