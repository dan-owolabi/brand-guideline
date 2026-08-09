import { ProtectedAccountRoute } from '@/components/gates'
import AccountSettings from '@/components/settings/AccountSettings'
export default function Page() {
    return <ProtectedAccountRoute><AccountSettings /></ProtectedAccountRoute>
}
