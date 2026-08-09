import { ProtectedAccountRoute } from '@/components/gates'
import BrandsDashboard from '@/components/admin/BrandsDashboard'
export default function Page() {
    return <ProtectedAccountRoute><BrandsDashboard /></ProtectedAccountRoute>
}
