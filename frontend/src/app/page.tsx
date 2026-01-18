
import { redirect } from 'next/navigation'

export default function RootPage() {
  // In a real app, we check session here.
  // For now, default root access (likely app.guidr.space) goes to /login
  redirect('/login')
}
