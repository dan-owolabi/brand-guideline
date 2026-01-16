import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Routes, Route } from 'react-router-dom'
import MigrationRunner from './MigrationRunner'
import BrandSettings from './BrandSettings'
import PagesEditor from './PagesEditor'
import {
    FileText,
    Eye,
    Menu as MenuIcon,
    ChevronRight,
    LayoutDashboard,
    Box,
    Share2,
    PlusCircle,
    MoreVertical,
    ChevronDown,
    Layout,
    Plus,
    Loader2,
    Upload,
    CheckCircle2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Separator } from '../ui/Separator'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Dialog, DialogContent, DialogFooter } from '../ui/Dialog'
import { useBrands } from '../../hooks/useBrands'
import { useBrandEditor } from '../../hooks/useBrandEditor'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '../ui/DropdownMenu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar'
import { ScrollArea } from '../ui/ScrollArea'
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet'
import { PublishModal } from '../ui/PublishModal'

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [newBrandModalOpen, setNewBrandModalOpen] = useState(false)
    const [newBrandName, setNewBrandName] = useState('')
    const [creating, setCreating] = useState(false)

    const location = useLocation()
    const navigate = useNavigate()
    const { brands, loading, createBrand, fetchBrands } = useBrands()

    // For this version, we'll assume the FIRST brand is selected if no specific one is chosen
    const [selectedBrandId, setSelectedBrandId] = useState(null)

    useEffect(() => {
        if (brands.length > 0 && !selectedBrandId) {
            setSelectedBrandId(brands[0].id)
        }
    }, [brands, selectedBrandId])

    const currentBrand = brands.find(b => b.id === selectedBrandId) || brands[0]

    // Publish functionality for the shared header
    const { publish, saving: publishing, brandMetadata } = useBrandEditor(currentBrand?.id)
    const [publishSuccess, setPublishSuccess] = useState(false)
    const [publishModalOpen, setPublishModalOpen] = useState(false)

    // Open modal
    const handlePublishClick = () => {
        setPublishModalOpen(true)
    }

    const handleConfirmPublish = async (slug) => {
        try {
            await publish({ slug })
            setPublishSuccess(true)
            setPublishModalOpen(false)
            setTimeout(() => setPublishSuccess(false), 3000)
        } catch (err) {
            alert('Failed to publish: ' + err.message)
        }
    }

    const handleCreateBrand = async (e) => {
        if (e) e.preventDefault()
        if (!newBrandName.trim()) return

        setCreating(true)
        try {
            const newBrand = await createBrand(newBrandName)
            setNewBrandName('')
            setNewBrandModalOpen(false)
            setSelectedBrandId(newBrand.id)
        } catch (err) {
            alert("Error creating brand: " + err.message)
        } finally {
            setCreating(false)
        }
    }

    const navGroups = [
        {
            label: "General",
            items: [
                { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
                { to: '/admin/editor', icon: Layout, label: 'Live Editor' },
                { to: '/admin/pages', icon: FileText, label: 'Pages & Content' },
                { to: '/admin/migrate', icon: Box, label: 'Upgrade Data' },
            ]
        }
    ]

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 bg-muted/40 border-r transition-all duration-300 z-50 flex flex-col hidden md:flex",
                    sidebarOpen ? "w-64" : "w-0 -translate-x-full overflow-hidden"
                )}
            >
                {/* Brand Switcher */}
                <div className="h-16 flex items-center px-4 border-b">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start px-2 gap-2 h-10 hover:bg-background">
                                <span className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border bg-primary text-primary-foreground font-bold text-xs"
                                )}>
                                    {currentBrand?.name?.[0] || 'N'}
                                </span>
                                <span className="font-bold truncate flex-1 text-left">{currentBrand?.name || 'Select Brand'}</span>
                                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                            <DropdownMenuLabel>Switch Brand</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {brands.map(b => (
                                <DropdownMenuItem key={b.id} onClick={() => setSelectedBrandId(b.id)}>
                                    <span className="flex h-4 w-4 items-center justify-center mr-2 rounded bg-primary/10 text-[10px] font-bold">
                                        {b.name[0]}
                                    </span>
                                    {b.name}
                                    {selectedBrandId === b.id && <Plus className="ml-auto h-3 w-3 rotate-45" />}
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setNewBrandModalOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Brand
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 px-3 py-4">
                    <div className="space-y-6">
                        {navGroups.map((group) => (
                            <div key={group.label} className="px-2">
                                <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="px-2">
                            <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Sections
                            </h3>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed">
                                    <Box className="h-4 w-4" />
                                    <span>Components</span>
                                    <Badge variant="outline" className="ml-auto text-[10px] h-5 px-1.5">Pro</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                {/* User Info */}
                <div className="p-4 border-t bg-background/50">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback>DA</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">Danny Admin</p>
                            <p className="text-xs text-muted-foreground truncate">admin@guidrr.com</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet>
                <SheetContent side="left" className="w-64 p-0">
                    {/* Same structure as desktop sidebar roughly */}
                    <div className="h-16 flex items-center px-4 border-b">
                        <img src="/guidr-logo.png" alt="Guidr" className="h-7" />
                    </div>
                    <ScrollArea className="flex-1 px-3 py-4">
                        {/* Simplified nav for mobile */}
                        {navGroups.map((group) => (
                            <div key={group.label} className="mb-6 px-2">
                                <h3 className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    {group.label}
                                </h3>
                                <div className="space-y-1">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.to}
                                            to={item.to}
                                            end={item.end}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div
                className={cn(
                    "flex-1 transition-all duration-300 flex flex-col min-h-screen",
                    sidebarOpen ? "md:ml-64" : "ml-0"
                )}
            >
                {/* Header */}
                <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden md:flex text-muted-foreground hover:text-foreground"
                        >
                            <MenuIcon className="h-5 w-5" />
                        </Button>
                        <SheetTrigger className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <MenuIcon className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>

                        <Separator orientation="vertical" className="h-6 hidden md:block" />

                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">CMS</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                            <span className="font-medium text-foreground capitalize">
                                {location.pathname.split('/').pop() || 'Overview'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="gap-2 h-9" asChild>
                            <a href="/#/introduction" target="_blank">
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Live Preview</span>
                            </a>
                        </Button>
                        <Button
                            size="sm"
                            className="gap-2 h-9 bg-emerald-600 hover:bg-emerald-700"
                            onClick={handlePublishClick}
                            disabled={publishing}
                        >
                            {publishSuccess ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    <span className="hidden sm:inline">Published!</span>
                                </>
                            ) : publishing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="hidden sm:inline">Publishing...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4" />
                                    <span className="hidden sm:inline">Publish</span>
                                </>
                            )}
                        </Button>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-10 max-w-6xl w-full mx-auto">
                    <Outlet context={{ currentBrand }} />
                </main>
            </div>

            {/* New Brand Modal */}
            <Dialog open={newBrandModalOpen} onOpenChange={setNewBrandModalOpen}>
                <DialogContent
                    title="New Brand Guideline"
                    description="Create a dedicated space for your brand assets and guidelines."
                    onClose={() => setNewBrandModalOpen(false)}
                >
                    <form onSubmit={handleCreateBrand} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="brand-name">Brand Name</Label>
                            <Input
                                id="brand-name"
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                                className="h-10"
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setNewBrandModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={creating || !newBrandName.trim()}>
                                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Create Brand
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <PublishModal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={handleConfirmPublish}
                // Fallback to name-based slug if not set
                initialSlug={brandMetadata?.slug || currentBrand?.slug || (currentBrand?.name ? currentBrand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '')}
                brandName={currentBrand?.name}
                isPublishing={publishing}
            />
        </div>
    )
}
