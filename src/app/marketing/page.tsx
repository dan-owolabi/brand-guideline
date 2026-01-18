'use client'

import Link from 'next/link'
import { ArrowRight, Layers, Shield, Globe, Zap, Check } from 'lucide-react'

// You might usually get appUrl from env or just use relative paths if it's the same app
const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="font-bold text-xl tracking-tight">Guidr</span>
            </div>

            <div className="flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 hidden sm:block">
                Pricing
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-900 hover:text-gray-600"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            v2.0 is now live
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700">
            Beautiful brand guidelines,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              effortlessly.
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Create stunning, shareable brand guidelines in minutes.
            Keep your team aligned with a single source of truth. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-200"
            >
              Start for free
              <ArrowRight size={18} />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors bg-white shadow-sm"
            >
              See a demo
            </Link>
          </div>

          {/* Dashboard Preview Image */}
          <div className="mt-20 rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="aspect-[16/9] bg-gray-50 flex items-center justify-center relative">
              {/* Placeholder for screenshot */}
              <div className="text-gray-300 flex flex-col items-center">
                <Layers size={64} />
                <span className="mt-4 font-medium">Dashboard Preview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features to create, manage, and share your brand system without the headache.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Layers}
              title="Visual Editor"
              description="Drag-and-drop blocks to build your guidelines. Real-time preview and intuitive controls."
            />
            <FeatureCard
              icon={Globe}
              title="Custom Domains"
              description="Publish to your-brand.guidr.space or connect your own domain for a fully branded experience."
            />
            <FeatureCard
              icon={Shield}
              title="Team Access"
              description="Invite team members with granular permissions. Control who can edit and who can view."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section Placeholder (Optional) */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Pricing</h2>
            <p className="text-gray-600">Start for free, upgrade when you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900">Starter</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
                <span className="text-sm font-semibold text-gray-600">/month</span>
              </div>
              <p className="mt-4 text-sm text-gray-500">Perfect for freelancers and side projects.</p>
              <ul className="mt-8 space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> 1 Brand Guideline</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Public Link</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Standard Blocks</li>
              </ul>
              <Link href="/signup" className="block w-full py-2.5 px-4 bg-gray-50 text-gray-900 font-medium text-center rounded-lg hover:bg-gray-100 transition-colors">Start for free</Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 shadow-md relative">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
              <h3 className="text-lg font-bold text-indigo-900">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">$29</span>
                <span className="text-sm font-semibold text-gray-600">/month</span>
              </div>
              <p className="mt-4 text-sm text-gray-500">For growing teams and agencies.</p>
              <ul className="mt-8 space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-900"><Check size={16} className="text-indigo-600" /> Unlimited Brands</li>
                <li className="flex items-center gap-3 text-sm text-gray-900"><Check size={16} className="text-indigo-600" /> Custom Domains</li>
                <li className="flex items-center gap-3 text-sm text-gray-900"><Check size={16} className="text-indigo-600" /> Team Collaboration</li>
                <li className="flex items-center gap-3 text-sm text-gray-900"><Check size={16} className="text-indigo-600" /> Asset Management</li>
              </ul>
              <Link href="/signup" className="block w-full py-2.5 px-4 bg-indigo-600 text-white font-medium text-center rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Get Pro</Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900">Enterprise</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">Custom</span>
              </div>
              <p className="mt-4 text-sm text-gray-500">For large organizations.</p>
              <ul className="mt-8 space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> SSO / SAML</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Dedicated Support</li>
                <li className="flex items-center gap-3 text-sm text-gray-600"><Check size={16} className="text-green-500" /> Custom Contracts</li>
              </ul>
              <Link href="/contact" className="block w-full py-2.5 px-4 bg-gray-50 text-gray-900 font-medium text-center rounded-lg hover:bg-gray-100 transition-colors">Contact Sales</Link>
            </div>
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
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors text-lg shadow-lg"
          >
            Get started for free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center">
                <Zap className="w-3 h-3 text-gray-500" fill="currentColor" />
              </div>
              <span className="font-bold text-gray-900">Guidr</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900">Privacy</a>
              <a href="#" className="hover:text-gray-900">Terms</a>
              <a href="#" className="hover:text-gray-900">Twitter</a>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Guidr. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-indigo-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
