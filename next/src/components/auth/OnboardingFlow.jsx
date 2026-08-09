'use client'

/**
 * Onboarding Flow
 * 
 * Guides new users through creating their first account
 */
import { useState } from 'react'
import { useNavigate } from '@/compat/router'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, ArrowRight, Building2 } from 'lucide-react'

export default function OnboardingFlow() {
    const [step, setStep] = useState(1)
    const [accountName, setAccountName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { createAccount, user } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!accountName.trim()) return

        setLoading(true)
        setError('')

        // Generate slug from account name (internal use only)
        const slug = accountName.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 30)

        try {
            const { error } = await createAccount(accountName.trim(), slug)
            if (error) throw error
            navigate('/dashboard')
        } catch (err) {
            setError(err.message || 'Failed to create account')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Progress indicator */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>1</div>
                        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-gray-900' : 'bg-gray-200'}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>2</div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {step === 1 && (
                        <div className="text-center">
                            <img
                                src="/guidr-icon.png"
                                alt="Guidr"
                                className="w-20 h-20 mx-auto mb-6"
                            />
                            <h1 className="text-2xl font-medium text-gray-900 mb-2">
                                Welcome to Guidr!
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Let's set up your first account to get started.
                            </p>
                            <button
                                onClick={() => setStep(2)}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Get Started
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleSubmit}>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Building2 className="w-6 h-6 text-gray-600" />
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                    Name your account
                                </h2>
                                <p className="text-sm text-gray-500">
                                    This is typically your company or team name
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={accountName}
                                        onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="Acme Inc."
                                        autoFocus
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        You'll be able to create multiple brand guidelines under this account
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !accountName.trim()}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Signed in as {user?.email}
                </p>
            </div>
        </div>
    )
}