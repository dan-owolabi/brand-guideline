import { GuestOnly } from '@/components/gates'
import SignupPage from '@/components/auth/SignupPage'
export default function Page() {
    return <GuestOnly><SignupPage /></GuestOnly>
}
