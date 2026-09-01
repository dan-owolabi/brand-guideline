'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient } from '../../src/lib/auth/client'

/**
 * Password reset landing page.
 *
 * Reached from the email link Better Auth generates, which carries ?token=.
 * AccountSettings has been pointing forgetPassword() at this path since the
 * auth swap, but the route did not exist — the link 404'd.
 *
 * useSearchParams forces a client boundary, so the whole thing is wrapped in
 * Suspense; without it the build fails prerendering this route.
 */

function ResetForm() {
    const params = useSearchParams()
    const router = useRouter()
    const token = params.get('token')
    // Better Auth appends ?error=INVALID_TOKEN rather than a token when the
    // link has already been used or has expired.
    const linkError = params.get('error')

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [done, setDone] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setError('')

        if (password.length < 6) {
            setError('Use at least 6 characters.')
            return
        }
        if (password !== confirm) {
            setError('The two passwords do not match.')
            return
        }

        setBusy(true)
        const { error: err } = await authClient.resetPassword({ newPassword: password, token })
        setBusy(false)

        if (err) {
            setError(
                err.message ||
                'That link is no longer valid. Request a new one and try again.'
            )
            return
        }

        setDone(true)
        // Give the confirmation a beat to register before moving on.
        setTimeout(() => router.push('/login'), 1800)
    }

    if (linkError || !token) {
        return (
            <Panel title="This link has expired">
                <p className="text-sm text-gray-600 leading-relaxed">
                    Password reset links are valid for one hour and can only be used once.
                    Request a new one from the sign-in page.
                </p>
                <a
                    href="/login"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                >
                    Back to sign in
                </a>
            </Panel>
        )
    }

    if (done) {
        return (
            <Panel title="Password changed">
                <p className="text-sm text-gray-600 leading-relaxed">
                    You can now sign in with your new password. Taking you there…
                </p>
            </Panel>
        )
    }

    return (
        <Panel title="Choose a new password">
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                        New password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">At least 6 characters.</p>
                </div>

                <div>
                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Confirm new password
                    </label>
                    <input
                        id="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                </div>

                {error && (
                    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                    {busy ? 'Saving…' : 'Save new password'}
                </button>
            </form>
        </Panel>
    )
}

function Panel({ title, children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="mb-5 text-lg font-semibold text-gray-900">{title}</h1>
                {children}
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<Panel title="Loading…"><div /></Panel>}>
            <ResetForm />
        </Suspense>
    )
}
