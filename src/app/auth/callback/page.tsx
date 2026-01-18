'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // Listen for auth state changes which will trigger when the callback is processed
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth callback event:', event)
            if (session) {
                // Redirect to admin dashboard on successful login
                router.push('/admin')
            } else if (event === 'SIGNED_OUT') {
                // Redirect to login if something went wrong
                router.push('/login')
            }
        })

        // Give it a bit of time to process the hash/code in the URL
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.push('/admin')
            }
        }
        checkSession()

        // FALLBACK: Force redirect after 3 seconds to avoid getting stuck
        const timeout = setTimeout(() => {
            console.log('Timeout reached, forcing redirect to /admin')
            router.push('/admin')
        }, 3000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(timeout)
        }
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
                <h2 className="text-xl font-medium text-gray-900">Signing you in...</h2>
                <p className="text-sm text-gray-500 mt-2">Please wait a moment.</p>
            </div>
        </div>
    )
}
