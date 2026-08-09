'use client'

/**
 * Marketing App Shell
 * 
 * Landing page for guidr.space (non-authenticated)
 */
import { Link } from '@/compat/router'
import { ArrowRight, Layers, Shield, Globe, Zap } from 'lucide-react'
import { getAppUrl } from '../lib/domainResolver'

export default function MarketingApp() {
    const appUrl = getAppUrl()

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <img src="/guidr-logo.png" alt="Guidr" className="h-8" />
                        <div className="flex items-center gap-6">
                            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                Features
                            </a>
                            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                                Pricing
                            </a>
                            <a
                                href={`${appUrl}/login`}
                                className="text-sm font-medium text-gray-900 hover:text-gray-600"
                            >
                                Login
                            </a>
                            <a
                                href={`${appUrl}/signup`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Get Started
                                <ArrowRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                        Beautiful brand guidelines,{' '}
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            effortlessly
                        </span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Create stunning, shareable brand guidelines in minutes.
                        Keep your team aligned with a single source of truth.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <a
                            href={`${appUrl}/signup`}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Start for free
                            <ArrowRight size={18} />
                        </a>
                        <a
                            href="#demo"
                            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            See a demo
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Everything you need
                        </h2>
                        <p className="text-lg text-gray-600">
                            Powerful features to create and share your brand guidelines
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Layers}
                            title="Visual Editor"
                            description="Drag-and-drop blocks to build your guidelines. No code required."
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Custom Domains"
                            description="Publish to your-brand.guidr.space or connect your own domain."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Team Access"
                            description="Invite team members with granular permissions and roles."
                        />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Ready to elevate your brand?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8">
                        Join thousands of teams building better brands with Guidr.
                    </p>
                    <a
                        href={`${appUrl}/signup`}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-lg"
                    >
                        Get started for free
                        <ArrowRight size={20} />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        <img src="/guidr-logo.png" alt="Guidr" className="h-6 opacity-60" />
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} Guidr. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

// eslint-disable-next-line no-unused-vars -- Icon is used as a JSX tag below; core no-unused-vars doesn't track that for params
function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </div>
    )
}