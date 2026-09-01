'use client'

import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

/**
 * Browser-side auth client.
 *
 * Imports nothing from src/server/ — that is enforced by the
 * no-restricted-imports rule in eslint.config.mjs, and it matters here more
 * than anywhere else: pulling the server auth config into a client bundle
 * would ship MONGODB_URI and BETTER_AUTH_SECRET to the browser.
 *
 * baseURL is left unset so requests go to the current origin. Hard-coding it
 * would break the multi-domain setup — the app is served from
 * app.guidr.space, brand subdomains, and custom domains, and each must call
 * its own /api/auth.
 */
export const authClient = createAuthClient({
    plugins: [
        // Makes the custom user fields declared in server/auth/config.js
        // (fullName, avatarUrl) visible on the client's session type.
        inferAdditionalFields({
            user: {
                fullName: { type: 'string', required: false },
                avatarUrl: { type: 'string', required: false },
            },
        }),
    ],
})

export const {
    signIn,
    signUp,
    signOut,
    useSession,
    getSession,
    updateUser,
    forgetPassword,
    resetPassword,
} = authClient
