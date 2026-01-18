'use client'

import { use } from 'react'
import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper"

export default function Layout({
    children,
    params
}: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    // Next.js 16+ requires unwrapping params with React.use()
    const { id } = use(params)
    return (
        <AdminLayoutWrapper brandId={id}>
            {children}
        </AdminLayoutWrapper>
    )
}
