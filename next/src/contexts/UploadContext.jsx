'use client'

import { createContext, useContext, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { uploadFile as put, deleteFiles as remove } from '../lib/storage'

/**
 * Supplies the tenancy that uploads need.
 *
 * R2 keys are tenant-prefixed (acct/{accountId}/brand/{brandId}/…), so every
 * upload has to know which account and brand it belongs to. The block
 * components that call uploadFile — ImageBlock, ImageGridBlock, AssetBlock —
 * receive only { content, isAdmin, onUpdate } and sit several levels below
 * anything that knows the brand.
 *
 * Threading two more props through every block and every renderer in between
 * would touch far more code than it earns, and would be easy to forget on the
 * next block someone adds. A context puts it in one place, and the fallback to
 * AuthContext's currentAccount means a block still uploads correctly (just
 * without a brand path segment) if a provider is missing.
 *
 * Mounted by BrandCanvas and AssetsPage, which both know the brand.
 */

const UploadContext = createContext(null)

export function UploadProvider({ accountId, brandId, children }) {
    const value = useMemo(() => ({ accountId, brandId }), [accountId, brandId])
    return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
}

/**
 * @returns {(file: File, opts?: {brandId?: string}) => Promise<{url: string, key: string}>}
 */
export function useUpload() {
    const scope = useContext(UploadContext)
    const { currentAccount } = useAuth()

    // The provider wins; currentAccount is the fallback for upload surfaces
    // outside a brand (the dashboard's workspace logo, for instance).
    const accountId = scope?.accountId || currentAccount?.id || null
    const brandId = scope?.brandId || null

    return useCallback(async (file, opts = {}) => {
        if (!accountId) {
            throw new Error('No account in scope — cannot determine where to store this file.')
        }
        return put(file, { accountId, brandId: opts.brandId ?? brandId })
    }, [accountId, brandId])
}

/** Delete by KEY. Authorization is re-derived from the key server-side. */
export function useDeleteFiles() {
    return useCallback((keys) => remove(keys), [])
}

export default UploadContext
