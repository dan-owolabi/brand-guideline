import { useEffect, useState } from 'react'
import { migrateBrandToDraft } from '../../utils/migration'
import { useOutletContext } from 'react-router-dom'
import { Button } from '../ui/Button'
import { Loader2, CheckCircle } from 'lucide-react'

export default function MigrationRunner() {
    const { currentBrand } = useOutletContext()
    const [status, setStatus] = useState('idle') // idle, running, success, error
    const [error, setError] = useState(null)

    const runMigration = async () => {
        if (!currentBrand) return
        setStatus('running')
        try {
            await migrateBrandToDraft(currentBrand.id)
            setStatus('success')
        } catch (err) {
            setError(err.message)
            setStatus('error')
        }
    }

    return (
        <div className="p-10 max-w-xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center space-y-4">
                <h2 className="text-xl font-bold">System Upgrade Required</h2>
                <p className="text-gray-500">We need to upgrade your brand data to support the new Live Preview features.</p>

                {status === 'success' ? (
                    <div className="text-emerald-600 flex flex-col items-center gap-2">
                        <CheckCircle size={32} />
                        <span className="font-medium">Migration Complete!</span>
                        <p className="text-sm text-gray-400">Please refresh the page to load the new editor.</p>
                    </div>
                ) : (
                    <Button
                        onClick={runMigration}
                        disabled={status === 'running'}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                        {status === 'running' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {status === 'running' ? 'Upgrading...' : 'Run Upgrade'}
                    </Button>
                )}

                {status === 'error' && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
            </div>
        </div>
    )
}
