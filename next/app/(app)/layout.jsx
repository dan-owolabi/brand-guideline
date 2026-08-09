'use client'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientOnly from '@/components/ClientOnly'

export default function AppGroupLayout({ children }) {
    return (
        <AuthProvider>
            <ClientOnly>{children}</ClientOnly>
        </AuthProvider>
    )
}
