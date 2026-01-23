'use client'

// This layout removes the AdminLayoutWrapper sidebar for the builder pages
// The builder (BrandCanvas) has its own navigation

export default function BuilderLayout({
    children
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
