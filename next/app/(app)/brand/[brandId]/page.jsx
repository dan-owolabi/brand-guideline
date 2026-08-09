import { redirect } from 'next/navigation'
export default async function Page({ params }) {
    const { brandId } = await params
    redirect(`/brand/${brandId}/introduction`)
}
