export default function BrandLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-white">
            {children}
        </div>
    )
}
