'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import TeamSettings from '@/components/admin/TeamSettings'
import { Settings, Users, Briefcase, User } from 'lucide-react'

type Tab = 'workspace' | 'team' | 'account'

export default function SettingsPage() {
    const { currentWorkspace, user } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>('workspace')

    const isOwner = currentWorkspace?.role === 'owner'
    const canViewTeam = isOwner || currentWorkspace?.can_invite

    const tabs = [
        { id: 'workspace' as Tab, label: 'Workspace', icon: Briefcase, visible: true },
        { id: 'team' as Tab, label: 'Team', icon: Users, visible: canViewTeam },
        { id: 'account' as Tab, label: 'Account', icon: User, visible: true },
    ].filter(tab => tab.visible)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-gray-200 mb-6">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-black text-black'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="bg-white rounded-xl border border-gray-200">
                    {activeTab === 'workspace' && (
                        <WorkspaceSettings />
                    )}
                    {activeTab === 'team' && canViewTeam && (
                        <TeamSettings />
                    )}
                    {activeTab === 'account' && (
                        <AccountSettings />
                    )}
                </div>
            </div>
        </div>
    )
}

function WorkspaceSettings() {
    const { currentWorkspace } = useAuth()
    const isOwner = currentWorkspace?.role === 'owner'

    return (
        <div className="p-8">
            <h2 className="text-xl font-semibold mb-6">Workspace Settings</h2>

            <div className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workspace name
                    </label>
                    <input
                        type="text"
                        defaultValue={currentWorkspace?.name}
                        disabled={!isOwner}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    {!isOwner && (
                        <p className="text-xs text-gray-500 mt-1">Only the owner can edit workspace settings</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Workspace URL
                    </label>
                    <div className="flex">
                        <span className="px-4 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-gray-500">
                            guidr.app/
                        </span>
                        <input
                            type="text"
                            defaultValue={currentWorkspace?.slug}
                            disabled={!isOwner}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-black/10 disabled:bg-gray-50 disabled:text-gray-500"
                        />
                    </div>
                </div>

                {isOwner && (
                    <>
                        <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                            Save changes
                        </button>

                        <div className="pt-8 mt-8 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-red-600 mb-2">Danger Zone</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Deleting this workspace will remove all brands and team members permanently.
                            </p>
                            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                Delete workspace
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function AccountSettings() {
    const { user, signOut } = useAuth()

    return (
        <div className="p-8">
            <h2 className="text-xl font-semibold mb-6">Account Settings</h2>

            <div className="space-y-6 max-w-lg">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        defaultValue={user?.email}
                        disabled
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full name
                    </label>
                    <input
                        type="text"
                        defaultValue={user?.user_metadata?.full_name || ''}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
                    />
                </div>

                <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Save changes
                </button>

                <div className="pt-8 mt-8 border-t border-gray-200">
                    <button
                        onClick={() => signOut()}
                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    )
}
