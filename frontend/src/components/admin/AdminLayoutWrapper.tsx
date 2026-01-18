'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    LayoutDashboard,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronLeft,
    ExternalLink,
    Loader2,
    Folder
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AdminProvider } from './AdminContext'
import { Brand } from '@/hooks/useBrands'

interface AdminLayoutWrapperProps {
    brandId: string
    children: React.ReactNode
}

export default function AdminLayoutWrapper({ brandId, children }: AdminLayoutWrapperProps) {
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        if (!brandId) return

        const fetchBrand = async () => {
            try {
                const { data, error } = await supabase
                    .from('brands')
                    .select('*')
                    .eq('id', brandId)
                    .single()

                if (error) throw error
                setCurrentBrand(data)
            } catch (err) {
                console.error('Error fetching brand:', err)
                // router.push('/admin') // Redirect if not found?
            } finally {
                setLoading(false)
            }
        }

        fetchBrand()
    }, [brandId, router])

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!currentBrand) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-900">Brand not found</h2>
                <Button onClick={() => router.push('/admin')} className="mt-4">
                    Back to Dashboard
                </Button>
            </div>
        )
    }

    const navItems = [
        {
            label: 'Content',
            icon: LayoutDashboard,
            path: `/admin/brand/${brandId}`,
            exact: true
        },
        {
            label: 'Pages',
            icon: FileText,
            path: `/admin/brand/${brandId}/pages`
        },
        {
            label: 'Assets',
            icon: Folder,
            path: `/admin/brand/${brandId}/assets`
        },
        {
            label: 'Settings',
            icon: Settings,
            path: `/admin/brand/${brandId}/settings`
        }
    ]

    return (
        <AdminProvider value={{ currentBrand, loading, isSidebarOpen, toggleSidebar }}>
            <div className="flex min-h-screen bg-gray-50">
                {/* Mobile Sidebar Overlay */}
                {!isSidebarOpen && (
                    <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={toggleSidebar} />
                )}

                {/* Sidebar */}
                <aside
                    className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-100 transition-all duration-300 z-30 flex flex-col ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
                        }`}
                >
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
                        <Link href="/admin" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                            <ChevronLeft size={18} />
                            {isSidebarOpen && <span className="font-medium text-sm">Dashboard</span>}
                        </Link>
                    </div>

                    {/* Brand Info */}
                    <div className="p-6 border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                {currentBrand.logo_url ? (
                                    <img src={currentBrand.logo_url} alt={currentBrand.name} className="w-6 h-6 object-contain" />
                                ) : (
                                    <span className="text-lg font-bold text-indigo-600">
                                        {currentBrand.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            {isSidebarOpen && (
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-bold text-gray-900 truncate">{currentBrand.name}</h2>
                                    <div className="flex items-center gap-1 text-xs text-green-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        <span>Full Access</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            const isActive = item.exact
                                ? pathname === item.path
                                : pathname?.startsWith(item.path)

                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <item.icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                                    {isSidebarOpen && <span>{item.label}</span>}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 shrink-0">
                        {currentBrand.published && (
                            <a
                                href={`/b/${currentBrand.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 mb-2 transition-colors`}
                            >
                                <ExternalLink size={20} className="text-gray-400" />
                                {isSidebarOpen && <span>View Live Site</span>}
                            </a>
                        )}
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut size={20} />
                            {isSidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-0' : 'lg:ml-0'
                    }`}>
                    {/* Topbar (Mobile Toggle) */}
                    <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4 shrink-0 lg:hidden">
                        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                            <Menu size={20} />
                        </Button>
                        <span className="ml-4 font-bold text-gray-900">{currentBrand.name}</span>
                    </div>

                    {/* Page Content */}
                    <div className="flex-1 overflow-hidden relative">
                        {children}
                    </div>
                </main>
            </div>
        </AdminProvider>
    )
}
