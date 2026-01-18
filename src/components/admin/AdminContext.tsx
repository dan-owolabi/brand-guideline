'use client'

import React, { createContext, useContext } from 'react'
import { Brand } from '@/hooks/useBrands'

interface AdminContextType {
    currentBrand: Brand | null
    loading: boolean
    isSidebarOpen: boolean
    toggleSidebar: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({
    children,
    value
}: {
    children: React.ReactNode
    value: AdminContextType
}) {
    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    )
}

export function useAdminContext() {
    const context = useContext(AdminContext)
    if (context === undefined) {
        throw new Error('useAdminContext must be used within an AdminProvider')
    }
    return context
}
