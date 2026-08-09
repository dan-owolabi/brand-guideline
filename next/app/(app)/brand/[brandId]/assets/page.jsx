import { ProtectedAccountRoute } from '@/components/gates'
import AssetsPage from '@/components/admin/AssetsPage'
export default function Page() {
    return <ProtectedAccountRoute><AssetsPage /></ProtectedAccountRoute>
}
