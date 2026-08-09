'use client'
import ClientOnly from '@/components/ClientOnly'
export default function MarketingLayout({ children }) {
    return <ClientOnly>{children}</ClientOnly>
}
