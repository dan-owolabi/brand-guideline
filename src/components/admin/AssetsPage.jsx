import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import {
    Upload, Trash2, Download, Search,
    Check, X, Loader2, FileText, FileImage,
    FileArchive, Palette, Type as FontIcon, Paperclip,
    Image as ImageIcon, Plus, MoreVertical, GripVertical,
    LayoutGrid, List, Copy, Folder, ChevronRight, ArrowLeft, Home
} from 'lucide-react'
import FolderAssetCard from './FolderAssetCard'
import { supabase, uploadFile, deleteFile } from '../../lib/supabase'
import Header from '../Header'
import { useBrandEditor } from '../../hooks/useBrandEditor'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import { ConfirmModal, InputModal } from '../ui/ConfirmModal'
import { PublishModal } from '../ui/PublishModal'

// File type detection
const FILE_CATEGORIES = {
    image: { extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico'], icon: FileImage, color: 'text-blue-500', bg: 'bg-blue-50' },
    document: { extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'ppt', 'pptx'], icon: FileText, color: 'text-red-500', bg: 'bg-red-50' },
    archive: { extensions: ['zip', 'rar', '7z', 'tar', 'gz'], icon: FileArchive, color: 'text-amber-500', bg: 'bg-amber-50' },
    design: { extensions: ['ai', 'psd', 'fig', 'sketch', 'xd', 'eps'], icon: Palette, color: 'text-purple-500', bg: 'bg-purple-50' },
    font: { extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot'], icon: FontIcon, color: 'text-green-500', bg: 'bg-green-50' },
}

function getFileCategory(filename) {
    const ext = filename?.split('.').pop()?.toLowerCase() || ''
    for (const [category, config] of Object.entries(FILE_CATEGORIES)) {
        if (config.extensions.includes(ext)) {
            return { category, ...config }
        }
    }
    return { category: 'other', icon: Paperclip, color: 'text-gray-500', bg: 'bg-gray-50' }
}

function formatFileSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function downloadFile(url, filename) {
    try {
        const response = await fetch(url)
        const blob = await response.blob()
        saveAs(blob, filename)
    } catch (error) {
        console.error('Download failed', error)
        window.open(url, '_blank')
    }
}

export default function AssetsPage({ isAdmin = true, brandSlug = null, basePath = undefined }) {
    const navigate = useNavigate()
    const { brandId, slug } = useParams()
    // Identifier is either UUID (brandId), Slug from params, or passed prop
    const identifier = brandSlug || slug || brandId

    const [brand, setBrand] = useState(null)
    const [assets, setAssets] = useState([])
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState([])
    const [downloading, setDownloading] = useState(false)
    const [dragOverSection, setDragOverSection] = useState(null) // section ID or 'uncategorized'

    // Publish functionality
    const { publish, saving: publishing, brandMetadata } = useBrandEditor(identifier)
    const [publishSuccess, setPublishSuccess] = useState(false)
    const [publishModalOpen, setPublishModalOpen] = useState(false)

    // Open modal instead of publishing directly
    const handlePublishClick = () => {
        setPublishModalOpen(true)
    }

    const handleConfirmPublish = async (slug, mode) => {
        try {
            await publish({ slug, mode })
            setPublishSuccess(true)
            setPublishModalOpen(false)
            setTimeout(() => setPublishSuccess(false), 3000)
        } catch (err) {
            alert('Failed to publish: ' + err.message)
        }
    }

    // Page title and description (editable in admin)
    const [pageTitle, setPageTitle] = useState('Brand Assets')
    const [pageDescription, setPageDescription] = useState('Download official logos, fonts, and brand resources')

    // View mode: 'grid' or 'table'
    const [viewMode, setViewMode] = useState('grid')

    // Section management
    const [isAddingSection, setIsAddingSection] = useState(false)
    const [newSectionName, setNewSectionName] = useState('')
    const [uploadToSection, setUploadToSection] = useState(null)
    const [editingSectionId, setEditingSectionId] = useState(null)
    const [editingSectionName, setEditingSectionName] = useState('')

    const [previewAsset, setPreviewAsset] = useState(null)

    const fileInputRef = useRef(null)
    const bannerInputRef = useRef(null)
    const [currentFolderId, setCurrentFolderId] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({ open: false })

    // Input modal state (for folder name, etc.)
    const [inputModal, setInputModal] = useState({ open: false })

    // DnD sensors for section reordering
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        fetchData()
    }, [identifier])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Resolve Brand first (handle slug or ID)
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)
            let brandQuery = supabase.from('brands').select('id, name, logo_url, primary_color, banner_url, published')

            if (isUuid) {
                brandQuery = brandQuery.eq('id', identifier)
            } else {
                brandQuery = brandQuery.eq('slug', identifier)
            }

            const { data: brandData, error: brandError } = await brandQuery.single()
            if (brandError) throw brandError

            setBrand({ ...brandData, publishMode: brandData.published?.publishMode || 'both' })
            const resolvedId = brandData.id

            // 2. Fetch Assets and Sections using resolved UUID
            const [sectionsResult, assetsResult] = await Promise.all([
                supabase.from('collections').select('*').eq('brand_id', resolvedId).order('order', { ascending: true }),
                supabase.from('assets').select('*').eq('brand_id', resolvedId).order('created_at', { ascending: false })
            ])

            const rawSections = sectionsResult.data || []
            const rawAssets = assetsResult.data || []

            // Auto-migrate any uncategorized assets to a real "Other Files" section
            const uncategorizedAssets = rawAssets.filter(a => !a.collection_id)
            if (uncategorizedAssets.length > 0) {
                // Check if an "Other Files" section exists, else create one
                let otherFilesSection = rawSections.find(s => s.name === 'Other Files')
                if (!otherFilesSection) {
                    const newSection = {
                        id: crypto.randomUUID(),
                        brand_id: resolvedId,
                        name: 'Other Files',
                        order: rawSections.length
                    }
                    // Insert to DB silently
                    supabase.from('collections').insert(newSection).then(({ error }) => {
                        if (error) console.error('Failed to create Other Files section', error)
                    })
                    otherFilesSection = newSection
                    rawSections.push(otherFilesSection)
                }

                // Update assets to belong to this section in DB silently
                const assetIds = uncategorizedAssets.map(a => a.id)
                supabase.from('assets')
                    .update({ collection_id: otherFilesSection.id })
                    .in('id', assetIds)
                    .then(({ error }) => {
                        if (error) console.error('Failed to migrate uncategorized assets', error)
                    })

                // Update local state
                uncategorizedAssets.forEach(a => a.collection_id = otherFilesSection.id)
            }

            setSections(rawSections)
            setAssets(rawAssets)
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setLoading(false)
        }
    }

    // Enforce publishMode rules for public users
    if (!isAdmin && brand && brand.publishMode === 'guidelines') {
        const publicBasePath = basePath !== undefined ? basePath : `/brand/${brand.slug || identifier}`
        // Use window.location.replace or Navigate
        // We will just return a redirect component
        return <Navigate to={publicBasePath !== '' ? publicBasePath : '/'} replace />
    }

    // File drag & drop handlers (OS files dragged onto sections)
    const handleFileDragOver = (e, sectionId) => {
        e.preventDefault()
        e.stopPropagation()
        if (dragOverSection !== sectionId) setDragOverSection(sectionId)
    }

    const handleFileDragLeave = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverSection(null)
        }
    }

    const handleFileDrop = (e, sectionId = null) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOverSection(null)
        const files = Array.from(e.dataTransfer.files)
        if (files.length > 0) {
            setUploadToSection(sectionId)
            handleUpload(files, sectionId)
        }
    }

    const handleBannerUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            const url = await uploadFile(file, 'media')
            await supabase.from('brands').update({ banner_url: url }).eq('id', brand.id)
            setBrand(prev => ({ ...prev, banner_url: url }))
        } catch (err) {
            console.error('Banner upload failed:', err)
        }
    }

    // Handle section drag end for reordering
    const handleDragEnd = async (event) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            const oldIndex = sections.findIndex(s => s.id === active.id)
            const newIndex = sections.findIndex(s => s.id === over.id)
            const newSections = arrayMove(sections, oldIndex, newIndex)

            // Optimistic update
            setSections(newSections)

            // Persist order to database
            for (let i = 0; i < newSections.length; i++) {
                await supabase.from('collections').update({ order: i }).eq('id', newSections[i].id)
            }
        }
    }

    const handleCreateSection = async () => {
        if (!newSectionName.trim()) return
        try {
            const newSection = {
                id: crypto.randomUUID(),
                brand_id: brand.id,
                name: newSectionName.trim(),
                order: sections.length
            }

            // Optimistic update
            setSections(prev => [...prev, newSection])
            setNewSectionName('')
            setIsAddingSection(false)

            // Persist to database
            const { error } = await supabase.from('collections').insert(newSection)
            if (error) {
                // Rollback on error
                setSections(prev => prev.filter(s => s.id !== newSection.id))
                throw error
            }
        } catch (err) {
            console.error('Failed to create section:', err)
        }
    }

    const handleCopySection = async (sectionId) => {
        const section = sections.find(s => s.id === sectionId)
        if (!section) return

        const newSection = {
            id: crypto.randomUUID(),
            brand_id: brand.id,
            name: `${section.name} (copy)`,
            order: sections.length
        }

        // Optimistic update
        setSections(prev => [...prev, newSection])

        // Persist to database
        const { error } = await supabase.from('collections').insert(newSection)
        if (error) {
            setSections(prev => prev.filter(s => s.id !== newSection.id))
            console.error('Failed to copy section:', err)
            return
        }

        // Copy assets from original section to new section
        // Copy assets from original section to new section with hierarchy preservation
        const sectionAssets = assets.filter(a => a.collection_id === sectionId)
        const idMap = new Map()
        const newAssets = []

        // 1. Generate new IDs for all assets first
        sectionAssets.forEach(asset => {
            idMap.set(asset.id, crypto.randomUUID())
        })

        // 2. Create new asset objects with updated references
        for (const asset of sectionAssets) {
            const newId = idMap.get(asset.id)
            const newParentId = asset.parent_id ? idMap.get(asset.parent_id) : null

            // If parent exists but wasn't mapped (e.g. parent outside section?), fallback to null (top level)
            // ideally all children in a section have parents in the same section or are top level.

            const newAsset = {
                ...asset,
                id: newId,
                collection_id: newSection.id,
                parent_id: newParentId || null, // Ensure files inside folders point to the NEW folder
                created_at: new Date().toISOString()
            }
            newAssets.push(newAsset)
        }

        setAssets(prev => [...prev, ...newAssets])

        // Batch insert for performance
        const { error: copyError } = await supabase.from('assets').insert(newAssets)
        if (copyError) {
            console.error('Failed to copy assets:', copyError)
            // simplified rollback (could be better)
            setAssets(prev => prev.filter(a => a.collection_id !== newSection.id))
        }
    }

    const handleDeleteSection = async (sectionId) => {
        setConfirmModal({
            open: true,
            title: 'Delete section?',
            message: 'Files will be moved to Uncategorized. This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                // Optimistic update - move assets to uncategorized
                setAssets(prev => prev.map(a =>
                    a.collection_id === sectionId ? { ...a, collection_id: null } : a
                ))
                setSections(prev => prev.filter(s => s.id !== sectionId))

                // Persist to database
                await supabase.from('assets').update({ collection_id: null }).eq('collection_id', sectionId)
                await supabase.from('collections').delete().eq('id', sectionId)
            }
        })
    }

    // Breadcrumbs helper
    const getBreadcrumbs = () => {
        if (!currentFolderId) return []
        const path = []
        let current = assets.find(a => a.id === currentFolderId)
        while (current) {
            path.unshift(current)
            if (current.parent_id) {
                current = assets.find(a => a.id === current.parent_id)
            } else {
                current = null
            }
        }
        return path
    }

    const handleUpload = async (files, sectionId = null) => {
        if (files.length === 0) return
        setUploading(true)

        console.log('[Upload Debug] Starting upload:', {
            fileCount: files.length,
            sectionId,
            currentFolderId,
            hasWebkitPath: files[0]?.webkitRelativePath ? true : false,
            firstFilePath: files[0]?.webkitRelativePath || 'none'
        })

        // Determine root context
        const rootParentId = currentFolderId
        const effectiveSectionId = sectionId || (rootParentId ? assets.find(a => a.id === rootParentId)?.collection_id : null)

        // Map to track created folders in this session: "path/to/folder" -> uuid
        const sessionFolders = new Map()

        // Helper to get or create folder asset
        const ensureFolder = async (path, parentId) => {
            if (sessionFolders.has(path)) return sessionFolders.get(path)

            // Check if already exists in assets (optimistic check)
            const folderName = path.split('/').pop()
            // Check existing assets in current context
            const existing = assets.find(a =>
                a.name === folderName &&
                a.is_folder &&
                a.parent_id === parentId &&
                a.collection_id === effectiveSectionId
            )

            if (existing) {
                sessionFolders.set(path, existing.id)
                return existing.id
            }

            // Create new folder
            const newId = crypto.randomUUID()
            const newFolder = {
                id: newId,
                brand_id: brand.id,
                name: folderName,
                is_folder: true,
                parent_id: parentId,
                collection_id: effectiveSectionId,
                created_at: new Date().toISOString()
            }

            // Optimistic update
            setAssets(prev => [...prev, newFolder])
            sessionFolders.set(path, newId)

            console.log('[Upload Debug] Created folder:', { name: folderName, id: newId, parentId, path })

            // Persist (await to ensure folder exists before children are inserted)
            const { error } = await supabase.from('assets').insert(newFolder)
            if (error) {
                console.error('[Upload Debug] Folder insert error:', error)
                // Remove optimistic folder since it failed
                setAssets(prev => prev.filter(a => a.id !== newId))
                throw new Error(`Failed to create folder "${folderName}": ${error.message}`)
            }
            return newId
        }

        try {
            // Process files
            for (const file of files) {
                let parentId = rootParentId

                // If file has relative path (webkitdirectory), handle folders
                if (file.webkitRelativePath) {
                    const parts = file.webkitRelativePath.split('/')
                    // parts: ["folder", "sub", "file.png"]
                    // Remove filename
                    const folderParts = parts.slice(0, -1)

                    // Traverse/Create folders
                    let currentPath = ""
                    for (const part of folderParts) {
                        currentPath = currentPath ? `${currentPath}/${part}` : part
                        parentId = await ensureFolder(currentPath, parentId)
                    }
                }

                // Upload File
                const tempId = `upload-${Date.now()}-${Math.random()}`

                console.log('[Upload Debug] Uploading file:', {
                    name: file.name,
                    parentId,
                    sectionId: effectiveSectionId,
                    webkitPath: file.webkitRelativePath || 'none'
                })

                // Optimistic file placeholder
                setAssets(prev => [...prev, {
                    id: tempId,
                    name: file.name,
                    isUploading: true,
                    collection_id: effectiveSectionId,
                    parent_id: parentId,
                    brand_id: brand.id
                }])

                uploadFile(file, 'media').then(async (url) => {
                    const isImage = file.type.startsWith('image/')
                    const { category } = getFileCategory(file.name)

                    const { data: newAsset, error } = await supabase.from('assets').insert({
                        brand_id: brand.id,
                        name: file.name,
                        file_url: url,
                        thumbnail_url: isImage ? url : null,
                        file_type: file.type,
                        file_size: file.size,
                        category,
                        collection_id: effectiveSectionId,
                        parent_id: parentId
                    }).select().single()

                    if (newAsset) {
                        setAssets(prev => prev.map(a => a.id === tempId ? newAsset : a))
                    }
                }).catch(err => {
                    console.error('File upload failed', err)
                    setAssets(prev => prev.filter(a => a.id !== tempId))
                    alert(`File upload failed: ${err?.message || err}\n\nIf columns are missing, run the migration in your Supabase SQL Editor.`)
                })
            }
        } catch (err) {
            console.error('Upload batch failed', err)
            alert(`Upload failed: ${err?.message || err}`)
        } finally {
            setUploading(false)
            setUploadToSection(null)
        }
    }

    const handleDelete = (assetId) => {
        const asset = assets.find(a => a.id === assetId)
        const isFolder = asset?.is_folder

        setConfirmModal({
            open: true,
            title: isFolder ? 'Delete folder?' : 'Delete file?',
            message: isFolder
                ? 'This will delete the folder and all files inside it. This action cannot be undone.'
                : 'This action cannot be undone.',
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
                let assetsToDelete = [asset]

                if (isFolder) {
                    // Find all nested children recursively
                    const findChildren = (parentId) => {
                        const children = assets.filter(a => a.parent_id === parentId)
                        let all = [...children]
                        children.forEach(child => {
                            if (child.is_folder) {
                                all = [...all, ...findChildren(child.id)]
                            }
                        })
                        return all
                    }
                    assetsToDelete = [...assetsToDelete, ...findChildren(assetId)]
                }

                // Optimistic update: remove the folder/asset and all its nested children
                const idsToDelete = new Set(assetsToDelete.map(a => a.id))
                setAssets(prev => prev.filter(a => !idsToDelete.has(a.id)))

                // Delete physical files from storage
                const fileAssets = assetsToDelete.filter(a => !a.is_folder && a.file_url)
                for (const fileAsset of fileAssets) {
                    try {
                        await deleteFile(fileAsset.file_url, 'media')
                    } catch (e) {
                        console.log(`Could not delete file ${fileAsset.name} from storage`)
                    }
                }

                // Delete records from database
                try {
                    // Supabase will delete children if ON DELETE CASCADE is set up correctly, 
                    // but just in case, we send an IN query for all the IDs we found.
                    const idsArray = Array.from(idsToDelete)
                    await supabase.from('assets').delete().in('id', idsArray)
                } catch (err) {
                    console.error('Failed to delete asset records:', err)
                    // If deletion failed, we ideally should revert the optimistic UI update
                    // We can just trigger a reload or leave it for now
                }
            }
        })
    }

    // Helper to process items recursively for ZIP
    const processItemsForZip = async (zipFolder, items) => {
        await Promise.all(items.map(async (item) => {
            if (item.is_folder) {
                const subFolder = zipFolder.folder(item.name)
                const children = assets.filter(a => a.parent_id === item.id && !a.isUploading)
                await processItemsForZip(subFolder, children)
            } else {
                try {
                    const response = await fetch(item.file_url)
                    const blob = await response.blob()
                    zipFolder.file(item.name, blob)
                } catch (e) {
                    console.log(`Failed to add ${item.name} to ZIP`)
                }
            }
        }))
    }

    const handleDownloadAll = async () => {
        if (assets.length === 0) return
        setDownloading(true)

        try {
            const zip = new JSZip()

            // Group assets by section (only roots of that section)
            for (const section of sections) {
                const sectionRootAssets = assets.filter(a => a.collection_id === section.id && !a.parent_id && !a.isUploading)
                if (sectionRootAssets.length > 0) {
                    const folder = zip.folder(section.name || 'Uncategorized')
                    await processItemsForZip(folder, sectionRootAssets)
                }
            }

            // Add uncategorized assets (roots only)
            const uncategorizedRoots = assets.filter(a => !a.collection_id && !a.parent_id && !a.isUploading)
            if (uncategorizedRoots.length > 0) {
                const folder = zip.folder('Uncategorized')
                await processItemsForZip(folder, uncategorizedRoots)
            }

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `${brand?.name || 'brand'}-assets.zip`)
        } catch (e) {
            console.error('Failed to create ZIP:', e)
            alert('Failed to download assets')
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadSection = async (sectionId) => {
        setDownloading(true)
        try {
            const section = sections.find(s => s.id === sectionId)
            const rootAssets = assets.filter(a => a.collection_id === sectionId && !a.parent_id && !a.isUploading)

            const zip = new JSZip()
            await processItemsForZip(zip, rootAssets)

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `${section?.name || 'section'}.zip`)
        } catch (e) {
            console.error('Failed to download section:', e)
            alert('Failed to download section')
        } finally {
            setDownloading(false)
        }
    }

    const handleDownloadFolder = async (folderId) => {
        setDownloading(true)
        try {
            const folderAsset = assets.find(a => a.id === folderId)
            const children = assets.filter(a => a.parent_id === folderId && !a.isUploading)

            const zip = new JSZip()
            await processItemsForZip(zip, children)

            const content = await zip.generateAsync({ type: 'blob' })
            saveAs(content, `${folderAsset?.name || 'folder'}.zip`)
        } catch (e) {
            console.error('Failed to download folder:', e)
            alert('Failed to download folder')
        } finally {
            setDownloading(false)
        }
    }

    const handleMoveAsset = async (assetId, newSectionId) => {
        // Helper to find all descendants for recursive update
        const getDescendants = (parentId) => {
            const children = assets.filter(a => a.parent_id === parentId)
            let descendants = [...children]
            children.forEach(child => {
                descendants = [...descendants, ...getDescendants(child.id)]
            })
            return descendants
        }

        const descendants = getDescendants(assetId)
        const allIdsToUpdate = [assetId, ...descendants.map(d => d.id)]

        // Optimistic update
        setAssets(prev => prev.map(a =>
            allIdsToUpdate.includes(a.id) ? { ...a, collection_id: newSectionId } : a
        ))

        // Persist to database
        await supabase.from('assets').update({ collection_id: newSectionId }).in('id', allIdsToUpdate)
    }

    const handleAddTextBlock = async (sectionId, variant = 'heading') => {
        const tempId = `text-${Date.now()}`
        const defaultText = variant === 'heading' ? 'New Heading' : 'Add description here...'
        const textBlock = {
            id: tempId,
            brand_id: brand.id,
            name: defaultText,
            description: defaultText,
            category: 'text',
            file_type: `text/${variant}`,
            file_url: 'text-block', // Placeholder to satisfy NOT NULL
            collection_id: sectionId,
            isNew: true
        }

        // Optimistic update
        setAssets(prev => [...prev, textBlock])

        try {
            // Save to database
            const { data: newAsset, error } = await supabase.from('assets').insert({
                brand_id: brand.id,
                name: defaultText,
                description: defaultText,
                category: 'text',
                file_type: `text/${variant}`,
                file_url: 'text-block',
                collection_id: sectionId
            }).select().single()

            if (error) throw error

            // Replace temp with real asset
            setAssets(prev => prev.map(a => a.id === tempId ? newAsset : a))
        } catch (err) {
            console.error('Failed to add text block:', err)
            // Remove failed block
            setAssets(prev => prev.filter(a => a.id !== tempId))
        }
    }

    const handleUpdateTextBlock = async (assetId, newText) => {
        // Optimistic update
        setAssets(prev => prev.map(a =>
            a.id === assetId ? { ...a, name: newText, description: newText } : a
        ))

        // Persist
        await supabase.from('assets').update({ name: newText, description: newText }).eq('id', assetId)
    }

    // Create new empty folders (supports multiple names separated by comma or newline)
    const handleCreateFolder = (sectionId = null, parentId = null) => {
        setInputModal({
            open: true,
            title: 'Create new folder(s)',
            placeholder: 'Folder names (separate multiple with commas or new lines)',
            defaultValue: 'New Folder',
            submitText: 'Create',
            multiline: true,
            onSubmit: async (input) => {
                // Split by comma or newline and trim each name
                const folderNames = input
                    .split(/[,\n]/)
                    .map(name => name.trim())
                    .filter(name => name.length > 0)

                if (folderNames.length === 0) return

                const effectiveSectionId = sectionId || (parentId ? assets.find(a => a.id === parentId)?.collection_id : null)

                // Create all folders
                for (const folderName of folderNames) {
                    const tempId = `folder-${Date.now()}-${Math.random()}`

                    const newFolder = {
                        id: tempId,
                        brand_id: brand.id,
                        name: folderName,
                        is_folder: true,
                        parent_id: parentId,
                        collection_id: effectiveSectionId,
                        created_at: new Date().toISOString()
                    }

                    // Optimistic update
                    setAssets(prev => [...prev, newFolder])

                    try {
                        const { data, error } = await supabase.from('assets').insert({
                            brand_id: brand.id,
                            name: folderName,
                            is_folder: true,
                            parent_id: parentId,
                            collection_id: effectiveSectionId
                        }).select().single()

                        if (error) throw error

                        // Replace temp with real
                        setAssets(prev => prev.map(a => a.id === tempId ? data : a))
                    } catch (err) {
                        console.error('Failed to create folder:', err)
                        setAssets(prev => prev.filter(a => a.id !== tempId))
                        alert(`Failed to create folder "${folderName}". Make sure the database schema is updated.`)
                    }
                }
            }
        })
    }


    // Get assets for a section
    // Get assets for a section
    const getAssetsForSection = (sectionId) => {
        return assets.filter(a =>
            a.collection_id === sectionId &&
            !a.parent_id &&
            a.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    // Get uncategorized assets (exclude nested files)
    const uncategorizedAssets = assets.filter(a =>
        !a.collection_id &&
        !a.parent_id &&
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50">
                {/* Skeleton header */}
                <div className="h-16 bg-white border-b border-gray-100" />

                {/* Skeleton content */}
                <div className="mt-36 px-8 pt-8 max-w-5xl mx-auto">
                    <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-8" />

                    {/* Skeleton banner */}
                    <div className="h-48 bg-gray-200 rounded-2xl animate-pulse mb-12" />

                    {/* Skeleton sections */}
                    <div className="space-y-8">
                        {[1, 2].map(i => (
                            <div key={i}>
                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4" />
                                <div className="grid grid-cols-3 gap-4">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header
                brand={brand}
                isAdmin={isAdmin}
                onPublish={handlePublishClick}
                isPublishing={publishing}
                publishSuccess={publishSuccess}
                basePath={basePath}
                publishMode={isAdmin ? undefined : brand?.publishMode}
            />

            {/* Hero Banner - Hidden when browsing a folder */}
            {!currentFolderId && (
                <div className="mt-24 md:mt-36 px-4 md:px-8 pt-4 md:pt-8 max-w-5xl mx-auto">
                    {/* Title - Editable in admin */}
                    <div className="mb-6">
                        <h1
                            contentEditable={isAdmin}
                            suppressContentEditableWarning
                            onBlur={(e) => setPageTitle(e.currentTarget.textContent)}
                            className={`text-3xl font-semibold text-gray-900 tracking-tight outline-none ${isAdmin ? 'hover:bg-gray-100 rounded px-1 -mx-1' : ''}`}
                        >
                            {pageTitle}
                        </h1>
                        <p
                            contentEditable={isAdmin}
                            suppressContentEditableWarning
                            onBlur={(e) => setPageDescription(e.currentTarget.textContent)}
                            className={`text-gray-500 mt-2 outline-none ${isAdmin ? 'hover:bg-gray-100 rounded px-1 -mx-1' : ''}`}
                        >
                            {pageDescription}
                        </p>
                    </div>

                    {/* Banner Image */}
                    <div className="relative w-full h-[280px] group bg-gray-900 rounded-2xl overflow-hidden shadow-lg">
                        <div
                            className="absolute inset-0"
                            style={{ backgroundColor: brand?.primary_color || '#111827' }}
                        >
                            {brand?.banner_url ? (
                                <img
                                    src={brand.banner_url}
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src="/assets-banner.png"
                                    alt="Banner"
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                            )}
                        </div>

                        {/* Change Cover Button - Admin Only */}
                        {isAdmin && (
                            <button
                                onClick={() => bannerInputRef.current?.click()}
                                className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-black/40 text-white/90 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-all hover:bg-black/60 backdrop-blur-sm z-10"
                            >
                                <ImageIcon size={16} />
                                Change Cover
                            </button>
                        )}

                        {/* Download All Button */}
                        <button
                            onClick={handleDownloadAll}
                            disabled={downloading || assets.filter(a => !a.isUploading).length === 0}
                            className={`absolute bottom-4 right-4 flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-all shadow-lg z-10 disabled:cursor-not-allowed ${downloading ? 'opacity-100' : 'disabled:opacity-50'}`}
                        >
                            {downloading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Download size={18} />
                            )}
                            {downloading ? 'Downloading...' : 'Download All'}
                        </button>

                        <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBannerUpload}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className={`max-w-5xl mx-auto px-8 pb-24 space-y-6 ${currentFolderId ? 'pt-36 md:pt-44' : 'pt-8'}`}>

                {/* View Mode Toggle + Upload Controls */}
                {!currentFolderId && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                        <div className="flex items-center gap-4 flex-1">
                            <h2 className="text-lg font-medium text-gray-900 shrink-0">Files</h2>
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search files..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => {
                                            setUploadToSection(null)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.removeAttribute('webkitdirectory')
                                                fileInputRef.current.click()
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors shadow-sm cursor-pointer"
                                    >
                                        <Upload size={14} />
                                        Upload Files
                                    </button>
                                    <button
                                        onClick={() => {
                                            setUploadToSection(null)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('webkitdirectory', '')
                                                fileInputRef.current.click()
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Folder size={14} />
                                        Upload Folder
                                    </button>
                                    <button
                                        onClick={() => handleCreateFolder(null, null)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                                    >
                                        <Plus size={14} />
                                        New Folder
                                    </button>
                                </>
                            )}
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sections */}
                {/* Folder View or Sections View */}
                {currentFolderId ? (
                    <div className="space-y-6">
                        {/* Breadcrumbs Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-24 md:top-32 bg-gray-50/95 backdrop-blur py-4 -my-4 z-40 transition-all">
                            <div className="flex items-center flex-1 gap-4 min-w-0">
                                <button
                                    onClick={() => {
                                        const currentAsset = assets.find(a => a.id === currentFolderId)
                                        setCurrentFolderId(currentAsset?.parent_id || null)
                                    }}
                                    className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
                                    title="Back"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm shrink-0 overflow-x-auto max-w-[50%] md:max-w-none">
                                    <button onClick={() => setCurrentFolderId(null)} className="hover:text-gray-900 flex items-center gap-1 transition-colors">
                                        <Home size={14} /> <span className="hidden md:inline">Home</span>
                                    </button>
                                    {getBreadcrumbs().slice(0, -1).map((b, i) => (
                                        <span key={b.id} className="flex items-center gap-2 shrink-0">
                                            <ChevronRight size={14} className="text-gray-300" />
                                            <button onClick={() => setCurrentFolderId(b.id)} className="hover:text-gray-900 font-medium transition-colors whitespace-nowrap">
                                                {b.name}
                                            </button>
                                        </span>
                                    ))}
                                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                    <span className="text-gray-900 truncate">{assets.find(a => a.id === currentFolderId)?.name}</span>
                                </div>
                                {/* Search in folder */}
                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search in folder..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                                    />
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 shrink-0">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('table')}
                                        className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <List size={16} />
                                    </button>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                            setUploadToSection(sectionId)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.removeAttribute('webkitdirectory')
                                                fileInputRef.current.click()
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors shadow-sm"
                                    >
                                        <Upload size={14} />
                                        Add Files
                                    </button>
                                    <button
                                        onClick={() => {
                                            const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                            setUploadToSection(sectionId)
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('webkitdirectory', '')
                                                fileInputRef.current.click()
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Folder size={14} />
                                        Upload Folder
                                    </button>
                                    <button
                                        onClick={() => {
                                            const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                            handleCreateFolder(sectionId, currentFolderId)
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Folder size={14} />
                                        New Folder
                                    </button>
                                </div>
                            )}
                        </div>


                        {/* Folder Assets Grid */}
                        <div className={`mt-6 ${viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 gap-4" : "space-y-2"}`}>
                            {assets.filter(a =>
                                a.parent_id === currentFolderId &&
                                a.name.toLowerCase().includes(searchQuery.toLowerCase())
                            ).map(asset => (
                                asset.is_folder ? (
                                    <FolderAssetCard
                                        key={asset.id}
                                        asset={asset}
                                        isAdmin={isAdmin}
                                        onEnter={setCurrentFolderId}
                                        onDelete={() => handleDelete(asset.id)}
                                        onRename={handleUpdateTextBlock}
                                        onMove={(sid) => handleMoveAsset(asset.id, sid)}
                                    />
                                ) : (
                                    <AssetCard
                                        key={asset.id}
                                        asset={asset}
                                        isAdmin={isAdmin}
                                        onDelete={() => handleDelete(asset.id)}
                                        onPreview={() => setPreviewAsset(asset)}
                                        sections={sections}
                                        onMove={(sectionId) => handleMoveAsset(asset.id, sectionId)}
                                        onUpdateText={(id, text) => handleUpdateTextBlock(id, text)}
                                    />
                                )
                            ))}

                            {/* Unified Add Card */}
                            {isAdmin && (
                                <AddCard
                                    onAddFiles={() => {
                                        const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                        setUploadToSection(sectionId)
                                        if (fileInputRef.current) {
                                            fileInputRef.current.removeAttribute('webkitdirectory')
                                            fileInputRef.current.click()
                                        }
                                    }}
                                    onAddFolder={() => {
                                        const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                        setUploadToSection(sectionId)
                                        if (fileInputRef.current) {
                                            fileInputRef.current.setAttribute('webkitdirectory', '')
                                            fileInputRef.current.click()
                                        }
                                    }}
                                    onNewFolder={() => {
                                        const sectionId = assets.find(a => a.id === currentFolderId)?.collection_id
                                        handleCreateFolder(sectionId, currentFolderId)
                                    }}
                                />
                            )}
                        </div>

                        {/* Empty State */}
                        {assets.filter(a => a.parent_id === currentFolderId).length === 0 && !isAdmin && (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                This folder is empty
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Full-page empty state when no sections or assets exist */}
                        {sections.length === 0 && uncategorizedAssets.length === 0 && (
                            isAdmin ? (
                                <div
                                    className={`flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed transition-all duration-150 ${dragOverSection === 'page' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverSection('page') }}
                                    onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverSection(null) }}
                                    onDrop={(e) => { e.preventDefault(); setDragOverSection(null); const files = Array.from(e.dataTransfer.files); if (files.length > 0) handleUpload(files, null) }}
                                >
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
                                        <Upload size={28} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1.5">No assets yet</h3>
                                    <p className="text-sm text-gray-400 mb-7 max-w-xs mx-auto leading-relaxed">
                                        Organize brand files into sections. Upload logos, fonts, templates, and more — or drag files here to get started.
                                    </p>
                                    <div className="flex flex-wrap items-center justify-center gap-3">
                                        <button
                                            onClick={() => setIsAddingSection(true)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                                        >
                                            <Plus size={15} />
                                            New Section
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUploadToSection(null)
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.removeAttribute('webkitdirectory')
                                                    fileInputRef.current.click()
                                                }
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <Upload size={15} />
                                            Upload Files
                                        </button>
                                        <button
                                            onClick={() => {
                                                setUploadToSection(null)
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.setAttribute('webkitdirectory', '')
                                                    fileInputRef.current.click()
                                                }
                                            }}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <Folder size={15} />
                                            Upload Folder
                                        </button>
                                        <button
                                            onClick={() => handleCreateFolder(null, null)}
                                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <Folder size={15} />
                                            Create Folder
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-400 text-sm">
                                    No assets available yet.
                                </div>
                            )
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-8">
                                    {sections.map(section => {
                                        const sectionAssets = getAssetsForSection(section.id)
                                        const isEditing = editingSectionId === section.id
                                        return (
                                            <SortableSection
                                                key={section.id}
                                                id={section.id}
                                                isAdmin={isAdmin}
                                                onFileDragOver={(e) => handleFileDragOver(e, section.id)}
                                                onFileDragLeave={handleFileDragLeave}
                                                onFileDrop={(e) => handleFileDrop(e, section.id)}
                                                isDragOver={dragOverSection === section.id}
                                            >
                                                {(dragHandleProps) => (
                                                    <>
                                                        <div className="flex items-center justify-between group">
                                                            <div className="flex items-center gap-2">
                                                                {isAdmin && (
                                                                    <div
                                                                        {...dragHandleProps}
                                                                        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <GripVertical size={16} className="text-gray-400" />
                                                                    </div>
                                                                )}
                                                                {isAdmin && isEditing ? (
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={editingSectionName}
                                                                        onChange={(e) => setEditingSectionName(e.target.value)}
                                                                        onBlur={async () => {
                                                                            if (editingSectionName.trim() && editingSectionName !== section.name) {
                                                                                setSections(prev => prev.map(s =>
                                                                                    s.id === section.id ? { ...s, name: editingSectionName.trim() } : s
                                                                                ))
                                                                                await supabase.from('collections').update({ name: editingSectionName.trim() }).eq('id', section.id)
                                                                            }
                                                                            setEditingSectionId(null)
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') e.target.blur()
                                                                            if (e.key === 'Escape') setEditingSectionId(null)
                                                                        }}
                                                                        className="text-xl font-semibold text-gray-900 bg-transparent border-b-2 border-gray-400 focus:outline-none"
                                                                    />
                                                                ) : (
                                                                    <h2
                                                                        onClick={() => {
                                                                            if (isAdmin) {
                                                                                setEditingSectionId(section.id)
                                                                                setEditingSectionName(section.name)
                                                                            }
                                                                        }}
                                                                        className={`text-xl font-semibold text-gray-900 ${isAdmin ? 'cursor-pointer' : ''}`}
                                                                    >
                                                                        {section.name}
                                                                    </h2>
                                                                )}
                                                            </div>
                                                            {isAdmin && (
                                                                <div className="flex items-center gap-1 transition-opacity">
                                                                    <button
                                                                        onClick={() => {
                                                                            setUploadToSection(section.id)
                                                                            if (fileInputRef.current) {
                                                                                fileInputRef.current.removeAttribute('webkitdirectory')
                                                                                fileInputRef.current.click()
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    >
                                                                        <Upload size={14} />
                                                                        Add Files
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleCreateFolder(section.id, null)}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    >
                                                                        <Folder size={14} />
                                                                        New Folder
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setUploadToSection(section.id)
                                                                            if (fileInputRef.current) {
                                                                                fileInputRef.current.setAttribute('webkitdirectory', '')
                                                                                fileInputRef.current.click()
                                                                            }
                                                                        }}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    >
                                                                        <Folder size={14} />
                                                                        Upload Folder
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleAddTextBlock(section.id, 'heading')}
                                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                                                    >
                                                                        <FontIcon size={14} />
                                                                        Add Text
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDownloadSection(section.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                        title="Download section"
                                                                    >
                                                                        <Download size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleCopySection(section.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                                        title="Duplicate section"
                                                                    >
                                                                        <Copy size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSection(section.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete section"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {sectionAssets.length === 0 ? (
                                                            isAdmin && <div
                                                                className="border-2 border-dashed border-gray-200 rounded-xl py-12 px-6 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all group flex flex-col items-center justify-center min-h-[200px]"
                                                            >
                                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-white group-hover:shadow-sm transition-all text-gray-400 group-hover:text-gray-600">
                                                                    <Upload size={24} />
                                                                </div>
                                                                <h3 className="text-gray-900 font-medium mb-1">Upload assets</h3>
                                                                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                                                    Support for images, fonts, documents, archives, and design files.
                                                                </p>
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <button
                                                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setUploadToSection(section.id)
                                                                            if (fileInputRef.current) {
                                                                                fileInputRef.current.removeAttribute('webkitdirectory')
                                                                                fileInputRef.current.click()
                                                                            }
                                                                        }}
                                                                    >
                                                                        Upload Files
                                                                    </button>
                                                                    <button
                                                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            setUploadToSection(section.id)
                                                                            if (fileInputRef.current) {
                                                                                fileInputRef.current.setAttribute('webkitdirectory', '')
                                                                                fileInputRef.current.click()
                                                                            }
                                                                        }}
                                                                    >
                                                                        Upload Folder
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {/* Text Blocks - Standalone full-width */}
                                                                {sectionAssets.filter(a => a.category === 'text').map(textAsset => (
                                                                    <div key={textAsset.id} className="group relative mb-4">
                                                                        {textAsset.file_type === 'text/heading' ? (
                                                                            <h3
                                                                                contentEditable={isAdmin}
                                                                                suppressContentEditableWarning
                                                                                onBlur={(e) => handleUpdateTextBlock(textAsset.id, e.currentTarget.textContent)}
                                                                                className={`text-lg font-semibold text-gray-900 outline-none ${isAdmin ? 'hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 cursor-text' : ''}`}
                                                                            >
                                                                                {textAsset.name}
                                                                            </h3>
                                                                        ) : (
                                                                            <p
                                                                                contentEditable={isAdmin}
                                                                                suppressContentEditableWarning
                                                                                onBlur={(e) => handleUpdateTextBlock(textAsset.id, e.currentTarget.textContent)}
                                                                                className={`text-gray-600 outline-none ${isAdmin ? 'hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1 cursor-text' : ''}`}
                                                                            >
                                                                                {textAsset.name}
                                                                            </p>
                                                                        )}
                                                                        {isAdmin && (
                                                                            <button
                                                                                onClick={() => handleDelete(textAsset.id)}
                                                                                className="absolute -right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}

                                                                {/* File Assets Grid */}
                                                                {viewMode === 'grid' ? (
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                                                                        {sectionAssets.filter(a => a.category !== 'text').map(asset => (
                                                                            asset.is_folder ? (
                                                                                <FolderAssetCard
                                                                                    key={asset.id}
                                                                                    asset={asset}
                                                                                    isAdmin={isAdmin}
                                                                                    onEnter={setCurrentFolderId}
                                                                                    onDelete={() => handleDelete(asset.id)}
                                                                                    onRename={handleUpdateTextBlock}
                                                                                    onMove={(sid) => handleMoveAsset(asset.id, sid)}
                                                                                    onDownload={handleDownloadFolder}
                                                                                />
                                                                            ) : (
                                                                                <AssetCard
                                                                                    key={asset.id}
                                                                                    asset={asset}
                                                                                    isAdmin={isAdmin}
                                                                                    onDelete={() => handleDelete(asset.id)}
                                                                                    onPreview={() => setPreviewAsset(asset)}
                                                                                    sections={sections}
                                                                                    onMove={(sectionId) => handleMoveAsset(asset.id, sectionId)}
                                                                                    onUpdateText={(id, text) => handleUpdateTextBlock(id, text)}
                                                                                />
                                                                            )
                                                                        ))}
                                                                        {/* Unified Add Card */}
                                                                        {isAdmin && (
                                                                            <AddCard
                                                                                onAddFiles={() => {
                                                                                    setUploadToSection(section.id)
                                                                                    if (fileInputRef.current) {
                                                                                        fileInputRef.current.removeAttribute('webkitdirectory')
                                                                                        fileInputRef.current.click()
                                                                                    }
                                                                                }}
                                                                                onAddFolder={() => {
                                                                                    setUploadToSection(section.id)
                                                                                    if (fileInputRef.current) {
                                                                                        fileInputRef.current.setAttribute('webkitdirectory', '')
                                                                                        fileInputRef.current.click()
                                                                                    }
                                                                                }}
                                                                                onNewFolder={() => {
                                                                                    handleCreateFolder(section.id, null)
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                                        {/* Table View (Simplified for now - preserving original structure mostly) */}
                                                                        <table className="w-full">
                                                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                                                <tr>
                                                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                                                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                                                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                                                                                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-100">
                                                                                {sectionAssets.filter(a => a.category !== 'text').map(asset => {
                                                                                    if (asset.is_folder) {
                                                                                        // Simple render for folder in list view
                                                                                        return (
                                                                                            <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer" onDoubleClick={() => setCurrentFolderId(asset.id)}>
                                                                                                <td className="px-4 py-3">
                                                                                                    <div className="flex items-center gap-3">
                                                                                                        <Folder size={18} className="text-blue-400 fill-blue-400/20" />
                                                                                                        <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                                                                                                    </div>
                                                                                                </td>
                                                                                                <td className="px-4 py-3 text-sm text-gray-500">Folder</td>
                                                                                                <td className="px-4 py-3 text-sm text-gray-500">—</td>
                                                                                                <td className="px-4 py-3 text-right">
                                                                                                    {/* Actions... skipping for brevity, handled by double click mostly */}
                                                                                                </td>
                                                                                            </tr>
                                                                                        )
                                                                                    }
                                                                                    const { icon: Icon, color } = getFileCategory(asset.name)
                                                                                    return (
                                                                                        <tr key={asset.id} className="hover:bg-gray-50">
                                                                                            <td className="px-4 py-3">
                                                                                                <div className="flex items-center gap-3">
                                                                                                    <Icon size={18} className={color} />
                                                                                                    <span className="text-sm font-medium text-gray-900">{asset.name}</span>
                                                                                                </div>
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-sm text-gray-500">{asset.file_type || '—'}</td>
                                                                                            <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(asset.file_size)}</td>
                                                                                            <td className="px-4 py-3 text-right">
                                                                                                <div className="flex items-center justify-end gap-2">
                                                                                                    <a
                                                                                                        href={asset.file_url}
                                                                                                        download
                                                                                                        className="p-1.5 text-gray-400 hover:text-gray-600"
                                                                                                    >
                                                                                                        <Download size={16} />
                                                                                                    </a>
                                                                                                    {isAdmin && (
                                                                                                        <button
                                                                                                            onClick={() => handleDelete(asset.id)}
                                                                                                            className="p-1.5 text-gray-400 hover:text-red-500"
                                                                                                        >
                                                                                                            <Trash2 size={16} />
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </td>
                                                                                        </tr>
                                                                                    )
                                                                                })}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </SortableSection>
                                        )
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Removed hardcoded Uncategorized Section - now handled via normal sections */}
                        {/* Add Section Button - Admin Only */}
                        {isAdmin && (
                            isAddingSection ? (
                                <div className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Section name (e.g., Logo, Typeface, ID)"
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                                    />
                                    <button
                                        onClick={handleCreateSection}
                                        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                                    >
                                        Create
                                    </button>
                                    <button
                                        onClick={() => setIsAddingSection(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingSection(true)}
                                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    Add Section
                                </button>
                            )
                        )}
                    </>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        handleUpload(files, uploadToSection)
                        // Reset so same files can be re-selected + clear webkitdirectory for next use
                        e.target.value = ''
                        e.target.removeAttribute('webkitdirectory')
                    }}
                />
            </main>

            {/* Confirm Modal */}
            <ConfirmModal
                {...confirmModal}
                onClose={() => setConfirmModal({ open: false })}
            />

            {/* Input Modal (for folder name, etc.) */}
            <InputModal
                {...inputModal}
                onClose={() => setInputModal({ open: false })}
            />

            {/* Preview Modal */}
            {
                previewAsset && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
                        onClick={() => setPreviewAsset(null)}
                    >
                        <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setPreviewAsset(null)}
                                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white"
                            >
                                <X size={24} />
                            </button>

                            {getFileCategory(previewAsset.name).category === 'image' ? (
                                <img
                                    src={previewAsset.file_url}
                                    alt={previewAsset.name}
                                    className="max-w-full max-h-[75vh] rounded-xl shadow-2xl"
                                />
                            ) : (
                                <div className="bg-white rounded-2xl p-12 text-center shadow-2xl">
                                    {(() => {
                                        const { icon: Icon, color, bg } = getFileCategory(previewAsset.name)
                                        return (
                                            <div className={`w-20 h-20 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                                                <Icon size={40} className={color} />
                                            </div>
                                        )
                                    })()}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{previewAsset.name}</h3>
                                    <p className="text-gray-500 mb-6">{formatFileSize(previewAsset.file_size)}</p>
                                    <button
                                        onClick={() => downloadFile(previewAsset.file_url, previewAsset.name)}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        <Download size={18} />
                                        Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {confirmModal.open && (
                <ConfirmModal
                    {...confirmModal}
                    onClose={() => setConfirmModal({ ...confirmModal, open: false })}
                />
            )}

            {inputModal.open && (
                <InputModal
                    {...inputModal}
                    onClose={() => setInputModal({ ...inputModal, open: false })}
                />
            )}

            <PublishModal
                isOpen={publishModalOpen}
                onClose={() => setPublishModalOpen(false)}
                onConfirm={handleConfirmPublish}
                initialSlug={brand?.slug}
                brandName={brand?.name}
                isPublishing={publishing}
            />
        </div >
    )
}

// Sortable Section Wrapper for drag-and-drop
function SortableSection({ id, isAdmin, children, onFileDragOver, onFileDragLeave, onFileDrop, isDragOver }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // Pass listeners to children so only the drag handle gets them
    const dragHandleProps = isAdmin ? { ...attributes, ...listeners } : {}

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={`space-y-4 rounded-xl transition-all duration-150 ${isDragOver ? 'ring-2 ring-indigo-400 ring-offset-4 bg-indigo-50/20' : ''}`}
            onDragOver={onFileDragOver}
            onDragLeave={onFileDragLeave}
            onDrop={onFileDrop}
        >
            {typeof children === 'function' ? children(dragHandleProps) : children}
        </section>
    )
}

// Asset Card Component
function AssetCard({ asset, isAdmin, onDelete, onPreview, sections, onMove, onUpdateText }) {
    const [showMenu, setShowMenu] = useState(false)
    const { icon: Icon, color, bg, category } = getFileCategory(asset.name)
    const isImage = category === 'image'
    const isTextBlock = asset.category === 'text'

    // Show animated skeleton while uploading
    if (asset.isUploading) {
        return (
            <div className="relative bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="aspect-square bg-gray-100 animate-pulse" />
                <div className="p-3 border-t border-gray-50">
                    <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
        )
    }

    // Render text block differently
    if (isTextBlock) {
        const isHeading = asset.file_type === 'text/heading'
        return (
            <div className="group relative col-span-3 bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        {isHeading ? (
                            <h3
                                contentEditable={isAdmin}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateText?.(asset.id, e.currentTarget.textContent)}
                                className={`text-lg font-semibold text-gray-900 outline-none ${isAdmin ? 'hover:bg-gray-50 rounded px-1 -mx-1 cursor-text' : ''}`}
                            >
                                {asset.name}
                            </h3>
                        ) : (
                            <p
                                contentEditable={isAdmin}
                                suppressContentEditableWarning
                                onBlur={(e) => onUpdateText?.(asset.id, e.currentTarget.textContent)}
                                className={`text-gray-600 outline-none ${isAdmin ? 'hover:bg-gray-50 rounded px-1 -mx-1 cursor-text' : ''}`}
                            >
                                {asset.name}
                            </p>
                        )}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => onDelete?.()}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="group relative bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all">
            {/* Thumbnail */}
            <div
                className={`aspect-square relative cursor-pointer ${isImage ? '' : `${bg} flex items-center justify-center`}`}
                onClick={onPreview}
            >
                {isImage && asset.thumbnail_url ? (
                    <img src={asset.thumbnail_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <Icon size={32} className={color} />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>

            {/* Info */}
            <div className="p-3">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate min-w-0" title={asset.name}>
                        {asset.name?.replace(/\.[^/.]+$/, '') || asset.name}
                    </p>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-semibold text-gray-600 uppercase flex-shrink-0">
                        {asset.name?.split('.').pop() || ''}
                    </span>
                </div>
                <p className="text-xs text-gray-400">{formatFileSize(asset.file_size)}</p>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        downloadFile(asset.file_url, asset.name)
                    }}
                    className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-600"
                >
                    <Download size={14} />
                </button>
                {isAdmin && (
                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
                            className="p-1.5 bg-white/90 backdrop-blur rounded-lg shadow-sm hover:bg-white text-gray-600"
                        >
                            <MoreVertical size={14} />
                        </button>

                        {showMenu && (
                            <div
                                className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-xl z-50 py-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <p className="px-3 py-1.5 text-xs text-gray-400 font-medium">Move to</p>
                                {sections.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => { onMove(s.id); setShowMenu(false) }}
                                        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {s.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { onMove(null); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
                                >
                                    Uncategorized
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                    onClick={() => { onDelete(); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Click outside to close menu */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                />
            )}

        </div>
    )
}

// Unified Add Card Component
function AddCard({ onAddFiles, onAddFolder, onNewFolder }) {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="relative">
            <div
                onClick={() => setShowMenu(!showMenu)}
                className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50/50 transition-colors group"
            >
                <Plus size={24} className="text-gray-300 group-hover:text-gray-400 mb-2" />
                <span className="text-sm text-gray-400 group-hover:text-gray-500">Add</span>
            </div>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <button
                            onClick={() => { onAddFiles(); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <Upload size={16} className="text-gray-400" />
                            Upload files
                        </button>
                        <button
                            onClick={() => { onAddFolder(); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <Folder size={16} className="text-gray-400" />
                            Upload folder
                        </button>
                        <hr className="my-1.5 border-gray-100" />
                        <button
                            onClick={() => { onNewFolder(); setShowMenu(false) }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                            <Plus size={16} className="text-gray-400" />
                            New folder
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
