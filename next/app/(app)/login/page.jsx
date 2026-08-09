import { GuestOnly } from '@/components/gates'
import LoginPage from '@/components/auth/LoginPage'
export default function Page() {
    return <GuestOnly><LoginPage /></GuestOnly>
}
