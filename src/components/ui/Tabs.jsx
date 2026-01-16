import * as React from "react"
import { cn } from "../../lib/utils"

const TabsProvider = ({ children, defaultValue }) => {
    const [value, setValue] = React.useState(defaultValue)
    return (
        <div className="w-full">
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                return React.cloneElement(child, { activeValue: value, onValueChange: setValue })
            })}
        </div>
    )
}

const TabsListLayout = ({ children, activeValue, onValueChange, className }) => {
    return (
        <div className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-6", className)}>
            {React.Children.map(children, child => {
                if (!React.isValidElement(child)) return child
                return React.cloneElement(child, {
                    isActive: child.props.value === activeValue,
                    onClick: () => onValueChange(child.props.value)
                })
            })}
        </div>
    )
}

const TabTrigger = ({ children, isActive, onClick, className }) => {
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

const TabContent = ({ children, value, activeValue, className }) => {
    if (value !== activeValue) return null
    return (
        <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
            {children}
        </div>
    )
}

export { TabsProvider, TabsListLayout, TabTrigger, TabContent }
