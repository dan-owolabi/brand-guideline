'use client'

import BrandCanvas from '@/components/BrandCanvas'

export default function BrandEditorPage({ params }: { params: { id: string; slug: string } }) {
    // Determine active slug from params or default to 'introduction' if not present
    // Note: This file is [slug]/page.tsx so slug should be present.

    return (
        <div className="h-[calc(100vh-theme(spacing.16))]">
            <BrandCanvas isAdmin={true} basePath={`/admin/brand/${params.id}`} />
        </div>
    )
}
