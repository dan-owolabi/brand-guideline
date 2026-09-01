import 'server-only'
import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { nextCookies } from 'better-auth/next-js'
import { verifyPassword as verifyScrypt } from 'better-auth/crypto'
import bcrypt from 'bcryptjs'
import { getDb, getClient } from '../db/client.js'
import { BASE_DOMAIN, STAGING_BASE_DOMAIN } from '../../lib/domains.js'
import { sendPasswordReset } from '../email.js'

/**
 * Better Auth, self-hosted.
 *
 * Deliberately NOT Neon's "Managed Better Auth" or any hosted equivalent: the
 * library is the same, but self-hosting means no MAU ceiling, no per-user
 * billing, and the auth tables live in our own database next to everything
 * else — which is what lets accounts.members reference user ids directly.
 *
 * Lives under src/server/ (not src/lib/) because it needs getDb(), which is
 * private to the server tree. The browser-side counterpart is
 * src/lib/auth/client.js and imports nothing from here.
 */

let authPromise

/** Better Auth needs a live Db handle, and ours is async — so the instance is too. */
export async function getAuth() {
    if (!authPromise) authPromise = build()
    return authPromise
}

async function build() {
    const [db, client] = await Promise.all([getDb(), getClient()])

    return betterAuth({
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_ORIGIN,

        // Passing `client` is what enables transactional writes in the adapter.
        database: mongodbAdapter(db, { client }),

        /**
         * CSRF origin allowlist.
         *
         * Better Auth rejects any request whose Origin is not listed
         * (MISSING_OR_NULL_ORIGIN / invalid origin). This app is served from
         * several hosts — app.guidr.space, the marketing apex, and a wildcard
         * of brand subdomains — so the default single-baseURL list is not
         * enough and login would 403 everywhere except the base URL.
         *
         * Custom tenant domains are deliberately NOT included: they only ever
         * serve anonymous published content, so no auth endpoint is called
         * from them, and resolving them would mean a database lookup on every
         * auth request.
         */
        trustedOrigins: () => {
            const origins = [
                `https://${BASE_DOMAIN}`,
                `https://www.${BASE_DOMAIN}`,
                `https://app.${BASE_DOMAIN}`,
                `https://*.${BASE_DOMAIN}`,
                `https://app.${STAGING_BASE_DOMAIN}`,
                `https://*.${STAGING_BASE_DOMAIN}`,
                'https://*.vercel.app',
            ]

            for (const v of [process.env.NEXT_PUBLIC_APP_ORIGIN, process.env.BETTER_AUTH_URL]) {
                if (v && !origins.includes(v)) origins.push(v)
            }

            // Dev runs on whatever port is free, so match any localhost port
            // rather than pinning one.
            if (process.env.NODE_ENV !== 'production') {
                origins.push('http://localhost:*', 'http://127.0.0.1:*')
            }

            return origins
        },

        advanced: {
            database: {
                // Resolves to crypto.randomUUID(). This MUST stay "uuid": every
                // accounts.members[].userId, invites.invitedBy and asset owner
                // reference is a string UUID, and the Supabase import preserves
                // the original auth.users ids. Switching this to the default
                // (a short random string) would orphan every one of them.
                generateId: 'uuid',
            },
        },

        emailAndPassword: {
            enabled: true,

            /**
             * Without this, authClient.forgetPassword() succeeds silently and
             * no mail is ever sent — which is exactly what AccountSettings has
             * been doing since the auth swap. Better Auth builds the token and
             * the URL; delivery is entirely ours to provide.
             *
             * `url` already carries the token and the redirect target the
             * client asked for, so it is passed through unmodified.
             */
            sendResetPassword: async ({ user, url }) => {
                await sendPasswordReset({ to: user.email, url })
            },
            resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
            // Supabase's default minimum. Lowering it at cutover would let
            // imported users' passwords fail their own policy on next change.
            minPasswordLength: 6,

            password: {
                /**
                 * New and changed passwords use Better Auth's default scrypt —
                 * we only override `verify`. That makes this a gradual
                 * migration rather than a downgrade: legacy Supabase bcrypt
                 * hashes keep working, but nothing new is written as bcrypt, so
                 * the bcrypt population shrinks to zero on its own.
                 *
                 * (Overriding `hash` to bcrypt would have been simpler and is
                 * the obvious move, but it would pin every future password to
                 * the weaker of the two KDFs forever.)
                 */
                verify: async ({ hash, password }) => {
                    if (isBcrypt(hash)) return bcrypt.compare(password, hash)
                    return verifyScrypt({ hash, password })
                },
            },
        },

        /**
         * Google sign-in.
         *
         * NOT optional for this migration: of the 5 users exported from
         * Supabase, 2 have no password hash at all because they only ever
         * signed in with Google. Without this block they cannot authenticate by
         * any means after cutover, and the "Continue with Google" button on the
         * login page fails.
         *
         * Better Auth links a social login to an existing user by verified
         * email, so as long as the imported user keeps its original id and
         * email, signing in with Google resolves to the same account and every
         * accounts.members[].userId reference stays intact.
         *
         * Gated on the env vars being present so a missing credential degrades
         * to "email/password only" rather than crashing the auth handler at
         * import time.
         */
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? {
                socialProviders: {
                    google: {
                        clientId: process.env.GOOGLE_CLIENT_ID,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    },
                },
            }
            : {}),

        /**
         * Link a Google sign-in to the ALREADY-IMPORTED user with the same
         * email, instead of refusing or creating a duplicate.
         *
         * Required by the migration, not a preference. The import writes user
         * documents carrying their original Supabase ids, because every
         * accounts.members[].userId points at them. When those users then sign
         * in with Google, Better Auth's default behaviour is to reject the
         * attempt because an account with that email already exists — which
         * would lock out the two users who have no password at all.
         *
         * `trustedProviders: ['google']` says: a Google-verified email is
         * proof enough to attach to an existing account. That is only safe
         * because Google verifies ownership; it must not be extended to a
         * provider that doesn't.
         */
        account: {
            accountLinking: {
                enabled: true,
                trustedProviders: ['google'],
            },
        },

        user: {
            // Mirrors the Supabase profile fields the UI already reads, so
            // AuthContext's public surface does not have to change.
            additionalFields: {
                fullName: { type: 'string', required: false, input: true },
                avatarUrl: { type: 'string', required: false, input: true },
            },
        },

        session: {
            expiresIn: 60 * 60 * 24 * 30, // 30 days
            updateAge: 60 * 60 * 24,      // refresh at most daily
            cookieCache: {
                // Avoids a database read on every request just to resolve the
                // session — this runs on the hot path of every API call.
                enabled: true,
                maxAge: 5 * 60,
            },
        },

        // Must be last: rewrites Set-Cookie for the Next.js server runtime.
        plugins: [nextCookies()],
    })
}

/**
 * Supabase stores bcrypt Modular Crypt Format. Verified against a real hash
 * from auth.users during the Phase 0 gate: $2a$, cost 10.
 */
function isBcrypt(hash) {
    return typeof hash === 'string' && /^\$2[aby]\$\d{2}\$/.test(hash)
}
