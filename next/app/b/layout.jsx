'use client'
import ClientOnly from '@/components/ClientOnly'
export default function PublicBrandLayout({ children }) {
    return <ClientOnly>{children}</ClientOnly>
}
