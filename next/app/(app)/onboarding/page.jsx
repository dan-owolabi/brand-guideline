import { RequireAuth, OnboardingGuard } from '@/components/gates'
import OnboardingFlow from '@/components/auth/OnboardingFlow'
export default function Page() {
    return <RequireAuth><OnboardingGuard><OnboardingFlow /></OnboardingGuard></RequireAuth>
}
